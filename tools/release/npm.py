# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import json
from dataclasses import dataclass
from pathlib import Path

__all__ = ("NPM_PACKAGES", "NpmPackage")


@dataclass(frozen=True)
class NpmPackage:
    name: str
    workspace: str
    tarball: str

_MANIFEST = Path(__file__).parents[2] / "bokehjs" / "npm_packages.json"


def _packages() -> tuple[NpmPackage, ...]:
    # Manifest order is dependency, packing, and publication order.
    values = json.loads(_MANIFEST.read_text(encoding="utf-8"))
    return tuple(NpmPackage(value["name"], value["workspace"], value["tarball"]) for value in values)


NPM_PACKAGES = _packages()


if __name__ == "__main__":
    print("\n".join(package.tarball for package in NPM_PACKAGES))
