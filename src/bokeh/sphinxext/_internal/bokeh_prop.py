# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Thoroughly document Bokeh property attributes.

The ``bokeh-prop`` directive generates documentation for Bokeh model properties,
including cross links to the relevant property types. Additionally, any
per-attribute help strings are also displayed.

This directive takes the name *(class.attr)* of a Bokeh property as its
argument and the module as an option:

.. code-block:: rest

    .. bokeh-prop:: SomeModel.thing

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import importlib
import re
import textwrap
import warnings
from dataclasses import dataclass
from typing import Any

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
from bokeh.core.property._sphinx import type_link
from bokeh.core.property.descriptors import AliasPropertyDescriptor, PropertyDescriptor
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .templates import PROP_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehPropDirective",
    "setup",
)

_model_instances: dict[type[Any], Any] = {}


@dataclass
class _TypeExpression:
    head: str
    arguments: list[_TypeExpression]

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehPropDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 2
    option_spec = {"module": unchanged, "type": unchanged}

    def run(self) -> list[Any]:

        full_name = self.arguments[0]
        model_name, _ = full_name.rsplit(".")
        module_name = self.options["module"]

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError(f"Could not generate reference docs for {full_name}: could not import module {module_name}")

        model = getattr(module, model_name, None)
        if model is None:
            raise SphinxError(f"Unable to generate reference docs for {full_name}: no model {model_name} in module {module_name}")

        model_obj = _model_instances.get(model)
        if model_obj is None:
            # We may need to instantiate deprecated objects as part of
            # documenting them. Suppress warnings just for this case and cache
            # the instance because a model page renders every property.
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
                model_obj = model()
            _model_instances[model] = model_obj

        rst_text = _render_property_detail(model_obj, full_name, self.options["module"], qualified=False)

        if PROP_DETAIL.filename is not None:
            self.env.note_dependency(PROP_DETAIL.filename)

        return self.parse(rst_text, f"<bokeh-prop: {full_name}>")


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-prop", BokehPropDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


def _render_property_detail(model_obj: Any, full_name: str, module: str, *, qualified: bool = True) -> str:
    """Render one Bokeh property using the standard property template."""
    model_name, prop_name = full_name.rsplit(".")

    try:
        descriptor = model_obj.lookup(prop_name)
    except AttributeError:
        raise SphinxError(f"Unable to generate reference docs for {full_name}: no property {prop_name} on model {model_name}")

    value_descriptor = descriptor
    while isinstance(value_descriptor, AliasPropertyDescriptor):
        value_descriptor = model_obj.lookup(value_descriptor.aliased_name)

    if not isinstance(value_descriptor, PropertyDescriptor):
        raise SphinxError(
            f"Unable to generate reference docs for {full_name}: unsupported descriptor {type(descriptor).__name__}",
        )

    include = getattr(descriptor.property, "_include", None)
    doc = descriptor.__doc__ if include is None else include._render_doc(model_name, prop_name)

    return PROP_DETAIL.render(
        name=full_name if qualified else prop_name,
        module=module,
        default=repr(value_descriptor.instance_default(model_obj)),
        type_lines=_type_link_lines(type_link(value_descriptor.property)),
        doc="" if doc is None else textwrap.dedent(doc).strip(),
    )


_TYPE_ROLE_RE = re.compile(r":[a-z]+:`~?([^`]+)`\\ ")


def _type_link_lines(type_info: str) -> list[str]:
    """Format a long nested property type as an indented linked expression."""
    expression, end = _parse_type_expression(type_info)
    display = _TYPE_ROLE_RE.sub(lambda match: match.group(1).rsplit(".", 1)[-1], type_info).replace("\\ ", "")

    if expression is None or end != len(type_info) or len(display) <= 48:
        return [type_info]

    return _format_type_expression(expression)


def _parse_type_expression(value: str, start: int = 0) -> tuple[_TypeExpression | None, int]:
    position = start
    while position < len(value) and value[position] not in "(),":
        position += 1

    raw_head = value[start:position]
    head = raw_head.strip()
    if raw_head.endswith("\\ "):
        head += " "
    if not head:
        return None, position

    arguments: list[_TypeExpression] = []
    if position < len(value) and value[position] == "(":
        position += 1
        while position < len(value) and value[position] != ")":
            argument, position = _parse_type_expression(value, position)
            if argument is None:
                return None, position
            arguments.append(argument)

            if position < len(value) and value[position] == ",":
                position += 1
                while position < len(value) and value[position].isspace():
                    position += 1
            elif position < len(value) and value[position] != ")":
                return None, position

        if position >= len(value):
            return None, position
        position += 1

    return _TypeExpression(head, arguments), position


def _format_type_expression(expression: _TypeExpression, indent: int = 0) -> list[str]:
    prefix = "  " * indent
    if not expression.arguments:
        return [f"{prefix}{expression.head}"]

    if not _multiline_type_expression(expression):
        formatted_argument = _format_type_expression(expression.arguments[0])[0]
        return [f"{prefix}{expression.head}({formatted_argument})"]

    lines = [f"{prefix}{expression.head}("]
    for index, argument_expression in enumerate(expression.arguments):
        argument_lines = _format_type_expression(argument_expression, indent + 1)
        if index < len(expression.arguments) - 1:
            argument_lines[-1] += ","
        lines.extend(argument_lines)
    lines.append(f"{prefix})")
    return lines


def _multiline_type_expression(expression: _TypeExpression) -> bool:
    return len(expression.arguments) > 1 or any(
        _multiline_type_expression(argument)
        for argument in expression.arguments
    )

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
