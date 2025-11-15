FROM python:3.13-slim

ARG PORT="8000"
ARG WORKERS="3"
ARG OPENAPI_URL="/openapi.json"
ENV PORT=${PORT}
ENV WORKERS=${WORKERS}
ENV OPENAPI_URL=${OPENAPI_URL}

WORKDIR /app

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY /src .
COPY gunicorn_conf.py .

EXPOSE ${PORT}

ENTRYPOINT ["gunicorn", "main:app", "-c", "gunicorn_conf.py"]