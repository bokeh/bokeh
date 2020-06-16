#!/bin/bash

set -x #echo on

cd sphinx
export GOOGLE_API_KEY=${GOOGLE_API_KEY:-"unset"}
make SPHINXOPTS=-v all
