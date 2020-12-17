#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for various kinds of arrow heads that can be added to
Arrow annotations.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import Include, NumberSpec, Override
from ..core.property_mixins import FillProps, LineProps
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ArrowHead',
    'NormalHead',
    'OpenHead',
    'TeeHead',
    'VeeHead',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class ArrowHead(Model):
    ''' Base class for arrow heads.

    '''

    size = NumberSpec(default=25, help="""
    The size, in pixels, of the arrow head.
    """)

class OpenHead(ArrowHead):
    ''' Render an open-body arrow head.

    '''

    line_props = Include(LineProps, use_prefix=False, help="""

    The %s values for the arrow head outline.
    """)

class NormalHead(ArrowHead):
    ''' Render a closed-body arrow head.

    '''

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow head outline.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the arrow head interior.
    """)

    fill_color = Override(default="black")

class TeeHead(ArrowHead):
    ''' Render a tee-style arrow head.

    '''

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow head outline.
    """)

class VeeHead(ArrowHead):
    ''' Render a vee-style arrow head.

    '''

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arrow head outline.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the arrow head interior.
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
