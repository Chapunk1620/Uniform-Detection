FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Prevents Python from writing pyc files
    # And ensures output is sent straight to terminal

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Collect static files (if any)
# RUN python manage.py collectstatic --noinput

# Expose port (Railway uses $PORT)
EXPOSE 8080

# Command to run on container start
# We use gunicorn for production, but for development/testing we can use Daphne as before.
# However, Railway recommends using gunicorn for Python web apps.
# Our Procfile uses gunicorn, so we can use the same here or keep Daphne for ASGI.
# Since we are using Daphne (for channels) in development, let's keep it for consistency.
# But note: gunicorn with uvicorn worker might be better for ASGI? Actually Daphne is for ASGI.
# We'll stick with Daphne as in the original Dockerfile.
CMD ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p $PORT backend.asgi:application"]
