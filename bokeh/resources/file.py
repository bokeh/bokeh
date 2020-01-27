#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
from typing import List, Optional

# Bokeh imports
from ..util.paths import bokehjsdir
from ..settings import settings
from .base import Resources, Kind
from .assets import Asset, Script, ScriptRef

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class FileResources(Resources):

    def __init__(self, *, base_dir: Optional[str] = None) -> None:
        self.base_dir = base_dir or bokehjsdir(self.dev)

    def _file_paths(self, kind: Kind) -> List[str]:
        minified = ".min" if not self.dev and self.minified else ""
        legacy = "legacy" if self.legacy else ""
        files = [ "%s%s.%s" % (component, minified, kind) for component in self.components(kind) ]
        paths = [ join(self.base_dir, kind, legacy, file) for file in files ]
        return paths

class RelativeResources(FileResources):
    mode = "relative"

    _default_root_dir = "."

    def __init__(self, *, root_dir: Optional[str] = None) -> None:
        self.root_dir = settings.rootdir(root_dir)

    def _resolve(self, kind: Kind) -> List[Asset]:
        paths = self._file_paths(kind)
        root_dir = self.root_dir or self._default_root_dir
        files = [ relpath(path, root_dir) for path in paths ]
        return [ ScriptRef(file) for file in files ]

class AbsoluteResources(FileResources):
    mode = "absolute"

    def __init__(self) -> None:
        pass

    def _resolve(self, kind: Kind) -> List[Asset]:
        files = self._file_paths(kind)
        return [ ScriptRef(file) for file in files ]

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
