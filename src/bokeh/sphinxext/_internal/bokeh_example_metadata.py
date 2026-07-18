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

# Standard library imports
from typing import Any

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
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

        rst_text = EXAMPLE_METADATA.render(
            sampledata=_sampledata(options.get("sampledata", None)),
            apis=_apis(options.get("apis", None)),
            refs=options.get("refs", "").split("#")[0],
            keywords=options.get("keywords", "").split("#")[0],
        )

        return self.parse(rst_text, "<bokeh-example-metadata>")


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-example-metadata", BokehExampleMetadataDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _sampledata(mods: str | None) -> str | None:
    if mods is None:
        return None

    # options lines might need a ruff noqa comment for line length, etc
    mods = mods.split("#")[0].strip()

    mod_names = (mod.strip() for mod in mods.split(","))

    return ", ".join(f":ref:`bokeh.sampledata.{mod} <sampledata_{mod}>`" for mod in mod_names)

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
