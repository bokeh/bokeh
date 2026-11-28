#!/bin/bash

# Usage: build_docs.sh [TARGET]
#
# TARGET is the make target of docs/bokeh/Makefile to build. The default is
# "html". Pass "all" to also build the Markdown pages and llms.txt.
TARGET=${1:-html}

set -x #echo on

cd docs/bokeh

START=$SECONDS

BUILD_START=$SECONDS
make SPHINXOPTS="${SPHINXOPTS:--j auto}" "$TARGET"
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
