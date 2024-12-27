FROM python:3.12
LABEL org.opencontainers.image.source=https://github.com/AlignmentResearch/aim

RUN apt-get update && apt-get install -y g++ \
    && rm -rf /var/lib/apt/lists/*

COPY . /opt/aim
WORKDIR /opt/aim
RUN pip install Cython==3.0.10 psycopg2 -r requirements.txt \
    && rm -rf ~/.cache/pip

ENTRYPOINT ["aim"]
CMD ["--help"]
