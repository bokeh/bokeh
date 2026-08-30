#!/bin/bash

set -x #echo on

cd docs/bokeh
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}

START=$SECONDS

BUILD_START=$SECONDS
make SPHINXOPTS="${SPHINXOPTS:--j auto}" all
BUILD_STATUS=$?
BUILD_SECONDS=$((SECONDS-BUILD_START))

ARCHIVE_START=$SECONDS
tar czf docs-html.tgz build/html
ARCHIVE_STATUS=$?
ARCHIVE_SECONDS=$((SECONDS-ARCHIVE_START))

STATUS=$BUILD_STATUS
if [[ $STATUS -eq 0 ]]; then
    STATUS=$ARCHIVE_STATUS
fi

{ set +x ;} 2> /dev/null # echo off
echo "Docs phase timings: build=${BUILD_SECONDS}s archive=${ARCHIVE_SECONDS}s total=$((SECONDS-START))s"

exit $STATUS
