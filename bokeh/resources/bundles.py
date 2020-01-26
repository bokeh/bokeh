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

# Bokeh imports

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class Asset:
    pass

class Link(Asset):
    pass

class Inline(Asset):
    pass

class ScriptRef(Link):

    def __init__(self, url: str, type: str = "text/javascript") -> None:
        self.url = url
        self.type = type

class Script(Inline):

    def __init__(self, content: str, type: str = "text/javascript") -> None:
        self.content = content
        self.type = type

class StyleRef(Link):

    def __init__(self, url: str) -> None:
        self.url = url

class Style(Inline):

    def __init__(self, content: str) -> None:
        self.content = content

class Bundle:
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
