# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate an inline visual representations of a single color palette.

The ``:bokeh-palette:`` role can be used with by providing any of the
following:

* a palette name from ``bokeh.palettes``, e.g. ``Spectral9``

* a palette function from ``bokeh.palettes`` called with argument, e.g. ``viridis(12)``

* An explicit list of colors: ``['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']``

The following usage of the the directive:

.. code-block:: rest

    * by name: :bokeh-palette:`Spectral9`

    * by function: :bokeh-palette:`viridis(12)`

    * by list: :bokeh-palette:`['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']`

Generates the output:

    * by name: :bokeh-palette:`Spectral9`

    * by function: :bokeh-palette:`viridis(12)`

    * by list: :bokeh-palette:`['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']`

Palette swatches are 20 pixels in height. For palettes short than 20 colors,
the default width for the swatches is 20 pixels. If larger palettes are given,
the width of the HTML spans is progressively reduced, down to a minimum of one
pixel. For instance displaying the full Viridis palette with the expression

.. code-block:: rest

    :bokeh-palette:`viridis(256)`

Will generate the output:

    :bokeh-palette:`viridis(256)`

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

# External imports
from docutils import nodes
from sphinx.errors import SphinxError

# Bokeh imports
from . import PARALLEL_SAFE
from .templates import PALETTE_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "bokeh_palette",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def bokeh_palette(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Generate an inline visual representations of a single color palette.

    This function evaluates the expression ``f"palette = {text}"``, in the
    context of a ``globals`` namespace that has previously imported all of
    |bokeh.plotting|. The resulting value for ``palette`` is used to
    construct a sequence of HTML ``<span>`` elements for each color.

    If evaluating the palette expression fails or does not produce a list or
    tuple of all strings, then a SphinxError is raised to terminate the build.

    For details on the arguments to this function, consult the Docutils docs:

    http://docutils.sourceforge.net/docs/howto/rst-roles.html#define-the-role-function

    """
    try:
        exec(f"palette = {text}", _globals)
    except Exception as e:
        raise SphinxError(f"cannot evaluate palette expression {text!r}, reason: {e}")
    p = _globals.get("palette", None)
    if not isinstance(p, (list, tuple)) or not all(isinstance(x, str) for x in p):
        raise SphinxError(f"palette expression {text!r} generated invalid or no output: {p}")
    w = 20 if len(p) < 15 else 10 if len(p) < 32 else 5 if len(p) < 64 else 2 if len(p) < 128 else 1
    html = PALETTE_DETAIL.render(palette=p, width=w)
    node = nodes.raw("", html, format="html")
    return [node], []


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_role("bokeh-palette", bokeh_palette)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

_globals = {}
exec("from bokeh.palettes import *", _globals)
