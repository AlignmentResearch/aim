FROM python:3.12
LABEL org.opencontainers.image.source=https://github.com/AlignmentResearch/aim

RUN apt-get update && apt-get install -y g++ nodejs npm \
    && rm -rf /var/lib/apt/lists/*
RUN pip install Cython==3.0.10 psycopg2 \
    && rm -rf ~/.cache/pip

COPY ./aim/web/ui /opt/aim/web/ui
WORKDIR /opt/aim/web/ui
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

WORKDIR /opt/aim
COPY . .
RUN pip install -r requirements.txt \
    && rm -rf ~/.cache/pip

ENTRYPOINT ["aim"]
CMD ["--help"]
