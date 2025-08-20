# Use Ubuntu as base image
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV LLAMA_CUBLAS=0
ENV LLAMA_METAL=0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    libcurl4-openssl-dev \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Clone and build llama.cpp
WORKDIR /app
RUN git clone https://github.com/ggerganov/llama.cpp.git
WORKDIR /app/llama.cpp

# Build llama.cpp without CUDA using CMake
RUN mkdir build && cd build && \
    cmake .. -DLLAMA_METAL=OFF -DLLAMA_CUBLAS=OFF -DLLAMA_AVX=ON -DLLAMA_AVX2=ON && \
    cmake --build . --config Release

# Create directory for models
RUN mkdir -p /app/models

# Copy local Gemma3 GGUF model
WORKDIR /app/models
COPY gemma-3-4b-it-Q8_0.gguf /app/models/

# Copy Python requirements and install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy the entrypoint.py file
COPY entrypoint.py .

# Create startup script that runs llama-server in background and then entrypoint.py
WORKDIR /
RUN echo '#!/bin/bash\ncd /app/llama.cpp/build/bin\n./llama-server -m /app/models/gemma-3-4b-it-Q8_0.gguf -c 2048 --host 0.0.0.0 --port 8080 &\ncd /app\npython3 entrypoint.py' > start.sh && \
    chmod +x start.sh

# Expose ports for both llama-server and the web server
EXPOSE 8080 8081

# Start both services
CMD ["./start.sh"] 