#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import runpy
from unittest.mock import patch

# External imports
import pytest
import tomllib
from packaging.requirements import Requirement

# Bokeh imports
# Bokeh test imports
from tests.support.util.project import TOP_PATH


def test_source_build_declares_the_jupyter_builder_cli() -> None:
    with (TOP_PATH / "pyproject.toml").open("rb") as file:
        requirements = tomllib.load(file)["build-system"]["requires"]

    builders = [Requirement(value) for value in requirements if Requirement(value).name == "jupyter-builder"]
    assert len(builders) == 1
    assert str(builders[0].specifier) == "<2,>=1"


def test_pixi_js_tools_include_the_jupyter_builder_cli() -> None:
    with (TOP_PATH / "pixi.toml").open("rb") as file:
        dependencies = tomllib.load(file)["feature"]["js-tools"]["dependencies"]

    assert dependencies["jupyter-builder"] == ">=1,<2"


def test_source_build_reports_a_missing_jupyter_builder(capsys: pytest.CaptureFixture[str]) -> None:
    with patch("setuptools.setup"):
        setup = runpy.run_path(TOP_PATH / "setup.py")
    setup["build_jupyter"].__globals__["which"] = lambda _command: None

    with pytest.raises(SystemExit, match="1"):
        setup["build_jupyter"]()

    assert "Install jupyter-builder>=1,<2" in capsys.readouterr().out
