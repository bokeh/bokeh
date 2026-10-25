#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Models for describing grouping behavior of collections of models. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from ...core.has_props import abstract
from ...core.property.container import List
from ...core.property.instance import Instance
from ...core.property.required import Required
from ...model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "GroupByModels",
    "GroupByName",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class GroupBy(Model):
    """ Base class for grouping behaviors. """

class GroupByModels(GroupBy):
    """ Group models by manually predefined groups. """

    groups = Required(List(List(Instance(Model))), help="""
    Predefined groups of models.
    """)

class GroupByName(GroupBy):
    """ Group models by their names (``Model.name`` property). """

# TODO GroupByCustomJS(GroupBy)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
