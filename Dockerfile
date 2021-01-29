FROM node:14-alpine
COPY . /watershed-backend
WORKDIR /watershed-backend
RUN yarn && yarn build

RUN apk add git

EXPOSE 8080
CMD ["yarn", "serve"]

LABEL org.opencontainers.image.source https://github.com/cuhacking/watershed-backend
