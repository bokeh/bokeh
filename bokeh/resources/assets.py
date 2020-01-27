# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""
"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------

import logging  # isort:skip
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from abc import ABC, abstractmethod
from typing import Callable, List, Optional, Union

# Bokeh imports
from .artifacts import Artifact#, Resolver

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class Asset(ABC):

    @abstractmethod
    def render(self) -> str:
        pass

class ScriptRef(Asset):

    def __init__(self, url: str, type: str = "text/javascript") -> None:
        self.url = url
        self.type = type

    def render(self) -> str:
        return f"""<script type="{self.type}" src="{self.url}"></script>"""

class Script(Asset):

    def __init__(self, content: str, type: str = "text/javascript") -> None:
        self.content = content
        self.type = type

    def render(self) -> str:
        return f"""<script type="{self.type}">{self.content}</script>"""

class StyleRef(Asset):

    def __init__(self, url: str) -> None:
        self.url = url

    def render(self) -> str:
        return f"""<link rel="stylesheet" href="{self.url}" type="text/css" />"""

class Style(Asset):

    def __init__(self, content: str) -> None:
        self.content = content

    def render(self) -> str:
        return f"""<style>\n{self.content}\n</style>"""

Resolver = Callable[[], Asset]

class Bundle:

    _assets: List[Asset]

    def __init__(self, *assets: Asset, resolver: Optional[Resolver] = None) -> None:
        self._assets = list(assets)

    def render(self) -> str:
        return "\n".join([ asset.render() for asset in self._assets ])

    def add(self, *assets: Union[Asset, Artifact]) -> None:
        pass

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
