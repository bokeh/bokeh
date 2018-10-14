#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide access to built-in themes:

CALIBER
~~~~~~~

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show
    from bokeh.themes import built_in_themes
    from bokeh.io import curdoc

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("caliber.html")
    curdoc().theme = 'caliber'
    p = figure(title='caliber', plot_width=300, plot_height=300)
    p.line(x, y)
    show(p)

DARK_MINIMAL
~~~~~~~~~~~~

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show
    from bokeh.themes import built_in_themes
    from bokeh.io import curdoc

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("dark_minimal.html")
    curdoc().theme = 'dark_minimal'
    p = figure(title='dark_minimal', plot_width=300, plot_height=300)
    p.line(x, y)
    show(p)


LIGHT_MINIMAL
~~~~~~~~~~~~~

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show
    from bokeh.themes import built_in_themes
    from bokeh.io import curdoc

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("light_minimal.html")
    curdoc().theme = 'light_minimal'
    p = figure(title='light_minimal', plot_width=300, plot_height=300)
    p.line(x, y)
    show(p)

as well as the ``Theme`` class that can be used to create new Themes.

.. autoclass:: Theme

'''
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from . import _caliber, _dark_minimal, _light_minimal
from .theme import Theme

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CALIBER',
    'DARK_MINIMAL',
    'LIGHT_MINIMAL',
    'Theme',
    'built_in_themes',
    'default',
)

CALIBER       = 'caliber'
LIGHT_MINIMAL = 'light_minimal'
DARK_MINIMAL  = 'dark_minimal'

default = Theme(json={})

built_in_themes = {
    CALIBER       : Theme(json=_caliber.json),
    DARK_MINIMAL  : Theme(json=_dark_minimal.json),
    LIGHT_MINIMAL : Theme(json=_caliber.json),
}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#----------------------------------------------------------------------------
