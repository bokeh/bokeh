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
from .override import Override

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

    Includes expand in place while the receiving class is created. They are not
    properties and do not participate in descriptor creation for ordinary
    property declarations.

    The ``help`` template can use ``{prop}`` for the unprefixed, human-readable
    property name, ``{name}`` for its final name, ``{model}`` for the receiving
    class, and ``{doc}`` for the original property help. Reference documentation
    renders ``{model}`` using the class whose page contains the inherited
    property. The original help is appended automatically when the template
    does not contain ``{doc}``.

    See :ref:`bokeh.core.property_mixins` for more details.

    """

    def __init__(self, delegate: type[HasProps], *, help: str = "", prefix: str | None = None) -> None:
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError(f"expected a subclass of HasProps, got {delegate!r}")

        self.delegate = delegate
        self.help = help
        self.prefix = prefix + "_" if prefix else ""

        template = dedent(help).strip()
        if "{doc}" not in template:
            template += "\n\n{doc}"
        self._template = template

    def _render_doc(self, model: str, name: str, descriptor: Any | None = None) -> str:
        source_name = name.removeprefix(self.prefix)
        if descriptor is None:
            descriptor = self.delegate.lookup(source_name)

        return self._template.format(
            doc=dedent(descriptor.__doc__ or "").strip(),
            model=model,
            name=name,
            prop=source_name.replace("_", " "),
        ).strip()

    def __set_name__(self, owner: type[Any], name: str) -> None:
        for descriptor in self.delegate.descriptors():
            prop_name = self.prefix + descriptor.name
            if prop_name in owner.__dict__:
                existing = owner.__dict__[prop_name]
                if existing is not self and not isinstance(existing, Override):
                    raise RuntimeError(f"Multiple property declarations created {owner.__name__}.{prop_name}")

            prop = copy(descriptor.property)
            setattr(prop, "_include", self)
            prop.__doc__ = self._render_doc(owner.__name__, prop_name, descriptor)
            prop.__set_name__(owner, prop_name)

        if owner.__dict__.get(name) is self:
            delattr(owner, name)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
