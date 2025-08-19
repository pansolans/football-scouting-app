#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install wheel
pip install fastapi==0.104.1
pip install "uvicorn[standard]==0.24.0"
pip install supabase==2.0.2
pip install httpx==0.25.2
pip install pydantic==2.4.2
pip install pydantic-settings==2.0.3
pip install python-dotenv==1.0.0
pip install python-multipart==0.0.6