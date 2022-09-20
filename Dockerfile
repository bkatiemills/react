FROM node:18.9

RUN apt-get update -y; apt-get install -y nano

RUN mkdir /react ; cd /react ; npm install react react-dom create-react-app

