#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false, reportIndexIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from functools import wraps
from inspect import Parameter, Signature, signature
from typing import (
    Any,
    Callable,
    Sequence,
    cast,
)

from ._docstring import ParameterSpec, generate_docstring
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

type GlyphFunction = Callable[..., Any]
type GlyphMethodDecorator = Callable[[GlyphFunction], GlyphFunction]
type SourceAdapter = Callable[..., Any]
type SourceFactory = Callable[[], Any]

def marker_method() -> GlyphMethodDecorator:
    from ..models import Marker, Scatter
    glyphclass = Marker
    def decorator(func: GlyphFunction) -> GlyphFunction:
        parameters = cast(list[ParameterSpec], glyphclass.parameters())

        sigparams = [Parameter("self", Parameter.POSITIONAL_OR_KEYWORD)] + [x[0] for x in parameters] + [Parameter("kwargs", Parameter.VAR_KEYWORD)]

        marker_type = func.__name__

        @wraps(func)
        def wrapped(self: Any, *args: Any, **kwargs: Any) -> Any:
            from ..util.deprecation import deprecated

            deprecated((3, 4, 0), f"{func.__name__}() method", f"scatter(marker={func.__name__!r}, ...) instead")
            glyph_args = cast(Any, glyphclass)._args
            if len(args) > len(glyph_args):
                raise TypeError(f"{func.__name__} takes {len(glyph_args)} positional argument but {len(args)} were given")
            for arg, param in zip(args, sigparams[1:]):
                kwargs[param.name] = arg
            kwargs["marker"] = marker_type
            return create_renderer(Scatter, self, **kwargs)

        cast(Any, wrapped).__signature__ = Signature(parameters=sigparams, return_annotation=signature(func).return_annotation)

        wrapped.__doc__ = generate_docstring(glyphclass, parameters, func.__doc__)

        return wrapped

    return decorator

def glyph_method(
    glyphclass: Any,
    *,
    deprecated_since: tuple[int, int, int] | None = None,
    replacement: str | None = None,
    source_arg: str | None = None,
    source_fields: Sequence[str] = (),
    source_adapter: SourceAdapter | None = None,
    source_default: SourceFactory | None = None,
    exclude: Sequence[str] = (),
) -> GlyphMethodDecorator:
    has_source_input = source_arg is not None or bool(source_fields)
    if has_source_input != (source_adapter is not None):
        raise ValueError("source_arg or source_fields and source_adapter must be provided together")
    if source_arg in source_fields:
        raise ValueError("source_arg must not also be included in source_fields")
    if len(source_fields) != len(set(source_fields)):
        raise ValueError("source_fields must be unique")
    if source_default is not None and source_adapter is None:
        raise ValueError("source_default requires source inputs and source_adapter")

    def decorator(func: GlyphFunction) -> GlyphFunction:
        parameters = [
            parameter for parameter in cast(list[ParameterSpec], glyphclass.parameters())
            if parameter[0].name not in exclude
        ]
        positional_parameters = [
            parameter[0] for parameter in parameters
            if parameter[0].name in glyphclass._args
        ]

        source_param = [] if source_arg is None else [Parameter(source_arg, Parameter.POSITIONAL_OR_KEYWORD, default=None)]
        source_field_params = [Parameter(field, Parameter.KEYWORD_ONLY, default=None) for field in source_fields]
        glyph_params = [x[0] for x in parameters]
        keyword_start = next((i for i, param in enumerate(glyph_params) if param.kind == Parameter.KEYWORD_ONLY), len(glyph_params))
        glyph_params[keyword_start:keyword_start] = source_field_params
        sigparams = [
            Parameter("self", Parameter.POSITIONAL_OR_KEYWORD),
            *source_param,
            *glyph_params,
            Parameter("kwargs", Parameter.VAR_KEYWORD),
        ]

        @wraps(func)
        def wrapped(self: Any, *args: Any, **kwargs: Any) -> Any:
            nargs = len(args)
            if deprecated_since is not None:
                from ..util.deprecation import deprecated
                assert replacement is not None
                deprecated(deprecated_since, f"{func.__name__}() method", replacement)

            if has_source_input:
                source_data = None
                if args and source_arg is not None:
                    if source_arg in kwargs:
                        raise TypeError(f"{func.__name__} got multiple values for argument {source_arg!r}")
                    kwargs[source_arg], args = args[0], args[1:]

                if source_arg is not None:
                    source_data = kwargs.pop(source_arg, None)
                field_values = {field: kwargs.pop(field, None) for field in source_fields}
                supplied_fields = [field for field, value in field_values.items() if value is not None]
                if supplied_fields and len(supplied_fields) != len(source_fields):
                    missing = ", ".join(field for field in source_fields if field not in supplied_fields)
                    raise ValueError(f"source fields must be provided together (missing: {missing})")
                if source_data is not None and supplied_fields:
                    fields = ", ".join(source_fields)
                    raise ValueError(f"provide either {source_arg} data or {fields}, not both")

                if source_data is not None or supplied_fields:
                    if "source" in kwargs:
                        inputs = source_arg if source_data is not None else ", ".join(source_fields)
                        raise ValueError(f"provide either {inputs} data or a source, not both")
                    assert source_adapter is not None
                    source = source_adapter(source_data) if source_data is not None else source_adapter(**field_values)
                    kwargs["source"] = source
                    if source_data is None or source is not source_data:
                        kwargs["_source_is_internal"] = True
                elif source_default is not None and "source" not in kwargs:
                    kwargs["source"] = source_default()
                    kwargs["_source_is_internal"] = True

            unsupported = set(exclude) & kwargs.keys()
            if unsupported:
                names = ", ".join(sorted(unsupported))
                raise TypeError(f"{func.__name__} does not accept {names}; pass natural geometry records instead")

            if len(args) > len(positional_parameters):
                extra = 1 if source_arg is not None else 0
                maximum = len(positional_parameters) + extra
                raise TypeError(f"{func.__name__} takes {maximum} positional argument but {nargs} were given")
            for arg, param in zip(args, positional_parameters):
                kwargs[param.name] = arg
            if self.coordinates is not None:
                kwargs.setdefault("coordinates", self.coordinates)
            return create_renderer(glyphclass, self.plot, **kwargs)

        cast(Any, wrapped).__signature__ = Signature(parameters=sigparams, return_annotation=signature(func).return_annotation)

        wrapped.__doc__ = generate_docstring(glyphclass, parameters, func.__doc__)

        return wrapped

    return decorator

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
