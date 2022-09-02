#!/bin/bash

set -eu

echo "Start of $0"

bash scripts/install_node_modules.sh
pip install -ve .

python -m bokeh info

echo "End of $0"
