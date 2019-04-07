FROM ubuntu:18.04

# Install Node.js 8 and npm 5
RUN apt-get update
RUN apt-get -qq update
RUN apt-get install -y build-essential
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs
RUN apt install -y ssh
RUN apt-get -y install rsync

WORKDIR /benchmark_framework
COPY . /benchmark_framework

RUN npm install && npm run build

RUN mkdir ~/.ssh


ENTRYPOINT ["npm", "run"]