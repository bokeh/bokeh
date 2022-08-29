#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from functools import wraps
from inspect import Parameter, Signature

# Bokeh imports
from ._docstring import generate_docstring
from ._renderer import create_renderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'glyph_method',
    'marker_method',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def marker_method():
    from ..models import Marker, Scatter
    glyphclass = Marker
    def decorator(func):
        parameters = glyphclass.parameters()

        sigparams = [Parameter("self", Parameter.POSITIONAL_OR_KEYWORD)] + [x[0] for x in parameters] + [Parameter("kwargs", Parameter.VAR_KEYWORD)]

        marker_type = func.__name__

        @wraps(func)
        def wrapped(self, *args, **kwargs):
            if len(args) > len(glyphclass._args):
                raise TypeError(f"{func.__name__} takes {len(glyphclass._args)} positional argument but {len(args)} were given")
            for arg, param in zip(args, sigparams[1:]):
                kwargs[param.name] = arg
            kwargs["marker"] = marker_type
            return create_renderer(Scatter, self, **kwargs)

        wrapped.__signature__ = Signature(parameters=sigparams)
        wrapped.__name__ = func.__name__

        wrapped.__doc__ = generate_docstring(glyphclass, parameters, func.__doc__)

        return wrapped

    return decorator

def glyph_method(glyphclass):
    def decorator(func):
        parameters = glyphclass.parameters()

        sigparams = [Parameter("self", Parameter.POSITIONAL_OR_KEYWORD)] + [x[0] for x in parameters] + [Parameter("kwargs", Parameter.VAR_KEYWORD)]

        @wraps(func)
        def wrapped(self, *args, **kwargs):
            if len(args) > len(glyphclass._args):
                raise TypeError(f"{func.__name__} takes {len(glyphclass._args)} positional argument but {len(args)} were given")
            for arg, param in zip(args, sigparams[1:]):
                kwargs[param.name] = arg
            if self.coordinates is not None:
                kwargs.setdefault("coordinates", self.coordinates)
            return create_renderer(glyphclass, self.plot, **kwargs)

        wrapped.__signature__ = Signature(parameters=sigparams)
        wrapped.__name__ = func.__name__

        wrapped.__doc__ = generate_docstring(glyphclass, parameters, func.__doc__)

        return wrapped

    return decorator

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
