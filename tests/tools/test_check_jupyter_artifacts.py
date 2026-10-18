# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from pathlib import Path

# External imports
import pytest

# Bokeh imports
from tools.ci.check_jupyter_artifacts import check_artifacts

ARTIFACTS = [
    "anywidget.js",
    "labextension/package.json",
    "labextension/install.json",
    "labextension/static/nested/remoteEntry.abc123.js",
]


@pytest.fixture
def repo_root(tmp_path: Path) -> Path:
    for name in ARTIFACTS:
        path = tmp_path / "src/bokeh/jupyter" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch()
    return tmp_path


def test_complete_build(repo_root: Path) -> None:
    check_artifacts(repo_root)


@pytest.mark.parametrize("name", ARTIFACTS)
@pytest.mark.parametrize("directory", [False, True])
def test_missing_artifact(repo_root: Path, name: str, directory: bool) -> None:
    path = repo_root / "src/bokeh/jupyter" / name
    path.unlink()
    if directory:
        path.mkdir()
    with pytest.raises(RuntimeError, match="Missing Jupyter build artifacts") as exc:
        check_artifacts(repo_root)
    assert (name if "remoteEntry" not in name else "remoteEntry.*.js") in str(exc.value)
