FROM node:12
COPY . /watershed-backend
WORKDIR /watershed-backend
RUN yarn && yarn build
EXPOSE 8080
CMD ["yarn", "serve"]

LABEL org.opencontainers.image.source https://github.com/cuhacking/watershed-backend
