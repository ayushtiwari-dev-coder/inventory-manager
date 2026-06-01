# ==========================================
# STAGE 1: COMPILE FRONTEND REACT SOURCE
# ==========================================
FROM node:20 AS frontend-builder
WORKDIR /app/frontend

# Copy package configurations first to optimize Docker caching layers
COPY frontend_react/package*.json ./
RUN npm install

# Build static production assets using Vite
COPY frontend_react/ ./
RUN npm run build

# ==========================================
# STAGE 2: BUILD BACKEND AND INTEGRATE FRONTEND
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install native build tools required to compile dependencies like bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install your Python dependency packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy over your full Python backend source layers
COPY . .

# Extract the compiled React assets from Stage 1 into the backend container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Inform Docker that Hugging Face Spaces route public traffic over port 7860
EXPOSE 7860

# Run Uvicorn pointing directly to your app instance inside main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]