#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``Document`` class, which is a container for Bokeh Models to
be reflected to the client side BokehJS library.

As a concrete example, consider a column layout with ``Slider`` and ``Select``
widgets, and a plot with some tools, an axis and grid, and a glyph renderer
for circles. A simplified representation of this document might look like the
figure below:

.. figure:: /_images/document.svg
    :align: center
    :width: 65%

    A Bokeh Document is a collection of Bokeh Models (e.g. plots, tools,
    glyphs, etc.) that can be serialized as a single collection.

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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DEFAULT_TITLE',
    'Document',
    'without_document_lock',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from .document import DEFAULT_TITLE ; DEFAULT_TITLE
from .document import Document ; Document
from .locking import without_document_lock ; without_document_lock

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
