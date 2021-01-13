FROM debian:buster

RUN apt-get update

RUN apt-get install -y wget

RUN wget https://repo.anaconda.com/miniconda/Miniconda3-py37_4.8.3-Linux-x86_64.sh

RUN bash Miniconda3-py37_4.8.3-Linux-x86_64.sh -b

RUN /root/miniconda3/bin/pip install pandas

RUN /root/miniconda3/bin/pip install flask

COPY source source

WORKDIR source

RUN mkdir templates

COPY /simpleone/build templates


CMD ["/root/miniconda3/bin/python", "backend.py"]
