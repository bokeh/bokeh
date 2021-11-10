#!/bin/bash

set -eu

echo "Start of $0"

bash ci/install_node_modules.sh
python setup.py install

python -m bokeh info

echo "End of $0"
