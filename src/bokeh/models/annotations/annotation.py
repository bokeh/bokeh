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

# pyright: reportAbstractUsage=false, reportArgumentType=false, reportAssignmentType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from ...core.has_props import abstract
from ...core.property.instance import Instance, InstanceDefault
from ...core.property.override import Override
from ..renderers.renderer import CompositeRenderer
from ..sources import ColumnDataSource, DataSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Annotation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Annotation(CompositeRenderer):
    ''' Base class for all annotation models.

    '''

    level = Override(default="annotation")

@abstract
class DataAnnotation(Annotation):
    ''' Base class for annotations that utilize a data source.

    '''

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
