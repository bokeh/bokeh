#!/bin/bash

set -x #echo on

cd docs/bokeh
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}
make SPHINXOPTS=-v all
STATUS=$(echo $?)

{ set +x ;} 2> /dev/null # echo off
tar cvzf docs-html.tgz build/html

exit $STATUS
