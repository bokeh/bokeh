#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import Parameter

# Bokeh imports
from ..core.has_props import abstract
from ..core.property._sphinx import type_link
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

    # a canonical order for positional args that can be
    # used for any functions derived from this class
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
        no_more_defaults = False

        for arg in reversed(cls._args):
            descriptor = cls.lookup(arg)
            default = descriptor.class_default(cls)
            if default is None:
                no_more_defaults = True

            # simplify field(x) defaults to just present the column name
            if isinstance(default, dict) and set(default) == {"field"}:
                default = default["field"]

            # make sure we don't hold on to references to actual Models
            if isinstance(default, Model):
                default = _ModelRepr(default)

            param = Parameter(
                name=arg,
                kind=Parameter.POSITIONAL_OR_KEYWORD,
                # For positional arg properties, default=None means no default.
                default=Parameter.empty if no_more_defaults else default
            )
            if default:
                del default
            typ = type_link(descriptor.property)
            arg_params.insert(0, (param, typ, descriptor.__doc__))

        # these are not really useful, and should also really be private, just skip them
        omissions = {'js_event_callbacks', 'js_property_callbacks', 'subscribed_events'}

        kwarg_params = []

        kws = set(cls.properties()) - set(cls._args) - omissions
        for kw in kws:
            descriptor = cls.lookup(kw)
            default=descriptor.class_default(cls)

            # simplify field(x) defaults to just present the column name
            if isinstance(default, dict) and set(default) == {"field"}:
                default = default["field"]

            # make sure we don't hold on to references to actual Models
            if isinstance(default, Model):
                default = _ModelRepr(default)

            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
                default=default
            )
            del default
            typ = type_link(descriptor.property)
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

class _ModelRepr:
    ''' This proxy is for storing reprs of Bokeh models that are property
    defaults, so that holding references to those Models may be avoided.
    '''
    def __init__(self, model: Model) -> None:
        self. _repr = repr(model)
    def __repr__(self) -> str:
        return self._repr

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
