# Blueprint for backend services in Ruby
## Starging a new service? You've come to the right place!

[The purpose of this repository](https://github.com/productboard/pb-blueprint-ruby/issues/2)

## Howto
Feel free to use the green "Use this template" button to bootstrap a new service based on this repo. [[GitHub help](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template)]
![](https://docs.github.com/assets/images/help/repository/use-this-template-button.png)

## TODO

- 🟢 API service
- 🟢 tests for API service
- 🔴 Rubocop
- 🟢 build pipeline
- 🟢 deploy into staging
- 🟢 Prometheus
- 🟢 monitoring in Grafana
- 🔴 exposing API gateway public endpoint (https://github.com/productboard/pb-gateway/blob/master/config/deck/main.yaml#L49)
- 🔴 integration with our deployment service (https://github.com/productboard/pb-customer-business-context/blob/master/.deployment.yml)
- 🔴 feature branch ephemeral deployment (separate from staging)

## Commands

### Installation
`bundle`

### Test
`rspec`

### Run server
`rackup`
