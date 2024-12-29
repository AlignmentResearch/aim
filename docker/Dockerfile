FROM python:3.12
LABEL org.opencontainers.image.source=https://github.com/AlignmentResearch/aim

RUN apt-get update && apt-get install -y g++ nodejs \
    && rm -rf /var/lib/apt/lists/*
RUN pip install Cython==3.0.10 psycopg2 \
    && rm -rf ~/.cache/pip

COPY . /opt/aim
WORKDIR /opt/aim/web/ui
RUN npm run build
WORKDIR /opt/aim
RUN pip install -r requirements.txt \
    && rm -rf ~/.cache/pip

ENTRYPOINT ["aim"]
CMD ["--help"]
