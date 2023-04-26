#!/bin/bash

set -x #echo on

cd docs/bokeh
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}
make SPHINXOPTS="-v -j 4" all

{ set +x ;} 2> /dev/null #echo off

if grep -e 'src="https://www.google-analytics.com' build/html/index.html > /dev/null; then
    echo "Expected Google Analytics script source found in built documentation"
else
    echo "Expected Google Analytics script source not found in built documentation"
    exit 1
fi

tar cvzf docs-html.tgz build/html
