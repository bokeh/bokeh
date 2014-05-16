""" Compatilibity layer for matplotlib.pyplot objects

This file defines the `show_bokeh` function used by Bokeh to display Matplotlib
figures. For more information about how to use it, just check the relevant
docstring.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from .mpl import to_bokeh

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def show_bokeh(fig=None, name=None, server=None, notebook=False, xkcd=False):
    # TODO: remove pyplot.show_bokeh() and pyplot at all in 0.6
    print("WARNING: 'pyplot.show_bokeh()' is deprecated and will be removed in "
          "Bokeh 0.6, please use mpl.to_bokeh() instead.")
    to_bokeh(fig, name, server, notebook, xkcd)
