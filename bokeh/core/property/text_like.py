#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' ``TextLike`` is a shortcut for properties that accepts strings, parsed
strings, and text-like objects, e.g.:

* :class:`~bokeh.models.text.MathText`
* :class:`~bokeh.models.text.PlainText`

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging

from bokeh.core.property.singletons import Intrinsic # isort:skip
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
    "TextLike",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TextLike(Either):
    """ Accept a string that may be interpreted into text models or the models themselves.

    """

    def __init__(self, default=Intrinsic, help=None) -> None:
        types = MathString, Instance("bokeh.models.text.BaseText")
        super().__init__(*types, default=default, help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
