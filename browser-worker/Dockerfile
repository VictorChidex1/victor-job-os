FROM node:22-bookworm-slim

WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
  && npm prune --omit=dev \
  && npx playwright install --with-deps chromium

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/server.js"]
