FROM node:8

WORKDIR /v2x_communication
COPY . /v2x_communication

RUN npm install && npm run build

ENTRYPOINT ["npm", "run"]