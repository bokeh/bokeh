# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include plot metadata for plots shown in Bokeh gallery examples.

The ``bokeh-example-metadata`` directive can be used by supplying:

    .. bokeh-example-metadata::
        :sampledata: `sampledata_iris`
        :apis: `~bokeh.plotting.Figure.vbar`, :func:`~bokeh.transform.factor_cmap`
        :refs: `userguide_categorical_bars`
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

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
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
        "keywords": unchanged
    }

    def run(self):
        present = self.option_spec.keys() & self.options.keys()
        if not present:
            raise SphinxError("bokeh-example-metadata requires at least one option to be present.")

        extra = self.options.keys() - self.option_spec.keys()
        if extra:
            raise SphinxError(f"bokeh-example-metadata unknown options given: {extra}.")

        rst_text = EXAMPLE_METADATA.render(
            sampledata=self.options.get('sampledata', None),
            apis=self.options.get('apis', None),
            refs=self.options.get('refs', None),
            keywords=self.options.get('keywords', None)
        )

        return self.parse(rst_text, "<bokeh-example-metadata>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-example-metadata", BokehExampleMetadataDirective)

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
