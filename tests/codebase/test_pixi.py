# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import re
from typing import Any

# External imports
import tomllib
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

# Bokeh imports
# Bokeh test imports
from tests.support.util.project import TOP_PATH


def _load_manifests() -> tuple[dict[str, Any], dict[str, Any]]:
    with open(TOP_PATH / "pyproject.toml", "rb") as f:
        pyproject = tomllib.load(f)
    with open(TOP_PATH / "pixi.toml", "rb") as f:
        pixi = tomllib.load(f)
    return pyproject, pixi


def _constraints(requirements: list[str]) -> dict[str, str]:
    parsed = (Requirement(requirement) for requirement in requirements)
    return {canonicalize_name(requirement.name): str(requirement.specifier) for requirement in parsed}


def test_pixi_python_features_match_project_classifiers() -> None:
    pyproject, pixi = _load_manifests()

    classifiers = pyproject["project"]["classifiers"]
    supported = {
        match.group(1)
        for classifier in classifiers
        if (match := re.fullmatch(r"Programming Language :: Python :: (3\.\d+)", classifier)) is not None
    }

    features = pixi["feature"]
    configured = {
        feature["dependencies"]["python"].removesuffix(".*")
        for name, feature in features.items()
        if re.fullmatch(r"py\d{3}", name)
    }

    assert configured == supported


def test_pixi_runtime_covers_project_dependencies() -> None:
    pyproject, pixi = _load_manifests()

    expected = _constraints(pyproject["project"]["dependencies"])
    dependencies = pixi["feature"]["runtime-deps"]["dependencies"]
    actual = _constraints([f"{name} {constraint}" for name, constraint in dependencies.items()])

    assert {name: actual.get(name) for name in expected} == expected
