require "hanami/api"

class App < Hanami::API
  get "/" do
    "Hello, world"
  end

  get "/ping" do
  	"OK"
  end
end
