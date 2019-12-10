#!/usr/bin/env bash

source scripts/ci/github/setup_env.sh

$PYTHON_BIN setup.py install -q --build-js
