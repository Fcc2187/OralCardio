FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

RUN addgroup --system oralcardio && adduser --system --ingroup oralcardio oralcardio

COPY requirements.txt ./
RUN python -m pip install --upgrade pip && python -m pip install -r requirements.txt

COPY app ./app

USER oralcardio
EXPOSE 8000

# O provedor injeta PORT. O processo não executa migrations: elas pertencem ao
# pipeline controlado do Supabase e nunca ao startup de uma instância web.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 2 --proxy-headers"]
