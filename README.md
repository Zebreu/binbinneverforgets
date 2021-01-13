# Binbin never forgets
As if you had the memory and discipline of a venerable wizard

## To build the image

Execute the following command in the same directory as the file `Dockerfile`

`docker build -t binbinproject .`

## To execute the image

`docker run -p 5000:5000 binbinproject`

## Deployment

`cd source && python backend.py`

`cd simpleone && npm start`

## Usage

Hit the routes defined in backend.py with your browser, a RESTful api tool, or Python requests.
