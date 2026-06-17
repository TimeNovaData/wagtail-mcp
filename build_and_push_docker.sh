#!/bin/bash
set -e

GIT_COMMIT_SHA=$(git rev-parse --short HEAD)
BUILD_DATE=$(date +"%Y%m%d-%H%M")
DOCKER_REPO="timenovadata/wagtail-mcp"
IMAGE_TAG="${DOCKER_REPO}:${GIT_COMMIT_SHA}-${BUILD_DATE}"
LATEST_TAG="${DOCKER_REPO}:latest"

echo "Build: ${IMAGE_TAG}"
docker build -t ${IMAGE_TAG} .
docker tag ${IMAGE_TAG} ${LATEST_TAG}
docker push ${IMAGE_TAG}
docker push ${LATEST_TAG}

if [ -n "$GITHUB_OUTPUT" ]; then
  echo "image=${IMAGE_TAG}" >> "$GITHUB_OUTPUT"
fi
