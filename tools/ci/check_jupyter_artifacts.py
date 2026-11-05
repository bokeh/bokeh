# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

"""Verify that the Jupyter build produced the files required for packaging."""

from __future__ import annotations

from pathlib import Path


def check_artifacts(repo_root: Path) -> None:
    frontend = repo_root / "src/bokeh/jupyter"
    required = [
        frontend / "anywidget.js",
        frontend / "labextension/package.json",
        frontend / "labextension/install.json",
    ]
    missing = [str(path.relative_to(repo_root)) for path in required if not path.is_file()]
    if not any(path.is_file() for path in (frontend / "labextension/static").rglob("remoteEntry.*.js")):
        missing.append("src/bokeh/jupyter/labextension/static/**/remoteEntry.*.js")
    if missing:
        raise RuntimeError("Missing Jupyter build artifacts:\n" + "\n".join(missing))


if __name__ == "__main__":
    check_artifacts(Path(__file__).resolve().parents[2])
