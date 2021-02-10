FROM python:3.6.10

RUN mkdir -p /usr/src/backend
WORKDIR /usr/src/backend

RUN pip install pandas flask passlib flask_httpauth flask_cors

ENTRYPOINT [ "flask" ]
CMD ["run", "--host=0.0.0.0", "--port=5000"]

# CMD ["python", "backend.py"]