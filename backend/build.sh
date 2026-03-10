#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install wheel setuptools

# Instalar versiones específicas compatibles
pip install fastapi==0.104.1
pip install "uvicorn[standard]==0.24.0"
pip install httpx==0.24.1
pip install supabase==2.0.2
pip install pydantic==1.10.13
pip install python-dotenv==1.0.0
pip install python-multipart==0.0.6