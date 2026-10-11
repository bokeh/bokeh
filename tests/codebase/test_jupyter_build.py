#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# External imports
import tomllib
from packaging.requirements import Requirement

# Bokeh test imports
from tests.support.util.project import TOP_PATH


def test_source_build_declares_the_jupyter_builder_cli() -> None:
    with (TOP_PATH / "pyproject.toml").open("rb") as file:
        requirements = tomllib.load(file)["build-system"]["requires"]

    assert "jupyter-builder" in {Requirement(value).name for value in requirements}
