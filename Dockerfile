# should correspond with .ruby-version file
FROM ruby:2.7.1-slim

# Install dependencies missing in ruby-slim image
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     # common
#     build-essential git \
#     # nokogiri
#     libxml2-dev libxslt-dev \
#     # postgres
#     libpq-dev \
#     # wkhtmltopdf (potential other dependencies `xvfb libfontconfig`)
#     wkhtmltopdf \
#     # imagemagick
#     imagemagick \
#     # dependencies for curb gem
#     curl libcurl4-openssl-dev \
#     # python and aws cli needed to dump schema into s3
#     python python-pip python-setuptools \
#     && pip install awscli \
#     # cleanup cache after installation
#     && apt-get clean

# Create and set working directory
WORKDIR /usr/src/app

# Build args and default Rails runtime variables
# ARG RAILS_ENV
# ARG RAILS_LOG_TO_STDOUT
# ARG RAILS_SERVE_STATIC_FILES
# ARG BUNDLE_GEMS__CONTRIBSYS__COM

# ENV RAILS_ENV="${RAILS_ENV:-production}" \
#     RAILS_SERVE_STATIC_FILES="${RAILS_SERVE_STATIC_FILES:-true}" \
#     RAILS_LOG_TO_STDOUT="${RAILS_LOG_TO_STDOUT:-true}" \
#     BUNDLE_GEMS__CONTRIBSYS__COM="${BUNDLE_GEMS__CONTRIBSYS__COM}"

# Variables required just for assets pipeline
# ARG APP_DEFAULT_URL
# ARG DATABASE_URL
# ARG REDIS_URL

# Copy Gemfile and install gem dependencies (copied separately to use docker caching)
COPY Gemfile Gemfile.lock /usr/src/app/

RUN bundle config --global frozen 1 && \
    bundle config set without 'development test' && \
    bundle install

# Copy rest of application
COPY . /usr/src/app

# # Build assets
# RUN bundle exec rake \
#     RAILS_ENV="${RAILS_ENV}" \
#     RAILS_LOG_TO_STDOUT="${RAILS_LOG_TO_STDOUT}" \
#     DATABASE_URL="${DATABASE_URL:-TODO_MISSING}" \
#     REDIS_URL="${REDIS_URL:-TODO_MISSING}" \
#     APP_DEFAULT_URL="${APP_DEFAULT_URL:-TODO_MISSING}" \
#     SEGMENT_IO_KEY=fake \
#     SEGMENT_IO_PB_PORTAL_KEY=fake \
#     SEGMENT_IO_PORTAL_KEY=fake \
#     SEGMENT_IO_ERROR_PAGES_KEY=fake \
#     PUSHER_URL=fake \
#     assets:precompile

# TODO: figure out how to add custom user & run as custom user
