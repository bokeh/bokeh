# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate an inline visual representations of a pandas Dataframe.

This directive will embed the output of ``df.head().to_html()`` into the HTML
output.

For example:

.. code-block:: rest

    :bokeh-dataframe:`bokeh.sampledata.sprint.sprint`

Will generate the output:

    :bokeh-dataframe:`bokeh.sampledata.sprint.sprint`

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

# External imports
import pandas as pd
from docutils import nodes
from sphinx.errors import SphinxError

# Bokeh imports
from . import PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "bokeh_dataframe",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def bokeh_dataframe(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Generate an inline visual representation of a single color palette.

    If the HTML representation of the dataframe can not be created, a
    SphinxError is raised to terminate the build.

    For details on the arguments to this function, consult the Docutils docs:

    http://docutils.sourceforge.net/docs/howto/rst-roles.html#define-the-role-function

    """
    module_name, df_name = text.rsplit(".", 1)

    try:
        module = importlib.import_module(module_name)
    except ImportError:
        raise SphinxError(f"Unable to generate HTML table for {df_name}: couldn't import module {module_name}")

    df = getattr(module, df_name, None)
    if df is None:
        raise SphinxError(f"Unable to generate HTML table for {df_name}: no Dataframe {df_name} in module {module_name}")

    if not isinstance(df, pd.DataFrame):
        raise SphinxError(f"{text!r} is not a pandas Dataframe")

    node = nodes.raw("", df.head().to_html(), format="html")
    return [node], []


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_role("bokeh-dataframe", bokeh_dataframe)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
