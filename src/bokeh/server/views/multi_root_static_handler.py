#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
from tornado.web import HTTPError, StaticFileHandler

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

    def initialize(self, root: dict[str, str]) -> None:
        self.root = root
        self.default_filename = None

    @classmethod
    def get_absolute_path(cls, root: dict[str, str], path: str) -> str:
        try:
            name, artifact_path = path.split(os.sep, 1)
        except ValueError:
            raise HTTPError(404)

        artifacts_dir = root.get(name, None)
        if artifacts_dir is not None:
            return super().get_absolute_path(artifacts_dir, artifact_path)
        else:
            raise HTTPError(404)

    def validate_absolute_path(self, root: str, absolute_path: str) -> str | None:
        for name, artifacts_dir in root.items():
            if absolute_path.startswith(artifacts_dir):
                return super().validate_absolute_path(artifacts_dir, absolute_path)

        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
