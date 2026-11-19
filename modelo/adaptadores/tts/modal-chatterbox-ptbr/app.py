"""
Modal deployment for Chatterbox Multilingual pt-BR (Resemble AI, MIT).

Brazilian Portuguese finetune of Chatterbox V3. Qwen3-TTS's Portuguese comes out
with a European accent; this model is trained on Brazilian speech.

The inference code is the one Resemble ships in its pt-BR demo Space (pinned
revision below). It is NOT the PyPI `chatterbox-tts` package: the Space code
loads the pt-BR T3 checkpoint with its larger text vocabulary (2454), which the
PyPI loader does not. Do not add `chatterbox-tts` to the image: the Space's
`chatterbox/` folder is a namespace package and a real install would shadow it.

The reference audio decides timbre AND prosody: only its first 6 s feed the
speech-token prompt and its first 10 s the decoder. Use a clean Brazilian
reference that starts speaking immediately.

Every output carries Resemble's inaudible Perth watermark (AI-generated audio).

Deploy:
    modal deploy docker/modal-chatterbox-ptbr/app.py

Request (POST JSON):
    text             str | list[str]  Text to speak. Each item is split into
                                      sentences, generated one by one with the
                                      same voice, and joined with `gap_seconds`.
    ref_audio_url    str (optional)   Reference voice. Default: Resemble's
                                      pt_br_f2 demo prompt (female).
    ref_audio_base64 str (optional)
    exaggeration     float 0.25-2.0 (default 0.5)
    cfg_weight       float 0-1 (default 0.5; 0 reduces accent transfer from ref)
    temperature      float (default 0.8)
    seed             int (default 42; 0 = random)
    gap_seconds      float (default 0.25)
    output_format    "mp3" | "wav" (default mp3)
    r2               dict (optional)  Upload results to R2 instead of base64.

Response: {success, outputs: [{duration_seconds, audio_url|audio_base64, r2_key?}]}
plus top-level copies of the first output's keys for single-text requests.
"""

import modal

SPACE_REPO = "ResembleAI/Chatterbox-Multilingual-TTS-pt-br"
SPACE_REV = "9e515821e826e207cd617a0fdd0223899ed108ea"
PTBR_REPO = "ResembleAI/Chatterbox-Multilingual-pt-br"
PTBR_REV = "b3952f18bc2eaa72b9bd7c17d2c4653bcad4770d"
BASE_REPO = "ResembleAI/chatterbox"
BASE_REV = "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18"

CODE_DIR = "/opt/cbx"
CKPT_DIR = "/opt/cbx-ckpt"
DEFAULT_REF_URL = (
    "https://storage.googleapis.com/chatterbox-demo-samples/"
    "mtl-v3-single-language-prompts/pt-br/pt_br_f2.wav"
)


def _fetch_code_and_weights():
    """Build step: pinned Space code + the five checkpoint files in one folder."""
    import shutil
    from pathlib import Path

    from huggingface_hub import hf_hub_download, snapshot_download

    snapshot_download(SPACE_REPO, repo_type="space", revision=SPACE_REV,
                      local_dir=CODE_DIR, allow_patterns=["chatterbox/**"])
    ck = Path(CKPT_DIR)
    ck.mkdir(parents=True, exist_ok=True)
    for repo, rev, name in [
        (BASE_REPO, BASE_REV, "ve.pt"),
        (BASE_REPO, BASE_REV, "conds.pt"),
        (PTBR_REPO, PTBR_REV, "grapheme_mtl_merged_expanded_v1.json"),
        (PTBR_REPO, PTBR_REV, "t3_pt_br.safetensors"),
        (PTBR_REPO, PTBR_REV, "s3gen_v3.pt"),
    ]:
        shutil.copy(hf_hub_download(repo, name, revision=rev), ck / name)
    print(sorted(f.name for f in ck.iterdir()))


def _check_load():
    """Build step: fail the build, not the first request, if loading breaks."""
    import sys

    sys.path.insert(0, CODE_DIR)
    from chatterbox.src.chatterbox.tts import ChatterboxTTS

    m = ChatterboxTTS.from_local(CKPT_DIR, "cpu")
    print("load ok, sr =", m.sr)


image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install(
        "torch==2.8.0",
        "torchaudio==2.8.0",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .pip_install(
        # Mirrors the Space's requirements.txt, minus gradio/spaces.
        "numpy==1.26.0",
        "resampy==0.4.3",
        "librosa==0.10.0",
        "s3tokenizer",
        "transformers==4.46.3",
        "diffusers==0.29.0",
        "omegaconf==2.3.0",
        "resemble-perth==1.0.1",
        "silero-vad==5.1.2",
        "conformer==0.3.2",
        "safetensors",
        "huggingface_hub<0.26",  # diffusers 0.29 imports cached_download
        "soundfile",
        "boto3",
        "requests",
        "fastapi[standard]",
    )
    .run_function(_fetch_code_and_weights)
    .run_function(_check_load)
)

app = modal.App("video-toolkit-chatterbox-ptbr")


