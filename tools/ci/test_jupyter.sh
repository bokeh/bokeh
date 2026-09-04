#!/usr/bin/env bash

set -euo pipefail

python -m pip install 'anywidget>=0.11' marimo
python -c "import anywidget, marimo; print(anywidget.__version__, marimo.__version__)"
playwright install --only-shell chromium
python tools/ci/verify_jupyter_install.py
pytest --color=yes -rs \
  tests/unit/bokeh/io/test_anywidget.py \
  tests/unit/bokeh/io/test_jupyter*.py \
  tests/unit/bokeh/io/test_notebook__io.py \
  tests/integration/test_jupyter_extension.py \
  tests/integration/test_marimo.py
