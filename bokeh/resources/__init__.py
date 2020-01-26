# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" The resources module provides the Resources class for easily configuring
how BokehJS code and CSS resources should be located, loaded, and embedded in
Bokeh documents.

Additionally, functions for retrieving `Subresource Integrity`_ hashes for
Bokeh JavaScript files are provided here.

Some pre-configured Resources objects are made available as attributes.

Attributes:
    CDN : load minified BokehJS from CDN
    INLINE : provide minified BokehJS from library static directory

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

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
from typing_extensions import Literal

# Bokeh imports
from .base import Resources
from .cdn import CDNResources
from .file import AbsoluteResources, InlineResources, RelativeResources
from .server import ServerResources

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

Mode = Literal["cdn", "server", "server-dev", "inline", "inline-dev", "relative", "relative-dev", "absolute", "absolute-dev"]

CDN = CDNResources()

INLINE = InlineResources()

INLINE_LEGACY = INLINE(legacy=True)

__all__ = (
    "CDN",
    "INLINE",
    "INLINE_LEGACY",
    "resources",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

def resources(mode: Mode) -> Resources:
    """
    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire Bokeh JS and CSS inline
    * ``'cdn'`` configure to load Bokeh JS and CSS from ``https://cdn.bokeh.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified assets
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified assets
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified assets

    """
    if mode == "cdn":
        return CDN
    elif mode == "server":
        return ServerResources()
    elif mode == "server-dev":
        return ServerResources(dev=True)
    elif mode == "inline":
        return InlineResources()
    elif mode == "inline-dev":
        return InlineResources(dev=True)
    elif mode == "relative":
        return RelativeResources()
    elif mode == "relative-dev":
        return RelativeResources(dev=True)
    elif mode == "absolute":
        return AbsoluteResources()
    elif mode == "absolute-dev":
        return AbsoluteResources(dev=True)
    else:
        raise ValueError(
            "wrong value for 'mode' parameter, expected "
            f"'cdn', 'server(-dev)', 'inline(-dev)', 'relative(-dev)' or 'absolute(-dev)', got {mode}"
        )

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
