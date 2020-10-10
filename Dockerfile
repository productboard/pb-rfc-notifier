FROM node:12.19-alpine

WORKDIR /usr/src/app

# copy files for install dependencies (to cache by separate layer)
COPY package.json yarn.lock /usr/src/app/

# install and clean
RUN yarn && \
    rm -fr /tmp/yarn* && \
    rm -fr /usr/local/share/.cache

# copy app
COPY . /usr/src/app

# build TS and clean
RUN yarn build && \ 
    rm -fr /tmp/yarn* && \
    rm -fr /usr/local/share/.cache
