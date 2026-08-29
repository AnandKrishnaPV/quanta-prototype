# Stage 1: Build the frontend (Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend (FastAPI + Qiskit)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    qiskit \
    qiskit-aer \
    psutil \
    pydantic \
    firebase-admin \
    google-genai \
    numpy

# Copy backend source code
COPY backend.py .
COPY serviceAccountKey.json .

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port 8000
EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
