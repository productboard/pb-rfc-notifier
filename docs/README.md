# Concerns

## Pipeline: GitLab config
- Your project needs to be mirrored from GitHub to GitLab to enable CI
	- https://github.com/productboard/infra-docs/blob/master/how-to/set-up-project-mirroring.md
	- https://github.com/productboard/infra-docs/blob/master/gitlab/deploy-to-k8s.md
	- https://github.com/productboard/infra-docs/blob/master/gitlab/k8s_integration.md
- Disable CI Shared runners to make sure your jobs always run in our clusters

## Docker build: Kaniko
- https://github.com/productboard/infra-docs/blob/master/gitlab/build-docker-image.md
- Create ECR for your project
	- https://github.com/productboard/pb-infrastructure/tree/master/modules/aws/ecr

## Deployment: helm chart
./helm-chart.md

## Metrics: Yabeda & Prometheus
- Yabeda is a ruby framework for exposing metrics with native support for Prometheus
	- https://github.com/yabeda-rb/yabeda
- https://github.com/productboard/infra-docs/blob/master/how-to/set-up-metrics.md

## Grafana
- https://github.com/productboard/infra-docs/blob/master/how-to/set-up-grafana.md
- https://grafana.voyager.staging.productboard.net/d/BnB8yeFMk/pb-blueprint-ruby
