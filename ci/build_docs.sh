#!/bin/bash

set -x #echo on

cd sphinx
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}
make SPHINXOPTS=-v all

if grep -e "UA-27761864-7" build/html/index.html > /dev/null; then
    echo "Expected Google Analytics id code found in built documentation"
else
    echo "Expected Google Analytics id code not found in built documentation"
    exit 1
fi
