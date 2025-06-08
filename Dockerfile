FROM node:22.2.0 as base

RUN apt-get update -y; apt-get install -y nano cron ; apt-get upgrade -y

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
						leaflet-geometryutil \
						react-bootstrap \
						jest-canvas-mock \
                        react-datetime \
                        proj4 \
                        proj4leaflet
COPY argovis/src src
COPY argovis/public public
COPY argovis/package.json package.json
COPY generate_argo_sitemap.sh generate_argo_sitemap.sh 

# Latest releases available at https://github.com/aptible/supercronic/releases
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.30/supercronic-linux-amd64 \
    SUPERCRONIC=supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=9f27ad28c5c57cd133325b2a66bba69ba2235799
RUN curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

FROM base as prod
RUN npm run build
RUN npm install -g serve
RUN cd /react && npm uninstall create-react-app
COPY crontab crontab
COPY entrypoint.sh entrypoint.sh
RUN chown -R 1000660000 /react/argovis ; chmod 777 generate_argo_sitemap.sh
CMD ["bash", "entrypoint.sh"]
USER 1000660000

FROM base as dev
RUN rm /react/argovis/src/App*
CMD service cron start ; npm start
