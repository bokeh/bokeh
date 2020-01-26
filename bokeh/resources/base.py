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
from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Optional, Set, Type, Union
from typing_extensions import Literal, TypedDict

# Bokeh imports
from ..model import Model
from ..settings import settings
from .bundles import Asset, Script, ScriptRef, Style, StyleRef

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

LogLevel = Literal["trace", "debug", "info", "warn", "error", "fatal"]
Kind = Literal["js", "css"]

class Message(TypedDict):
    type: str
    text: str

class Urls(TypedDict):
    urls: Callable[[List[str], Kind], List[str]]
    messages: List[Message]

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class Resources(ABC):
    """ The Resources class encapsulates information relating to loading or
    embedding Bokeh Javascript and CSS.

    Args:

        version (str, optional) : what version of Bokeh JS and CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS and CSS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript and CSS should be minified or not (default: True)


    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        js_raw : any raw JS that needs to be placed inside ``<script>`` tags
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        js_files : URLs of any JS files that need to be loaded by ``<script>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    """

    mode: str
    dev: bool

    _log_level: Optional[LogLevel]

    def __init__(self, *,
            dev: Optional[bool] = None,
            minified: Optional[bool] = None,
            legacy: Optional[bool] = None,
            log_level: Optional[LogLevel] = None) -> None:
        self.minified = settings.minified(minified)
        self.legacy = settings.legacy(legacy)
        self.log_level = settings.log_level(log_level)

    @abstractmethod
    def __call__(self, *, dev: Optional[bool] = None, minified: Optional[bool] = None, legacy: Optional[bool] = None) -> Resources:
        pass

    @abstractmethod
    def _resolve(self, kind: Kind) -> List[Asset]:
        pass

    def _resolve_external(self) -> List[Asset]:
        """ Collect external resources set on resource_attr attribute of all models."""
        assets: List[Asset] = []
        visited: Set[str] = set()

        def resolve_attr(cls: Type[Model], attr: str, ctor: Union[Type[StyleRef], Type[ScriptRef]]) -> None:
            external: Union[str, List[str]] = getattr(cls, attr, [])

            for url in [external] if isinstance(external, str) else external:
                if url not in visited:
                    visited.add(url)
                    assets.append(ctor(url))

        for _, cls in sorted(Model.model_class_reverse_map.items(), key=lambda arg: arg[0]):
            resolve_attr(cls, "__css__", StyleRef)
            resolve_attr(cls, "__javascript__", ScriptRef)

        return assets

    def resolve(self) -> List[Asset]:
        assets: List[Asset] = []

        assets.extend(self._resolve_external())
        assets.extend(self._resolve("js"))

        if self.log_level is not None:
            assets.append(Script(f"Bokeh.set_log_level('{self.log_level}');"))
        if self.dev:
            assets.append(Script("Bokeh.settings.dev = true"))

        return assets

    @property
    def log_level(self) -> Optional[LogLevel]:
        return self._log_level

    @log_level.setter
    def log_level(self, level: Optional[LogLevel]) -> None:
        valid_levels = ["trace", "debug", "info", "warn", "error", "fatal"]
        if not (level is None or level in valid_levels):
            raise ValueError("Unknown log level '{}', valid levels are: {}".format(level, str(valid_levels)))
        self._log_level = level
