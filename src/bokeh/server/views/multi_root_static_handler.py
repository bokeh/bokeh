#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Serve static files from multiple, dynamically defined locations.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportIncompatibleMethodOverride=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import os
from pathlib import Path
from typing import TYPE_CHECKING

from tornado.web import HTTPError

from .static_handler import AsyncStaticFileHandler

if TYPE_CHECKING:
    from ...core.types import PathLike
    type RootPaths = dict[str, PathLike]
    type RootPathLike = str | RootPaths

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "MultiRootStaticHandler",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class MultiRootStaticHandler(AsyncStaticFileHandler):

    def initialize(self, root: RootPathLike, default_filename: str | None = None) -> None:
        self.root = root  # type: ignore[assignment]
        self.default_filename = default_filename

    @classmethod
    def get_absolute_path(cls, root: RootPathLike, path: str) -> str:
        if isinstance(root, str):
            return super().get_absolute_path(root, path)

        try:
            if "/" in path:
                name, artifact_path = path.split("/", 1)
            elif os.sep in path and os.sep != "/":
                name, artifact_path = path.split(os.sep, 1)
            else:
                raise ValueError
        except ValueError:
            raise HTTPError(404)

        artifacts_dir = root.get(name, None)
        if artifacts_dir is not None:
            return super().get_absolute_path(str(artifacts_dir), artifact_path)
        else:
            raise HTTPError(404)

    def validate_absolute_path(self, root: RootPathLike, absolute_path: str) -> str | None:
        if isinstance(root, str):
            return super().validate_absolute_path(root, absolute_path)

        for artifacts_dir in root.values():
            if Path(absolute_path).is_relative_to(artifacts_dir):
                return super().validate_absolute_path(str(artifacts_dir), absolute_path)

        return None

    async def _validate_absolute_path(self, root: RootPathLike, absolute_path: str) -> str | None:
        if isinstance(root, str):
            return await super()._validate_absolute_path(root, absolute_path)

        for artifacts_dir in root.values():
            if Path(absolute_path).is_relative_to(artifacts_dir):
                return await super()._validate_absolute_path(str(artifacts_dir), absolute_path)

        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
