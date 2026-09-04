from __future__ import annotations

# Standard library imports
import json
import subprocess
import sys
from pathlib import Path


def _jupyter_output(*args: str) -> str:
    result = subprocess.run(
        ["jupyter", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout + result.stderr


labextensions = _jupyter_output("labextension", "list")
server_extensions = _jupyter_output("server", "extension", "list")
assert "@bokeh/bokeh-jupyter" in labextensions
assert "bokeh.jupyter" in server_extensions

prefix = Path(sys.prefix)
assert (prefix / "share/jupyter/labextensions/@bokeh/bokeh-jupyter/package.json").is_file()
config = prefix / "etc/jupyter/jupyter_server_config.d/bokeh-jupyter.json"
assert json.loads(config.read_text()) == {"ServerApp": {"jpserver_extensions": {"bokeh.jupyter": True}}}
