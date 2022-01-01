#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from ....core.enums import TooltipAttachment
from ....core.properties import Bool, Enum, Override
from .html_annotation import HTMLAnnotation

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Tooltip",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Tooltip(HTMLAnnotation):
    ''' Render a tooltip.

    .. note::
        This model is currently managed by BokehJS and is not useful
        directly from python.

    '''
    level = Override(default="overlay")

    attachment = Enum(TooltipAttachment, help="""
    Whether the tooltip should be displayed to the left or right of the cursor
    position or above or below it, or if it should be automatically placed
    in the horizontal or vertical dimension.
    """)

    inner_only = Bool(default=True, help="""
    Whether to display outside a central plot frame area.

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be shown.
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
