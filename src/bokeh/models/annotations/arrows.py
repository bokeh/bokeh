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

# pyright: reportAbstractUsage=false, reportArgumentType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from ...core.has_props import abstract
from ...core.property.dataspec import NumberSpec
from ...core.property.include import Include
from ...core.property.override import Override
from ...core.property_mixins import FillProps, HatchProps, LineProps
from ..graphics import Marking

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "ArrowHead",
    "NormalHead",
    "OpenHead",
    "TeeHead",
    "VeeHead",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class ArrowHead(Marking):
    ''' Base class for arrow heads.

    '''

    size = NumberSpec(default=25, help="""
    The size, in pixels, of the arrow head.
    """)

    # TODO: reversed = Bool(default=False)

class OpenHead(ArrowHead):
    ''' Render an open-body arrow head.

    '''

    line_props = Include(LineProps, help="""

    The {prop} values for the arrow head outline.
    """)

class NormalHead(ArrowHead):
    ''' Render a closed-body arrow head.

    '''

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the arrow head interior.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the arrow head interior.
    """)

    fill_color = Override(default="black")

class TeeHead(ArrowHead):
    ''' Render a tee-style arrow head.

    '''

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

class VeeHead(ArrowHead):
    ''' Render a vee-style arrow head.

    '''

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the arrow head interior.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the arrow head interior.
    """)

    fill_color = Override(default="black")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
