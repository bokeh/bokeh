from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


labextensions = subprocess.run(
    ["jupyter", "labextension", "list"],
    check=True,
    capture_output=True,
    text=True,
).stdout
server_extensions = subprocess.run(
    ["jupyter", "server", "extension", "list"],
    check=True,
    capture_output=True,
    text=True,
).stdout
assert "@bokeh/bokeh-jupyter" in labextensions
assert "bokeh.jupyter" in server_extensions

prefix = Path(sys.prefix)
assert (prefix / "share/jupyter/labextensions/@bokeh/bokeh-jupyter/package.json").is_file()
config = prefix / "etc/jupyter/jupyter_server_config.d/bokeh-jupyter.json"
assert json.loads(config.read_text()) == {"ServerApp": {"jpserver_extensions": {"bokeh.jupyter": True}}}
