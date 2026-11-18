# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include plot metadata for plots shown in Bokeh gallery examples.

The ``bokeh-example-metadata`` directive can be used by supplying:

    .. bokeh-example-metadata::
        :sampledata: `sampledata_iris`
        :apis: `~bokeh.plotting.figure.vbar`, :func:`~bokeh.transform.factor_cmap`
        :refs: `ug_basic_bars`
        :words: bar, vbar, legend, factor_cmap, palette

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# use the wrapped sphinx logger
from sphinx.util import logging  # isort:skip
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

import ast
import re
from pathlib import Path
from textwrap import dedent
from tokenize import (
    COMMENT,
    NEWLINE,
    NL,
    OP,
    STRING,
    generate_tokens,
    open as open_python,
    untokenize,
)
from typing import Any

from docutils.parsers.rst.directives import flag, unchanged
from sphinx.errors import SphinxError

from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .templates import EXAMPLE_METADATA
from .util import get_sphinx_resources

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehExampleMetadataDirective",
    "setup",
)

RESOURCES = get_sphinx_resources()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehExampleMetadataDirective(BokehDirective):

    has_content = True
    required_arguments = 0

    option_spec = {
        "sampledata": unchanged,
        "apis": unchanged,
        "refs": unchanged,
        "keywords": unchanged,
        "title": unchanged,
        "gallery": flag,
        "thumbnail-alt": unchanged,
        "example-ref": unchanged,
    }

    def run(self) -> list[Any]:
        option_spec = self.option_spec
        assert option_spec is not None

        options = self.options
        assert options is not None

        present = option_spec.keys() & options.keys()
        if not present:
            raise SphinxError("bokeh-example-metadata requires at least one option to be present.")

        extra = options.keys() - option_spec.keys()
        if extra:
            raise SphinxError(f"bokeh-example-metadata unknown options given: {extra}.")

        if not present & {"sampledata", "apis", "refs", "keywords"}:
            return []

        rst_text = EXAMPLE_METADATA.render(
            sampledata=_sampledata(options.get("sampledata", None)),
            apis=_apis(options.get("apis", None)),
            refs=options.get("refs", "").split("#")[0],
            keywords=options.get("keywords", "").split("#")[0],
        )

        return self.parse(rst_text, "<bokeh-example-metadata>")


def read_example_metadata(path: Path) -> tuple[str, dict[str, str]]:
    """Read the opening paragraph and metadata fields without running the example."""
    with open_python(path) as file:
        tokens = (token for token in generate_tokens(file.readline) if token.type not in {COMMENT, NL})
        first = next(tokens, None)
        if first is None or (first.type != STRING and (first.type != OP or first.string != "(")):
            return "", {}
        statement = [(first.type, first.string)]
        for token in tokens:
            if token.type == NEWLINE:
                break
            statement.append((token.type, token.string))

    marker = ".. bokeh-example-metadata::"
    docstring = ast.get_docstring(ast.parse(untokenize(statement), filename=str(path))) or ""
    intro, _, options = docstring.partition(marker)
    summary = " ".join(intro.strip().split("\n\n", 1)[0].split())
    if summary.startswith(".. "):
        summary = ""
    # Summaries also appear outside the docstring's reference context.
    summary = re.sub(r"(?::[\w:-]+:)?``?([^`]+)``?_{0,2}", lambda m: m[1].partition(" <")[0].lstrip("~"), summary)
    option_block = dedent(options.split("\n\n", 1)[0])
    fields = {
        key: " ".join(value.split())
        for key, value in re.findall(r"^:([\w-]+):[ \t]*(.*(?:\n[ \t]+\S[^\n]*)*)", option_block, re.MULTILINE)
    }
    return summary, fields


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-example-metadata", BokehExampleMetadataDirective)

    return PARALLEL_SAFE


def sampledata_modules(value: str | None) -> list[str]:
    """Return the declared sample-data module names in their original order."""
    if value is None:
        return []
    names = (name.strip() for name in value.partition("#")[0].split(","))
    return [name for name in names if name]

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _sampledata(mods: str | None) -> str | None:
    # Some example datasets have no module page in the reference.
    return ", ".join(f":mod:`bokeh.sampledata.{mod}`" for mod in sampledata_modules(mods)) or None

def _apis(apis: str | None) -> str | None:
    if apis is None:
        return None

    # options lines might need a ruff noqa comment for line length, etc
    apis = apis.split("#")[0].strip()

    results = []

    for api in (api.strip() for api in apis.split(",")):
        last = api.split(".")[-1]

        # handle a few special cases more carefully
        if api.startswith("bokeh.models"):
            results.append(f":class:`bokeh.models.{last} <{api}>`")
        elif "figure." in api:
            results.append(f":meth:`figure.{last} <{api}>`")
        elif "GMap." in api:
            results.append(f":meth:`GMap.{last} <{api}>`")

        # just use class role as-is for anything else
        else:
            results.append(f":class:`{api}`")

    return ", ".join(results)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
