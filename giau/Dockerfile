FROM node:8

WORKDIR /giau
COPY . /giau

ENV NODE_ENV prod

RUN npm install && npm run build

ENTRYPOINT ["npm", "run"]