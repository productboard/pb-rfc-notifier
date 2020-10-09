# frozen_string_literal: true

require "bundler/setup"
require "yabeda/prometheus"

require_relative "app.rb"
require_relative "libs/count_request_middleware.rb"

Yabeda.configure do
  counter :request_count,
          comment: 'A counter of requests',
          tags: %i[path]
end

Yabeda.configure!
Yabeda::Prometheus::Exporter.start_metrics_server!

use CountRequestsMiddleware
run App.new
