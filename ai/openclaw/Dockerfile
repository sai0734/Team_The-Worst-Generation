FROM node:24-alpine
WORKDIR /app

RUN npm install -g openclaw@latest

# 실제 실행/스케줄 방식은 아직 미정이라, 컨테이너를 계속 살려두고
# 필요한 명령은 `docker compose exec openclaw ...`로 그때그때 실행합니다.
CMD ["tail", "-f", "/dev/null"]
