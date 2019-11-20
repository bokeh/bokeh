#!/usr/bin/env bash

source scripts/ci/azure/setup_env.sh

$PYTHON_BIN setup.py install -q --build-js
