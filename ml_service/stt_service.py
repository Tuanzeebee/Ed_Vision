#!/usr/bin/env python3
"""
stt_service.py  –  Offline Speech-to-Text using OpenAI Whisper

Reads raw Float32 PCM audio (16 kHz, mono) from a binary file,
transcribes it with the Whisper "tiny.en" model, and prints JSON.

No ffmpeg needed – audio arrives as a numpy-compatible float32 blob
from the frontend Web Audio API.

Install once:
    pip install openai-whisper

The tiny.en model (~75 MB) is downloaded automatically on first run
and cached in  %USERPROFILE%\\.cache\\whisper  (Windows).
"""

import sys
import json
import os
import numpy as np


def transcribe(pcm_path: str) -> dict:
    try:
        import whisper  # noqa: F401 – lazy import so error is caught cleanly
    except ImportError:
        return {"error": "openai-whisper not installed. Run: pip install openai-whisper"}

    # Read raw float32 PCM bytes written by the frontend (16 kHz, mono)
    audio: np.ndarray = np.fromfile(pcm_path, dtype=np.float32)

    if audio.size == 0:
        return {"error": "empty audio"}

    # Clamp to [-1, 1] just in case
    audio = np.clip(audio, -1.0, 1.0)

    # Load model – "tiny.en" is English-only, ~75 MB, fast on CPU
    model = whisper.load_model("tiny.en")

    result = model.transcribe(
        audio,
        language="en",
        fp16=False,          # CPU inference – no FP16
        temperature=0.0,     # Greedy decoding for speed
        condition_on_previous_text=False,
    )

    text: str = result.get("text", "").strip()
    return {"text": text}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python stt_service.py <pcm_file>"}))
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(json.dumps({"error": f"File not found: {path}"}))
        sys.exit(1)

    try:
        output = transcribe(path)
        print(json.dumps(output, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
