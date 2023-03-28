#!/bin/bash

# Note do not exit on error, as want remaining tests to run.
set -ux

echo "Start of $0"

python -m bokeh info
bokeh sampledata

# Run some of the tests.
pytest tests/codebase
cd bokehjs && node make test

echo "End of $0"
