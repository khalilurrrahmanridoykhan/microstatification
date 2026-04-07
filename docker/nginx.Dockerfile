FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY frontend/package*.json /app/
RUN npm install

COPY frontend/ /app/

ARG VITE_BACKEND_URL=http://localhost:8080
ARG VITE_OPENROSA_SERVER_URL=http://localhost:8080/api/openrosa
ARG VITE_ENKETO_URL=https://enketo2.commicplan.com
ARG VITE_ENKETO_API_KEY=9f8c2e4b7a1d4e8
ARG VITE_ENKETO_AUTH_SCHEME=token

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_OPENROSA_SERVER_URL=$VITE_OPENROSA_SERVER_URL \
    VITE_ENKETO_URL=$VITE_ENKETO_URL \
    VITE_ENKETO_API_KEY=$VITE_ENKETO_API_KEY \
    VITE_ENKETO_AUTH_SCHEME=$VITE_ENKETO_AUTH_SCHEME

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
