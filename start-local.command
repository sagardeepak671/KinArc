#!/bin/bash
set -e
cd "$(dirname "$0")"
OLLAMA_BIN="$(command -v ollama || true)"
if [ -z "$OLLAMA_BIN" ]; then
  OLLAMA_BIN="$HOME/Library/Application Support/KinArc/Ollama.app/Contents/Resources/ollama"
fi
if [ ! -x "$OLLAMA_BIN" ]; then
  echo "Install Ollama from https://ollama.com/download then run this script again."
  exit 1
fi
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null; then
  "$OLLAMA_BIN" serve > /tmp/kinarc-ollama.log 2>&1 &
  sleep 3
fi
if ! "$OLLAMA_BIN" show qwen2.5:3b >/dev/null 2>&1; then
  "$OLLAMA_BIN" pull qwen2.5:3b
fi
if [ ! -x .venv/bin/python ]; then python3 -m venv .venv; fi
if ! .venv/bin/python -c 'import piper' >/dev/null 2>&1; then
  .venv/bin/pip install -r requirements-local.txt
fi
mkdir -p models
if [ ! -f models/en_US-lessac-medium.onnx ] || [ ! -f models/en_US-lessac-medium.onnx.json ]; then
  (cd models && ../.venv/bin/python -m piper.download_voices en_US-lessac-medium)
fi
exec .venv/bin/python local_server.py
