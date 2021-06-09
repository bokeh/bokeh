#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'model_link',
    'property_link',
    'register_type_link',
    'type_link',
)

_type_links = {}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def model_link(fullname):
    # (double) escaped space at the end is to appease Sphinx
    # https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html#gotchas
    return f":class:`~{fullname}`\\ "

def property_link(obj):
    # (double) escaped space at the end is to appease Sphinx
    # https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html#gotchas
    return f":class:`~bokeh.core.properties.{obj.__class__.__name__}`\\ "

def register_type_link(cls):
    def decorator(func):
        _type_links[cls] = func
        return func
    return decorator

def type_link(obj):
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
