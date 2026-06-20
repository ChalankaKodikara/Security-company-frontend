FROM node:21-slim AS dependencies

WORKDIR /app
COPY package*.json ./

# Cache node_modules
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Stage 2: Build
FROM dependencies AS builder
WORKDIR /app
COPY . .

ENV NODE_OPTIONS="--max_old_space_size=4096"
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=true

RUN npm run build

# Stage 3: Production
FROM nginx:stable-alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]