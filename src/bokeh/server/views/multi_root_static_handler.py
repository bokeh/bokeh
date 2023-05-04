#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys
from pathlib import Path

# External imports
from tornado.web import HTTPError, StaticFileHandler

# Bokeh imports
from ...core.types import PathLike

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

class MultiRootStaticHandler(StaticFileHandler):

    def initialize(self, root: dict[str, PathLike]) -> None:
        self.root = root
        self.default_filename = None

    @classmethod
    def get_absolute_path(cls, root: dict[str, PathLike], path: str) -> str:
        try:
            name, artifact_path = path.split(os.sep, 1)
        except ValueError:
            raise HTTPError(404)

        artifacts_dir = root.get(name, None)
        if artifacts_dir is not None:
            return super().get_absolute_path(str(artifacts_dir), artifact_path)
        else:
            raise HTTPError(404)

    def validate_absolute_path(self, root: dict[str, PathLike], absolute_path: str) -> str | None:
        for artifacts_dir in root.values():
            if is_relative_to(Path(absolute_path), artifacts_dir):
                return super().validate_absolute_path(str(artifacts_dir), absolute_path)

        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

if sys.version_info > (3, 9):
    def is_relative_to(path: Path, *other: PathLike) -> bool:
        return path.is_relative_to(*other)
else:
    def is_relative_to(path: Path, *other: PathLike) -> bool:
        """Return True if the path is relative to another path or False. """
        try:
            path.relative_to(*other)
            return True
        except ValueError:
            return False

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
