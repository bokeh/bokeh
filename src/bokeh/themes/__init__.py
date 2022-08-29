#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide access to built-in themes:

Built-in themes
---------------

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
    p = figure(title='caliber', width=300, height=300)
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
    p = figure(title='dark_minimal', width=300, height=300)
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
    p = figure(title='light_minimal', width=300, height=300)
    p.line(x, y)
    show(p)

NIGHT_SKY
~~~~~~~~~

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show
    from bokeh.themes import built_in_themes
    from bokeh.io import curdoc

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("night_sky.html")
    curdoc().theme = 'night_sky'
    p = figure(title='night_sky', width=300, height=300)
    p.line(x, y)
    show(p)

CONTRAST
~~~~~~~~

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show
    from bokeh.themes import built_in_themes
    from bokeh.io import curdoc

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("contrast.html")
    curdoc().theme = 'contrast'
    p = figure(title='contrast', width=300, height=300)
    p.line(x, y)
    show(p)

Theme
-----

.. autoclass:: Theme

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from . import (
    _caliber,
    _contrast,
    _dark_minimal,
    _light_minimal,
    _night_sky,
)
from .theme import Theme

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CALIBER',
    'DARK_MINIMAL',
    'LIGHT_MINIMAL',
    'NIGHT_SKY',
    'CONTRAST',
    'Theme',
    'built_in_themes',
    'default',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

CALIBER       = 'caliber'
LIGHT_MINIMAL = 'light_minimal'
DARK_MINIMAL  = 'dark_minimal'
NIGHT_SKY  = 'night_sky'
CONTRAST  = 'contrast'

default = Theme(json={})

built_in_themes = {
    CALIBER       : Theme(json=_caliber.json),
    DARK_MINIMAL  : Theme(json=_dark_minimal.json),
    LIGHT_MINIMAL : Theme(json=_caliber.json),
    NIGHT_SKY : Theme(json=_night_sky.json),
    CONTRAST : Theme(json=_contrast.json),
}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#----------------------------------------------------------------------------
