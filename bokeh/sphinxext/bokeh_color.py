# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Document Bokeh named colors.

The ``bokeh-color`` directive accepts a named color as its argument:

.. code-block:: rest

    .. bokeh-color:: aliceblue

and generates a labeled color swatch as output.

    .. bokeh-color:: aliceblue

The ``bokeh-color`` direction may be used explicitly, but it can also be used
in conjunction with the :ref:`bokeh.sphinxext.bokeh_autodoc` extension.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import unchanged

# Bokeh imports
from bokeh.colors import named

# Bokeh imports
from .bokeh_directive import BokehDirective
from .templates import COLOR_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehColorDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehColorDirective(BokehDirective):

    has_content = False
    required_arguments = 1
    option_spec = {
        "module": unchanged,
    }

    def run(self):
        color = self.arguments[0]

        html = COLOR_DETAIL.render(color=getattr(named, color).to_css(), text=color)
        node = nodes.raw("", html, format="html")
        return [node]


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-color", BokehColorDirective)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
