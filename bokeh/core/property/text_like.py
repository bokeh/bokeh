#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' TextLike is a shortcut for properties that accepts strings that can be interpreted to models.
    e.g.:
    :class:`~bokeh.models.text.MathText`
    :class:`~bokeh.models.text.PlainText`

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
from .container import Dict
from .either import Either
from .instance import Instance
from .string import MathString

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TextLike',
    'DictWithTextLikeValues'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

TextLike = Either(MathString, Instance("bokeh.models.text.MathText"), Instance("bokeh.models.text.PlainText"))

class DictWithTextLikeValues(Dict):
    """ Accept a Python dict with any keys and only TextLike values.
    e.g.: Dict(key: Any, value: TextLike)
    """
    def validate(self, value, detail = False):
        super().validate(value, detail=detail)

        if isinstance(value, dict) and all(TextLike.is_valid(val) for _, val in value.items()):
            return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def transform(self, value):
        value = super().transform(value)

        if isinstance(value, dict):
            for key, val in value.items():
                value[key] = self.values_type.transform(val)

        return value


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
