"""
Functional interface for implementing qplot() like functionality in 
Python using Chaco.  Uses other Bokeh classes to represent the pipeline
and constructs a session-level object using the Chaco shell.
"""

import chaco.shell
from chaco.shell import *

from ggplot import GGPlot, Aesthetic, GeomPoint, GeomLine, Facet, Factor, Tool

_auto_show = True
_plot_object = None

def ggplot(data=None, aes=None):
    obj = GGPlot(dataset=data)
    if aes:
        obj += aes
    if _auto_show:
        obj.show_plot()
    global _plot_object
    _plot_object = obj
    return obj

def aes(x=None, y=None, **kw):
    return Aesthetic(x=x, y=y, **kw)

factor = Factor

def show_plot():
    _plot_object.show_plot()

def auto_show(state=None):
    """ Toggles or sets auto-display on and off. Right now, faceting requires this
    to be off.
    """
    global _auto_show
    if state:
        _auto_show = state
    else:
        _auto_show = not _auto_show

def geom_point(position=None, **aes):
    g = GeomPoint()
    if aes:
        # Should we chain the geoms/aes together, or is it OK to bake the
        # traits in at this point?
        g.set(**aes)
    if position is not None:
        g.position = position
    return g
    
def geom_line(**aes):
    g = GeomLine()
    if aes:
        # Should we chain the geoms/aes together, or is it OK to bake the
        # traits in at this point?
        g.set(**aes)
    return g

def geom_boxplot(aes=None):
    pass

def tool_regression():
    return Tool(type="regression")

def tool_pan(button=None):
    return Tool(type="pan", button=button)

def tool_zoom():
    return Tool(type="zoom")

def xlim(x1, x2):
    pass

def ylim(y1, y2):
    pass

# Just expose the Facet classmethods
facet_wrap = Facet.wrap
facet_grid = Facet.grid


def qplot(xname, yname, data=None, geom=None, **aesthetics):
    """ Quick function for constructing a GGPlot instance and returning
    it so that additional qqplot things can be tweaked on top of it.
    """

    geomfunc = {"point": geom_point,
                "line": geom_line,
                "boxplot": geom_boxplot,
                None: geom_point}[geom]

    return ggplot(data, aes(xname, yname, **aesthetics)) + geomfunc()




# add qplot and various other commands to the module namespace of chaco.shell
#from chaco import shell
#for funcname in ('qplot','facet_wrap','facet_grid'):
#    setattr(shell, funcname, eval(funcname))



