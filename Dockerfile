FROM debian:buster

RUN apt-get update

RUN apt-get install -y wget

RUN wget https://repo.anaconda.com/miniconda/Miniconda3-py37_4.8.3-Linux-x86_64.sh

RUN bash Miniconda3-py37_4.8.3-Linux-x86_64.sh -b

COPY source source

CMD ["cat", "source/backend.py"]
