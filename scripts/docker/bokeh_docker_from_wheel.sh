#!/bin/bash
# This installs Bokeh from a single wheel in the dist directory and runs some of the Python tests.

set -eu

echo "Start of $0"

pip install dist/bokeh*.whl
bash scripts/ci/install_node_modules.sh

python -m bokeh info

# Bokeh Python tests.
bokeh sampledata && \
pytest tests/unit -k "not firefox" && \
pytest tests/integration

echo "End of $0"
