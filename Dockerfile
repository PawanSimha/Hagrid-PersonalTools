FROM python:3.14-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.14-slim

RUN groupadd -r hagrid && useradd -r -g hagrid -d /app -s /bin/false hagrid

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.14/site-packages /usr/local/lib/python3.14/site-packages
COPY . .

RUN chown -R hagrid:hagrid /app

USER hagrid
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
