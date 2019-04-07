FROM node:8

WORKDIR /experiments_knowledge_service
COPY . /experiments_knowledge_service

ENV NODE_ENV prod

RUN npm install && npm run build

ENTRYPOINT ["npm", "run"]