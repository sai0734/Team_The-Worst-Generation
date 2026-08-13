# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_KAKAO_REST_API_KEY
ARG VITE_KAKAO_MAP_API_KEY
ENV VITE_KAKAO_REST_API_KEY=$VITE_KAKAO_REST_API_KEY
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- run stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
