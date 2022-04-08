# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include link from sampledata to gallery.

The ``bokeh-example-sampledata`` directive can be used by supplying:

    .. bokeh-example-sampledata::
        :sampledata: `sampledata_iris`

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
import pandas as pd
from docutils.parsers.rst.directives import unchanged
from sphinx.errors import SphinxError

# Bokeh imports
from . import PARALLEL_SAFE
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


class BokehExampleSampledataDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self):
        
        standalone_path, example_path = _sampledata(self.arguments[0])
        
        rst_text = EXAMPLE_METADATA.render(
            standalone_path=standalone_path,
            example_path=example_path
        )

        return self.parse(rst_text, "<bokeh-example-sampledata>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-example-sampledata", BokehExampleSampledataDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _sampledata(mods: str | None) -> str | None:
    if mods is None:
        return

    def _join(_s:list, f:str):
        return " and ".join(", ".join(f"{f}`{s}`" for s in _s[:-1] + _s[-1])
    
    mods = (mod.strip() for mod in mods.split(","))
    
    standalones = []
    examples = []
    for mod in mods:
        df = pd.read_csv('sampledata.csv')
        df = df[df['keyword']==mod]
        examples.extend(df['path'].to_list())
        standalone.extend([])
    
    example = _join(_s=examples, f=':bokeh-tree:')
    standalone = _join(standalone, f='')

    return standalone or None, example or None

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