def _split_sentences(text: str, max_chars: int = 240) -> list[str]:
    """One chunk per sentence; a sentence over max_chars is split on commas."""
    import re

    chunks: list[str] = []
    for sentence in re.split(r"(?<=[.!?])\s+", text.strip()):
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(sentence) <= max_chars:
            chunks.append(sentence)
            continue
        current = ""
        for part in re.split(r"(?<=,)\s+", sentence):
            if current and len(current) + 1 + len(part) > max_chars:
                chunks.append(current)
                current = part
            else:
                current = f"{current} {part}".strip()
        if current:
            chunks.append(current)
    return chunks


@app.cls(image=image, gpu="A10G", timeout=600, scaledown_window=60)
@modal.concurrent(max_inputs=1)
class ChatterboxPtBR:

    @modal.enter()
    def load(self):
        import sys

        import torch

        sys.path.insert(0, CODE_DIR)
        from chatterbox.src.chatterbox.tts import ChatterboxTTS

        print(f"CUDA: {torch.cuda.is_available()}")
        self.model = ChatterboxTTS.from_local(CKPT_DIR, "cuda")
        print("Chatterbox pt-BR loaded")

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict) -> dict:
        import base64
        import random
        import shutil
        import subprocess
        import tempfile
        import time
        import traceback
        import uuid
        from pathlib import Path

        import numpy as np
        import requests as req
        import soundfile as sf
        import torch

        start = time.time()
        text_in = request.get("text")
        if not text_in:
            return {"error": "Missing required field: text"}
        is_batch = isinstance(text_in, list)
        texts = text_in if is_batch else [text_in]
        if any(not isinstance(t, str) or not t.strip() for t in texts):
            return {"error": "text must be a non-empty string or list of strings"}

        exaggeration = float(request.get("exaggeration", 0.5))
        cfg_weight = float(request.get("cfg_weight", 0.5))
        temperature = float(request.get("temperature", 0.8))
        seed = int(request.get("seed", 42))
        gap = float(request.get("gap_seconds", 0.25))
        output_format = request.get("output_format", "mp3")
        r2_config = request.get("r2")

        job_id = uuid.uuid4().hex[:12]
        work = Path(tempfile.mkdtemp(prefix=f"cbx_{job_id}_"))
        try:
            ref_path = work / "ref.wav"
            if request.get("ref_audio_base64"):
                data = request["ref_audio_base64"]
                ref_path.write_bytes(base64.b64decode(data.split(",", 1)[-1]))
            else:
                resp = req.get(request.get("ref_audio_url") or DEFAULT_REF_URL, timeout=300)
                resp.raise_for_status()
                ref_path.write_bytes(resp.content)

            if seed:
                random.seed(seed)
                np.random.seed(seed)
                torch.manual_seed(seed)
                torch.cuda.manual_seed_all(seed)

            # Voice conditioning once per request; every sentence reuses it.
            self.model.prepare_conditionals(str(ref_path), exaggeration=exaggeration)
            sr = self.model.sr
            silence = np.zeros(int(gap * sr), dtype=np.float32)

            outputs = []
            for i, text in enumerate(texts):
                pieces = []
                chunks = _split_sentences(text)
                for j, chunk in enumerate(chunks):
                    wav = self.model.generate(
                        chunk,
                        exaggeration=exaggeration,
                        cfg_weight=cfg_weight,
                        temperature=temperature,
                        language_id="pt",
                    )
                    pieces.append(wav.squeeze(0).cpu().numpy().astype(np.float32))
                    if j < len(chunks) - 1:
                        pieces.append(silence)
                    print(f"  text {i + 1}/{len(texts)} chunk {j + 1}/{len(chunks)}")
                audio = np.concatenate(pieces)

                base = f"output_{i}"
                wav_path = work / f"{base}.wav"
                sf.write(str(wav_path), audio, sr)
                if output_format == "mp3":
                    out_path = work / f"{base}.mp3"
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame",
                         "-b:a", "192k", str(out_path)],
                        capture_output=True, timeout=120, check=True,
                    )
                    content_type = "audio/mpeg"
                else:
                    out_path, content_type = wav_path, "audio/wav"

                item = {"duration_seconds": round(len(audio) / sr, 2), "chunks": len(chunks)}
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
                    key = f"chatterbox-ptbr/results/{job_id}_{i}{out_path.suffix}"
                    client.upload_file(str(out_path), r2_config["bucket_name"], key,
                                       ExtraArgs={"ContentType": content_type})
                    item["audio_url"] = client.generate_presigned_url(
                        "get_object", Params={"Bucket": r2_config["bucket_name"], "Key": key},
                        ExpiresIn=7200,
                    )
                    item["r2_key"] = key
                else:
                    item["audio_base64"] = base64.b64encode(out_path.read_bytes()).decode()
                outputs.append(item)

            result = {
                "success": True,
                "processing_time_seconds": round(time.time() - start, 2),
                "outputs": outputs,
            }
            if not is_batch:
                result.update({k: v for k, v in outputs[0].items()})
            return result
        except Exception as e:
            print(traceback.format_exc())
            return {"error": f"Internal error: {e}"}
        finally:
            shutil.rmtree(work, ignore_errors=True)
