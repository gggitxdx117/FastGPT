# sudo docker build -f /home/ubuntu/fastgpt/fastgpt.gpt/projects/app/Dockerfile -t dockername/fastgpt:v4.8.11 --build-arg proxy=1 --build-arg https_proxy=http://172.16.1.11:7890 --build-arg http_proxy=http://172.16.1.11:7890 --build-arg all_proxy=socks5://172.16.1.11:7891 /home/ubuntu/fastgpt/fastgpt.gpt/

# --------- install dependence -----------
FROM node:20.14.0-alpine AS maindeps
WORKDIR /app

ARG proxy
ARG https_proxy
ARG http_proxy
ARG all_proxy

ENV https_proxy=${https_proxy}
ENV http_proxy=${http_proxy}
ENV all_proxy=${all_proxy}

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache libc6-compat && npm install -g pnpm@9.4.0
# if proxy exists, set proxy
RUN [ -z "$proxy" ] || pnpm config set registry https://registry.npmmirror.com

# copy packages and one project
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ./packages ./packages
COPY ./projects/app/package.json ./projects/app/package.json

RUN [ -f pnpm-lock.yaml ] || (echo "Lockfile not found." && exit 1)

RUN pnpm i

# --------- builder -----------
FROM node:20.14.0-alpine AS builder
WORKDIR /app

ARG proxy
ARG https_proxy
ARG http_proxy
ARG all_proxy

ENV https_proxy=${https_proxy}
ENV http_proxy=${http_proxy}
ENV all_proxy=${all_proxy}

# copy common node_modules and one project node_modules
COPY package.json pnpm-workspace.yaml .npmrc tsconfig.json ./
COPY --from=maindeps /app/node_modules ./node_modules
COPY --from=maindeps /app/packages ./packages
COPY ./projects/app ./projects/app
COPY --from=maindeps /app/projects/app/node_modules ./projects/app/node_modules

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache libc6-compat && npm install -g pnpm@9.4.0

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm --filter=app build

# --------- runner -----------
FROM node:20.14.0-alpine AS runner
WORKDIR /app

ARG proxy
ARG https_proxy
ARG http_proxy
ARG all_proxy

ENV https_proxy=${https_proxy}
ENV http_proxy=${http_proxy}
ENV all_proxy=${all_proxy}

# create user and use it
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache curl ca-certificates \
  && update-ca-certificates

# copy running files
COPY --from=builder /app/projects/app/public /app/projects/app/public
COPY --from=builder /app/projects/app/next.config.js /app/projects/app/next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/standalone /app/
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/static /app/projects/app/.next/static
# copy server chunks
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/server/chunks /app/projects/app/.next/server/chunks
# copy worker
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/.next/server/worker /app/projects/app/.next/server/worker

# copy standload packages
COPY --from=maindeps /app/node_modules/tiktoken ./node_modules/tiktoken
RUN rm -rf ./node_modules/tiktoken/encoders
COPY --from=maindeps /app/node_modules/@zilliz/milvus2-sdk-node ./node_modules/@zilliz/milvus2-sdk-node

# copy package.json to version file
COPY --from=builder /app/projects/app/package.json ./package.json 
# copy config
COPY ./projects/app/data /app/data

RUN chown -R nextjs:nodejs /app/data

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

USER nextjs

ENV serverPath=./projects/app/server.js

ENTRYPOINT ["sh","-c","node --max-old-space-size=4096 ${serverPath}"]