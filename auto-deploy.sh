#!/bin/bash
set -e

usage() {
  echo "Usage: $0 -d <docker-username> -r <registry>"
  exit 1
}

while getopts d:r: flag; do
  case "${flag}" in
    d) DOCKER_USER=${OPTARG} ;;
    r) REGISTRY=${OPTARG} ;;
    *) usage ;;
  esac
done

if [ -z "$DOCKER_USER" ] || [ -z "$REGISTRY" ]; then
  usage
fi

IMAGE="$REGISTRY/$DOCKER_USER/terminalnews:latest"

if [ -z "$CR_PAT" ]; then
  echo "Error: CR_PAT (GitHub token) environment variable not set."
  exit 1
fi

echo "$CR_PAT" | docker login $REGISTRY -u $DOCKER_USER --password-stdin

# Create and use a new builder instance for multi-arch builds
docker buildx create --name multiarch --use --bootstrap || docker buildx use multiarch

# Build and push multi-architecture image (linux/amd64 and linux/arm64)
docker buildx build --platform linux/amd64,linux/arm64 -t $IMAGE --push .

echo "Multi-architecture image pushed: $IMAGE"

if [ -f "compose.yaml" ]; then
  echo "Restarting service with Docker Compose..."
  docker compose pull
  docker compose up -d
fi
