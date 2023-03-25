#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions useful for generating rich sphinx links for properties

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
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Type,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'model_link',
    'property_link',
    'register_type_link',
    'type_link',
)

_type_links: dict[Type[Any], Callable[[Any], str]] = {}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

def model_link(fullname: str) -> str:
    # (double) escaped space at the end is to appease Sphinx
    # https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html#gotchas
    return f":class:`~{fullname}`\\ "

def property_link(obj: Any) -> str:
    # (double) escaped space at the end is to appease Sphinx
    # https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html#gotchas
    return f":class:`~bokeh.core.properties.{obj.__class__.__name__}`\\ "

Fn: TypeAlias = Callable[[Any], str]

def register_type_link(cls: type[Any]) -> Callable[[Fn], Fn]:
    def decorator(func: Fn):
        _type_links[cls] = func
        return func
    return decorator

def type_link(obj: Any) -> str:
    return _type_links.get(obj.__class__, property_link)(obj)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
