FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    git \
    libcairo2-dev \
    pkg-config \
    python3-dev \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /lingvo

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
