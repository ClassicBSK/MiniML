FROM python:3.13.3 AS base

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 8000

# Run FastAPI app (use your actual entry file name instead of app.py if different)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]