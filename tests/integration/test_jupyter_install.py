#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import json
import sys
from pathlib import Path

# External imports
import pytest

ROOT = Path(__file__).parents[2]

pytestmark = pytest.mark.skipif(
    (ROOT / "src" / "bokeh").is_dir(),
    reason="Jupyter installation checks require the source-deleted wheel test boundary",
)


def test_wheel_registers_jupyter_extensions() -> None:
    from jupyter_server.extension.manager import ExtensionPackage
    from jupyterlab.commands import AppOptions, get_app_info

    labextensions = Path(sys.prefix) / "share/jupyter/labextensions"
    options = AppOptions(labextensions_path=[str(labextensions)])
    assert "@bokeh/bokeh-jupyter" in get_app_info(options)["federated_extensions"]
    assert ExtensionPackage(name="bokeh.jupyter", enabled=True).validate()


def test_wheel_installs_jupyter_extension_files() -> None:
    prefix = Path(sys.prefix)
    assert (prefix / "share/jupyter/labextensions/@bokeh/bokeh-jupyter/package.json").is_file()
    config = prefix / "etc/jupyter/jupyter_server_config.d/bokeh-jupyter.json"
    assert json.loads(config.read_text()) == {"ServerApp": {"jpserver_extensions": {"bokeh.jupyter": True}}}
