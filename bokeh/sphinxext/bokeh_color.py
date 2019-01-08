#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Document Bokeh color objects.

The ``bokeh-color`` directive generates a color swatch for named colors
in the ``bokeh.colors`` module:

    .. bokeh-color:: aliceblue

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from docutils import nodes

# Bokeh imports
from bokeh.colors import named

from .bokeh_directive import BokehDirective
from .templates import COLOR_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehColorDirective',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehColorDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 2

    def run(self):

        color = self.arguments[0]

        html = COLOR_DETAIL.render(color=getattr(named, color).to_css(), text=color)
        node = nodes.raw('', html, format="html")
        return [node]

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-color', BokehColorDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
