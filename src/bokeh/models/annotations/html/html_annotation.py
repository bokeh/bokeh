#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from typing import Any

# Bokeh imports
from ....core.has_props import abstract
from ....core.property.instance import Instance, InstanceDefault
from ...sources import ColumnDataSource, DataSource
from ..annotation import Annotation

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "HTMLAnnotation",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class HTMLAnnotation(Annotation):
    ''' Base class for HTML-based annotations.

    .. note::
        All annotations that inherit from this base class can be attached to
        a canvas, but are not rendered to it, thus they won't appear in saved
        plots. Only ``export_png()`` function can preserve HTML annotations.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

@abstract
class HTMLDataAnnotation(Annotation):
    """ Base class for data driven HTML-based annotations.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    source = Instance(DataSource, default=InstanceDefault(ColumnDataSource), help="""
    Local data source to use when rendering annotations on the plot.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
