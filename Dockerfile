FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port (Fly.io uses $PORT env var)
EXPOSE 8080

# Start server with migrations
CMD ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p $PORT backend.asgi:application"]