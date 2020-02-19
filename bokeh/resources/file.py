#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import basename, join, relpath
from typing import ClassVar, List, Optional

# Bokeh imports
from ..util.functions import or_else
from ..util.paths import bokehjsdir
from ..settings import settings
from .base import Resources, Kind
from .artifacts import Artifact
from .assets import Asset, Script, ScriptLink

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class FileResources(Resources):

    def __init__(self, *, base_dir: Optional[str] = None, dev: Optional[bool] = None, legacy: Optional[bool] = None) -> None:
        super().__init__(dev=dev, legacy=legacy)
        self.base_dir = base_dir or bokehjsdir(self.dev)

    def __call__(self, *, base_dir: Optional[str] = None, dev: Optional[bool] = None, legacy: Optional[bool] = None) -> "FileResources":
        return self.__class__(base_dir=or_else(base_dir, self.base_dir), dev=or_else(dev, self.dev), legacy=or_else(legacy, self.legacy))

    def _file_paths(self, artifact: Artifact) -> List[str]:
        minified = ".min" if not self.dev else ""
        legacy = "legacy" if self.legacy else ""
        files = [ "%s%s.%s" % (component, minified, kind) for component in self.components(kind) ]
        paths = [ join(self.base_dir, kind, legacy, file) for file in files ]
        return paths

class RelativeResources(FileResources):
    mode = "relative"

    _default_root_dir: ClassVar[str] = "."

    def __init__(self, *, root_dir: Optional[str] = None, base_dir: Optional[str] = None,
            dev: Optional[bool] = None, legacy: Optional[bool] = None) -> None:
        super().__init__(base_dir=base_dir, dev=dev, legacy=legacy)
        self.root_dir = settings.rootdir(root_dir)

    def __call__(self, *, root_dir: Optional[str] = None, base_dir: Optional[str] = None,
            dev: Optional[bool] = None, legacy: Optional[bool] = None) -> "RelativeResources":
        return self.__class__(root_dir=or_else(root_dir, self.root_dir), base_dir=or_else(base_dir, self.base_dir),
            dev=or_else(dev, self.dev), legacy=or_else(legacy, self.legacy))

    def _resolve(self, artifact: Artifact) -> List[Asset]:
        paths = self._file_paths(kind)
        root_dir = self.root_dir or self._default_root_dir
        files = [ relpath(path, root_dir) for path in paths ]
        return [ ScriptLink(file) for file in files ]

class AbsoluteResources(FileResources):
    mode = "absolute"

    def _resolve(self, kind: Kind) -> List[Asset]:
        files = self._file_paths(kind)
        return [ ScriptLink(file) for file in files ]

class InlineResources(FileResources):
    mode = "inline"

    def _resolve(self, kind: Kind) -> List[Asset]:
        paths = self._file_paths(kind)
        contents = [ self._inline(path) for path in paths]
        return [ Script(content) for content in contents ]

    @staticmethod
    def _inline(path: str) -> str:
        begin = "/* BEGIN %s */" % basename(path)
        with open(path, "rb") as f:
            middle = f.read().decode("utf-8")
        end = "/* END %s */" % basename(path)
        return "%s\n%s\n%s" % (begin, middle, end)
