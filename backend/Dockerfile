# Use an official Python runtime as a parent image
FROM python:3.11-slim-bookworm

# Install system dependencies (needed for Sherlock and other tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY backend/ .


# Exposure the port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Start command (shell form for better variable expansion)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
