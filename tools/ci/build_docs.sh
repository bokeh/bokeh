#!/bin/bash

set -x #echo on

cd docs/bokeh
# CI validates the build without production map credentials.
{
    set +x
} 2> /dev/null
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}
export CARTO_API_KEY=${CARTO_API_KEY:-"unset"}
set -x

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
if [[ $STATUS -eq 0 ]]
then
    STATUS=$ARCHIVE_STATUS
fi

{
    set +x # echo off
} 2> /dev/null
echo "Docs phase timings: build=${BUILD_SECONDS}s archive=${ARCHIVE_SECONDS}s total=$((SECONDS-START))s"

exit $STATUS
