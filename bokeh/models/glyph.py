#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a variety of visual shapes whose attributes can be associated
with data columns from ``ColumnDataSources``.

All these glyphs share a minimal common interface through their base class
``Glyph``:

.. autoclass:: Glyph
    :members:

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import Parameter
from typing import Any

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ConnectedXYGlyph',
    'Glyph',
    'XYGlyph',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Glyph(Model):
    ''' Base class for all glyph models.

    '''

    _args = ()

    _extra_kws = {}

    @classmethod
    def parameters(cls):
        ''' Generate Python ``Parameter`` values suitable for functions that are
        derived from the glyph.

        Returns:
            list(Parameter)

        '''
        arg_params = []

        for arg in cls._args:
            descriptor = cls.lookup(arg)
            default = descriptor.class_default(cls)
            param = Parameter(
                name=arg,
                kind=Parameter.POSITIONAL_OR_KEYWORD,

                # for positional arg properties, default=None means no default
                default=Parameter.empty if default is None or is_field(default) else default
            )
            typ = descriptor.property._sphinx_type()
            arg_params.append((param, typ, descriptor.__doc__))

        # these are not really useful, and should also really be private, just skip them
        omissions = {'js_event_callbacks', 'js_property_callbacks', 'subscribed_events'}

        kwarg_params = []

        kws = cls.properties() - set(cls._args) - omissions
        for kw in kws:
            descriptor = cls.lookup(kw)
            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
                default=descriptor.class_default(cls)
            )
            typ = descriptor.property._sphinx_type()
            kwarg_params.append((param, typ, descriptor.__doc__))

        for kw, (typ, doc) in cls._extra_kws.items():
            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
            )
            kwarg_params.append((param, typ, doc))

        kwarg_params.sort(key=lambda x: x[0].name)

        return arg_params + kwarg_params

@abstract
class XYGlyph(Glyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes.

    '''

@abstract
class ConnectedXYGlyph(XYGlyph):
    ''' Base class of glyphs with `x` and `y` coordinate attributes and
    a connected topology.

    '''

@abstract
class LineGlyph(Glyph):
    ''' Glyphs with line properties
    '''

@abstract
class FillGlyph(Glyph):
    ''' Glyphs with fill properties
    '''

@abstract
class TextGlyph(Glyph):
    ''' Glyphs with text properties
    '''

@abstract
class HatchGlyph(Glyph):
    ''' Glyphs with Hatch properties
    '''

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def is_field(obj: Any) -> bool:
    return isinstance(obj, dict) and "field" in obj

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
