# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Automatically document Bokeh Jinja2 templates.

This directive takes the module path to an attribute name that defines a Jinja2
template:

.. code-block:: rest

    .. bokeh-jinja:: bokeh.core.templates.FILE

Any template parameters will be displayed and the template source code will
be rendered in a collapsible code block. For example, the usage above will
generate the following output:

=====

.. bokeh-jinja:: bokeh.core.templates.FILE
    :noindex:

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
import textwrap
from os.path import basename
from typing import Any

# External imports
from sphinx.errors import SphinxError

# Bokeh imports
from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .templates import JINJA_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehJinjaDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehJinjaDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    option_spec = {
        "noindex": lambda x: True,  # directives.flag weirdly returns None
    }

    def run(self) -> list[Any]:
        template_path = self.arguments[0]
        module_path, template_name = template_path.rsplit(".", 1)

        try:
            module = importlib.import_module(module_path)
        except ImportError:
            raise SphinxError(f"Unable to import Bokeh template module: {module_path}")

        template = getattr(module, template_name, None)
        if template is None:
            raise SphinxError(f"Unable to find Bokeh template: {template_path}")

        template_text = open(template.filename).read()
        doc = _extract_leading_doc(template_text)

        filename = basename(template.filename)
        rst_text = JINJA_DETAIL.render(
            name=template_name,
            module=module_path,
            objrepr=repr(template),
            noindex=self.options.get("noindex", False),
            doc="" if doc is None else textwrap.dedent(doc),
            filename=filename,
            template_text=_strip_doc_comments(template_text),
        )

        return self.parse(rst_text, "<bokeh-jinja>")


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-jinja", BokehJinjaDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _extract_leading_doc(template_text: str) -> str | None:
    """ Return the body of a leading ``{# ... #}`` comment, or ``None`` if absent.

    Equivalent to the previous ``_DOCPAT.match(template_text).group(1)``: the
    comment must start at position 0 and have a non-empty body.
    """
    if not template_text.startswith("{#"):
        return None
    end = template_text.find("#}", 3)
    if end == -1:
        return None
    return template_text[2:end]


def _strip_doc_comments(template_text: str) -> str:
    """ Remove every ``{# ... #}`` comment, leaving unterminated ``{#`` intact.

    Equivalent to the previous ``_DOCPAT.sub("", template_text)``: the body must be
    non-empty, the shortest body wins, and matches are non-overlapping. The text is
    scanned once from left to right, so the work stays linear even when the input
    holds many ``{#`` and no ``#}`` (the old pattern retried at every one of them
    and rescanned the rest of the string each time).
    """
    out: list[str] = []
    pos = 0
    while True:
        start = template_text.find("{#", pos)
        if start == -1:
            out.append(template_text[pos:])
            return "".join(out)
        # The body needs at least one character, so an immediately following "#}"
        # does not close the comment.
        end = template_text.find("#}", start + 3)
        if end == -1:
            # Unterminated: nothing further in the text can match either.
            out.append(template_text[pos:])
            return "".join(out)
        out.append(template_text[pos:start])
        pos = end + 2

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
