#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' TextLike is a shortcut for properties that accepts strings that can be interpreted to models.
    e.g.:
    :class:`~bokeh.models.math_text.MathText`.
    :class:`~bokeh.models.plain_text.PlainText`.

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
from .either import Either
from .instance import Instance
from .string import MathString

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TextLike',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

TextLike = Either(MathString, Instance("bokeh.models.math_text.MathText"), Instance("bokeh.models.plain_text.PlainText"))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
