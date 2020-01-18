#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
        arg_params = []

        for arg in cls._args:
            descriptor = cls.lookup(arg)
            default = descriptor.class_default(cls)
            param = Parameter(
                name=arg,
                kind=Parameter.POSITIONAL_OR_KEYWORD,

                # for positional arg properties, default=None means no default
                default=Parameter.empty if default is None else default
            )
            arg_params.append(param)

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
            kwarg_params.append(param)

        for kw in cls._extra_kws:
            param = Parameter(
                name=kw,
                kind=Parameter.KEYWORD_ONLY,
            )
            kwarg_params.append(param)

        kwarg_params.sort(key=lambda x: x.name)

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
