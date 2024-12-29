FROM python:3.12
LABEL org.opencontainers.image.source=https://github.com/AlignmentResearch/aim

RUN apt-get update && apt-get install -y g++ nodejs npm \
    && rm -rf /var/lib/apt/lists/*
RUN pip install Cython==3.0.10 psycopg2 \
    && rm -rf ~/.cache/pip

# Build web UI -- time-consuming and unlikely to be modified
WORKDIR /workspace/aim/web/ui
COPY ./aim/web/ui .
RUN npm install && NODE_OPTIONS=--openssl-legacy-provider npm run build

# install Python dependencies
WORKDIR /workspace
COPY . .
RUN pip install -r requirements.txt \
    && rm -rf ~/.cache/pip

ENTRYPOINT ["aim"]
CMD ["--help"]
