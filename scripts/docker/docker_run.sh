#!/bin/bash

# Usage: docker_run.sh bokeh-dev:latest
# Can put env vars first, e.g.
#   BOKEH_DOCKER_PY=3.9 docker_run.sh bokeh-dev:latest

set -eu

if [ $# -ne 1 ]; then
    echo "Usage: docker_run.sh <docker image and tag>, e.g. docker_run.sh bokeh/bokeh-dev:latest"
    exit 1
fi

IMAGE_AND_TAG=$1
UID_GID="`id -u`:`id -g`"

# Environment variables that are passed in to Docker container.
ENV_VARS=""
for name in BOKEH_DOCKER_CONDA BOKEH_DOCKER_PY BOKEH_DOCKER_BUILD BOKEH_DOCKER_TEST BOKEH_DOCKER_CHROME_VERSION BOKEH_DOCKER_FROM_WHEEL; do
    if [ -n "${!name+set}" ]; then
        ENV_VARS="$ENV_VARS -e $name=${!name}"
    fi
done

INTERACTIVE="-it"
if [ "${BOKEH_DOCKER_INTERACTIVE:-1}" == 0 ]; then
    INTERACTIVE=""
fi
if [ "${BOKEH_DOCKER_CHROME_VERSION:-0}" == 1 ]; then
    # If only want chrome version, do not need to run interactively.
    INTERACTIVE=""
fi

CMD="docker run -v $PWD:/bokeh -u $UID_GID -p 5006:5006 $ENV_VARS $INTERACTIVE $IMAGE_AND_TAG"
echo $CMD
$CMD
