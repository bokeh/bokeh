# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include link from sampledata to gallery.

The ``bokeh-example-sampledata`` directive can be used by supplying:

    .. bokeh-example-sampledata:: sampledata_iris

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

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import EXAMPLE_SAMPLEDATA
from .util import get_sphinx_resources

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehExampleSampledataDirective",
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
        rst_text = EXAMPLE_SAMPLEDATA.render(
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
        if _s == []:
            return None
        elif len(_s) == 1:
            return f"{f}`{_s[-1]}`"
        else:
            return " and ".join([", ".join(f"{f}`{s}`" for s in _s), f"{f}`{_s[-1]}`"])

    mods = (mod.strip() for mod in mods.split(","))

    standalones = []
    examples = []
    for mod in mods:
        with open("sampledata.csv","r") as f:
            lines = f.readlines()

        for line in lines:
            sp = line.split(";")
            if mod in sp[1]:
                examples.append(sp[0])
                #standalones.append([])

    example = _join(_s=examples, f=":bokeh-tree:")
    standalone = _join(standalones, f="")

    return standalone, example

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
