"""

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from ..enums import enumeration, Orientation
from ..properties import Auto, Bool, Either, Enum, HasProps, Int, String

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

Scale = enumeration('linear', 'categorical', 'datetime')

class ChartOptions(HasProps):

    id = String(None, help="""
    Id of the chart.
    """)

    title = String(None, help="""
    A title for the chart.
    """)

    legend = Either(Bool, Enum(Orientation), help="""
    A location where the legend should draw itself.
    """)

    xgrid = Bool(True, help="""
    Whether to draw an x-grid.
    """)

    ygrid = Bool(True, help="""
    Whether to draw an y-grid.
    """)

    xlabel = String(None, help="""
    A label for the x-axis. (default: None)
    """)

    ylabel = String(None, help="""
    A label for the y-axis. (default: None)
    """)

    xscale = Either(Auto, Enum(Scale), help="""
    What kind of scale to use for the x-axis.
    """)

    yscale = Either(Auto, Enum(Scale), help="""
    What kind of scale to use for the y-axis.
    """)

    width = Int(600, help="""
    Width of the rendered chart, in pixels.
    """)

    height = Int(400, help="""
    Height of the rendered chart, in pixels.
    """)

    filename = Either(Bool(False), String, help="""
    A name for the file to save this chart to.
    """)

    server = Either(Bool(False), String, help="""
    A name to use to save this chart to on server.
    """)

    notebook = Either(Bool(False), String, help="""
    Whether to display the plot inline in an IPython/Jupyter
    notebook.
    """)

    tools = Either(Bool(True), String, help="""
    Whether to add default tools the the chart.
    """)



