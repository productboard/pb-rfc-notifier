class CountRequestsMiddleware
	def initialize(app)
    @app = app
  end

  def call(env)
    req = Rack::Request.new(env)

    unless req.path == '/ping'
      Yabeda.request_count.increment({path: req.path}, by: 1)
    end

    @app.call(env)
  end
end
