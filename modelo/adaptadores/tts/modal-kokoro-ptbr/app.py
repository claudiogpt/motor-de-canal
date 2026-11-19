"""
Modal deployment for Kokoro-82M (Apache-2.0) in Brazilian Portuguese, CPU only.

Fixed voices, no cloning. Default voice is `pm_santa` (older male); the other
pt-BR voices are `pm_alex` (male) and `pf_dora` (female). Runs the ONNX build
(kokoro-onnx) on CPU: no GPU, so it costs a fraction of the GPU apps.

Deploy:
    modal deploy docker/modal-kokoro-ptbr/app.py

Request (POST JSON), same shape as the Chatterbox pt-BR app:
    text           str | list[str]
    voice          str (default pm_santa)
    speed          float (default 1.1; Kokoro's native speed, 0.5-2.0)
    gap_seconds    float (default 0.3) pause between sentences of one text
    output_format  "mp3" | "wav" (default wav)
    r2             dict (optional)  Upload results to R2 instead of base64.

Response: {success, outputs: [{duration_seconds, audio_url|audio_base64, r2_key?}]}
"""

import modal

MODEL_URL = ("https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
             "model-files-v1.0/kokoro-v1.0.onnx")
MODEL_SHA256 = "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5"
VOICES_URL = ("https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
              "model-files-v1.0/voices-v1.0.bin")
VOICES_SHA256 = "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"
MODEL_DIR = "/opt/kokoro"
DEFAULT_VOICE = "pm_santa"


def _fetch_model():
    """Build step: download the pinned model files and check their hashes."""
    import hashlib
    from pathlib import Path

    import requests

    Path(MODEL_DIR).mkdir(parents=True, exist_ok=True)
    for url, sha in [(MODEL_URL, MODEL_SHA256), (VOICES_URL, VOICES_SHA256)]:
        dst = Path(MODEL_DIR) / url.rsplit("/", 1)[1]
        with requests.get(url, stream=True, timeout=600) as r:
            r.raise_for_status()
            h = hashlib.sha256()
            with open(dst, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
                    h.update(chunk)
        if h.hexdigest() != sha:
            raise RuntimeError(f"checksum mismatch for {dst.name}")
        print(dst.name, "ok")

    from kokoro_onnx import Kokoro

    k = Kokoro(f"{MODEL_DIR}/kokoro-v1.0.onnx", f"{MODEL_DIR}/voices-v1.0.bin")
    k.create("Teste.", voice=DEFAULT_VOICE, lang="pt-br")
    print("load ok")


image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "kokoro-onnx==0.6.1",
        "onnxruntime==1.31.0",
        "soundfile",
        "numpy",
        "boto3",
        "requests",
        "fastapi[standard]",
    )
    .run_function(_fetch_model)
)

app = modal.App("video-toolkit-kokoro-ptbr")


@app.cls(image=image, cpu=4, memory=4096, timeout=600, scaledown_window=60)
@modal.concurrent(max_inputs=1)
class KokoroPtBR:

    @modal.enter()
    def load(self):
        from kokoro_onnx import Kokoro

        self.k = Kokoro(f"{MODEL_DIR}/kokoro-v1.0.onnx", f"{MODEL_DIR}/voices-v1.0.bin")
        self.voices = [v for v in self.k.get_voices() if v.startswith(("pm_", "pf_"))]
        print("Kokoro loaded, pt-BR voices:", self.voices)

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict) -> dict:
        import base64
        import re
        import shutil
        import subprocess
        import tempfile
        import time
        import traceback
        import uuid
        from pathlib import Path

        import numpy as np
        import soundfile as sf

        start = time.time()
        text_in = request.get("text")
        if not text_in:
            return {"error": "Missing required field: text"}
        is_batch = isinstance(text_in, list)
        texts = text_in if is_batch else [text_in]
        if any(not isinstance(t, str) or not t.strip() for t in texts):
            return {"error": "text must be a non-empty string or list of strings"}

        voice = request.get("voice", DEFAULT_VOICE)
        if voice not in self.voices:
            return {"error": f"unknown voice {voice!r}; pt-BR voices: {self.voices}"}
        speed = float(request.get("speed", 1.1))
        gap = float(request.get("gap_seconds", 0.3))
        output_format = request.get("output_format", "wav")
        r2_config = request.get("r2")

        job_id = uuid.uuid4().hex[:12]
        work = Path(tempfile.mkdtemp(prefix=f"kokoro_{job_id}_"))
        try:
            outputs = []
            for i, text in enumerate(texts):
                sentences = [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]
                pieces, sr = [], 24000
                for j, s in enumerate(sentences):
                    audio, sr = self.k.create(s, voice=voice, speed=speed, lang="pt-br")
                    pieces.append(audio.astype(np.float32))
                    if j < len(sentences) - 1:
                        pieces.append(np.zeros(int(gap * sr), dtype=np.float32))
                audio = np.concatenate(pieces)

                wav_path = work / f"output_{i}.wav"
                sf.write(str(wav_path), audio, sr)
                if output_format == "mp3":
                    out_path = work / f"output_{i}.mp3"
                    subprocess.run(["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame",
                                    "-b:a", "192k", str(out_path)],
                                   capture_output=True, timeout=120, check=True)
                    content_type = "audio/mpeg"
                else:
                    out_path, content_type = wav_path, "audio/wav"

                item = {"duration_seconds": round(len(audio) / sr, 2), "chunks": len(sentences)}
                if r2_config:
                    import boto3
                    from botocore.config import Config

                    client = boto3.client(
                        "s3",
                        endpoint_url=r2_config["endpoint_url"],
                        aws_access_key_id=r2_config["access_key_id"],
                        aws_secret_access_key=r2_config["secret_access_key"],
                        config=Config(signature_version="s3v4"),
                    )
                    key = f"kokoro-ptbr/results/{job_id}_{i}{out_path.suffix}"
                    client.upload_file(str(out_path), r2_config["bucket_name"], key,
                                       ExtraArgs={"ContentType": content_type})
                    item["audio_url"] = client.generate_presigned_url(
                        "get_object", Params={"Bucket": r2_config["bucket_name"], "Key": key},
                        ExpiresIn=7200)
                    item["r2_key"] = key
                else:
                    item["audio_base64"] = base64.b64encode(out_path.read_bytes()).decode()
                outputs.append(item)

            result = {"success": True, "voice": voice,
                      "processing_time_seconds": round(time.time() - start, 2),
                      "outputs": outputs}
            if not is_batch:
                result.update(outputs[0])
            return result
        except Exception as e:
            print(traceback.format_exc())
            return {"error": f"Internal error: {e}"}
        finally:
            shutil.rmtree(work, ignore_errors=True)
