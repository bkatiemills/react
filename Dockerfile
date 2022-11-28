FROM node:18.9

RUN apt-get update -y; apt-get install -y nano

WORKDIR /react
RUN npm install react react-dom create-react-app
RUN npx create-react-app argovis
WORKDIR /react/argovis
RUN npm install --force react-leaflet \
						leaflet \
						react-leaflet-draw \
						react-router-dom \
						chroma-js \
						react-autosuggest \
						react-plotly.js \
						plotly.js \
						leaflet-geometryutil
COPY argovis/src src
COPY argovis/public public
CMD npm start