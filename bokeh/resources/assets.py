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
from json import dumps
from typing import Any, Callable, List, Optional, Union

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

    type: str

    @abstractmethod
    def to_html(self) -> str:
        pass

    @abstractmethod
    def to_js(self) -> str:
        pass

class Link(Asset):

    url: str

class Inline(Asset):

    content: str

class ScriptLink(Link):

    def __init__(self, url: str, *, type: str = "text/javascript",
            integrity: Optional[str] = None, crossorigin: Optional[str] = None) -> None:
        self.url = url
        self.type = type
        self.integrity = integrity
        self.crossorigin = crossorigin

    def to_html(self) -> str:
        return tag("script", type=self.type, src=self.url, integrity=self.integrity, crossorigin=self.crossorigin)

    def to_js(self) -> str:
        return f"""\
(function(onload, onerror) {{
  const element = document.createElement("script");
  element.onload = onload;
  element.onerror = onerror;
  element.type = {js(self.type)};
  element.async = false;
  element.integrity = {js(self.integrity)};
  element.crossorigin = {js(self.crossorigin)};
  element.src = {js(self.url)};
  document.head.appendChild(element);
}})
"""

class Script(Inline):

    def __init__(self, content: str, *, type: str = "text/javascript") -> None:
        self.content = content
        self.type = type

    def to_html(self) -> str:
        return tag("script", self.content, type=self.type)

    def to_js(self) -> str:
        return f"""\
(function() {{
  const element = document.createElement("script");
  element.type = {js(self.type)}
  element.appendChild(document.createTextNode({js(self.content)}));
  document.head.appendChild(element);
}})
"""

class StyleLink(Link):

    def __init__(self, url: str, *, integrity: Optional[str] = None, crossorigin: Optional[str] = None) -> None:
        self.url = url
        self.type = "text/css"
        self.integrity = integrity
        self.crossorigin = crossorigin

    def to_html(self) -> str:
        return tag("link", None, rel="stylesheet", href=self.url, type=self.type, integrity=self.integrity, crossorigin=self.crossorigin)

    def to_js(self) -> str:
        return f"""\
(function(onload, onerror) {{
  const element = document.createElement("link");
  element.onload = onload;
  element.onerror = onerror;
  element.type = {js(self.type)};
  element.rel = "stylesheet";
  element.integrity = {js(self.integrity)};
  element.crossorigin = {js(self.crossorigin)};
  element.src = {js(self.url)};
  document.head.appendChild(element);
}})
"""

class Style(Inline):

    def __init__(self, content: str) -> None:
        self.content = content
        self.type = "text/css"

    def to_html(self) -> str:
        return tag("style", self.content)

    def to_js(self) -> str:
        return f"""\
(function() {{
  const element = document.createElement("style");
  element.appendChild(document.createTextNode({js(self.content)}));
  document.head.appendChild(element);
}})
"""

Resolver = Callable[[], Asset]

class Bundle:

    _assets: List[Asset]

    def __init__(self, *assets: Asset, resolver: Optional[Resolver] = None) -> None:
        self._assets = list(assets)

    def to_html(self) -> str:
        return "\n".join([ asset.to_html() for asset in self._assets ])

    def add(self, *assets: Union[Asset, Artifact]) -> None:
        pass

    @property
    def assets(self) -> List[Asset]:
        return list(self._assets)

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def tag(name: str, content: Optional[str] = "", **kv: Optional[str]) -> str:
    if content is not None:
        return f"<{name}{args(**kv)}>{content}</{name}>"
    else:
        return f"<{name}{args(**kv)} />"

def args(**kv: Optional[str]) -> str:
    return "".join([ f' {key}="{escape(value)}"' for key, value in kv.items() if value is not None ])

def escape(value: str) -> str:
    return value.replace('"', '\\"')

def js(value: Any) -> str:
    return dumps(value)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
