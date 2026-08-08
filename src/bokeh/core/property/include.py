#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Provide explicit declarations for reusable groups of Bokeh properties."""

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
from copy import copy
from textwrap import dedent
from typing import Any

# Bokeh imports
from ..has_props import HasProps

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Include',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Include:
    """ Include "mix-in" property collection in a Bokeh model.

    Includes are expanded by ``HasProps.__init_subclass__``.
    They are not properties and do not participate in descriptor creation for
    ordinary property declarations.

    The ``help`` template can use ``{prop}`` for the unprefixed, human-readable
    property name, ``{name}`` for its final name, ``{model}`` for the receiving
    class, and ``{doc}`` for the original property help. The original help is
    appended automatically when the template does not contain ``{doc}``.

    See :ref:`bokeh.core.property_mixins` for more details.

    """

    def __init__(self, delegate: type[HasProps], *, help: str = "", prefix: str | None = None) -> None:
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError(f"expected a subclass of HasProps, got {delegate!r}")

        self.delegate = delegate
        self.help = help
        self.prefix = prefix + "_" if prefix else ""

    def __set_name__(self, owner: type[Any], name: str) -> None:
        own_includes = owner.__dict__.get("__property_includes__")
        if not isinstance(own_includes, dict):
            own_includes = {}
            setattr(owner, "__property_includes__", own_includes)

        own_includes[name] = self
        if owner.__dict__.get(name) is self:
            delattr(owner, name)

    def _include(self, owner: type[HasProps]) -> None:
        for descriptor in self.delegate.descriptors():
            name = self.prefix + descriptor.name
            if name in owner.__dict__:
                raise RuntimeError(f"Multiple property declarations created {owner.__name__}.{name}")

            prop = copy(descriptor.property)
            template = dedent(self.help).strip()
            original = dedent(descriptor.__doc__ or "").strip()
            if "{doc}" not in template:
                template += "\n\n{doc}"
            prop.__doc__ = template.format(
                doc=original,
                model=owner.__name__,
                name=name,
                prop=descriptor.name.replace("_", " "),
            ).strip()
            prop.__set_name__(owner, name)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
