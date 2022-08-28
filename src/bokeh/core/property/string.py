#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Regex property.



"""

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
import re
from typing import Any

# Bokeh imports
from .bases import Init
from .primitive import String
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Regex',
    'MathString',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Regex(String):
    """ Accept strings that match a given regular expression.

    Args:
        default (string, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

    Example:

        .. code-block:: python

            >>> class RegexModel(HasProps):
            ...     prop = Regex("foo[0-9]+bar")
            ...

            >>> m = RegexModel()

            >>> m.prop = "foo123bar"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    """

    def __init__(self, regex: str, *, default: Init[str] = Undefined, help: str | None = None) -> None:
        self.regex = re.compile(regex)
        super().__init__(default=default, help=help)

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        return f"{class_name}({self.regex.pattern!r})"

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if self.regex.match(value):
            return

        msg = "" if not detail else f"expected a string matching {self.regex.pattern!r} pattern, got {value!r}"
        raise ValueError(msg)

class MathString(String):
    """ A string with math TeX/LaTeX delimiters.

    Args:
        value : a string that contains math

    """

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
