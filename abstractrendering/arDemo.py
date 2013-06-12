#!/usr/bin/env python
"""
Draws a colormapped image plot
 - Left-drag pans the plot.
 - Mousewheel up and down zooms the plot in and out.
 - Pressing "z" brings up the Zoom Box, and you can click-drag a rectangular
   region to zoom.  If you use a sequence of zoom boxes, pressing alt-left-arrow
   and alt-right-arrow moves you forwards and backwards through the "zoom
   history".
"""
# Abstract rendering imports
import ar
import counts
import rle
import infos

# Major library imports
from numpy import exp, linspace, meshgrid

# Enthought library imports
from enable.api import Component, ComponentEditor
from traits.api import HasTraits, Instance
from traitsui.api import Item, Group, View

# Chaco imports
from chaco.api import ArrayPlotData, jet, Plot
from chaco.tools.api import PanTool, ZoomTool

#===============================================================================
# # Create the Chaco plot.
#===============================================================================
def _create_plot_component():
    red = ar.Color(255,0,0,255)
    blue = ar.Color(0,255,0,255)
    white = ar.Color(255,255,255,255)


    #Checkerboard demo ---- 
    #glyphs = ar.load_csv("checkerboard.csv", 2, 0, 1, 3)
    #image = ar.render(glyphs, ar.containing, infos.attribute("color",None), rle.COC, rle.minPercent(.5,red,blue,white), 20,20, ar.AffineTransform(0,0,.25,.25))

    #Circlpoints series A/B
    glyphs = ar.load_csv("circlepoints.csv", 1, 2, 3, 4)
    image = ar.render(glyphs, ar.containing, infos.attribute("value",None), rle.COC, rle.minPercent(.5,red,blue,white), 20,20, ar.AffineTransform(-1,-1,.15,.15))
    
    # Create a plot data object and give it this data
    pd = ArrayPlotData()
    pd.set_data("imagedata", image.as_nparray())

    # Create the plot
    plot = Plot(pd)
    img_plot = plot.img_plot("imagedata")[0]

    # Tweak some of the plot properties
    plot.title = "Abstract Rendering"
    plot.padding = 50

    # Attach some tools to the plot
    plot.tools.append(PanTool(plot))
    zoom = ZoomTool(component=img_plot, tool_mode="box", always_on=False)
    img_plot.overlays.append(zoom)
    return plot


#===============================================================================
# Attributes to use for the plot view.
size=(800,600)
title="Basic Colormapped Image Plot"

#===============================================================================
# # Demo class that is used by the demo.py application.
#===============================================================================
class Demo(HasTraits):
    plot = Instance(Component)

    traits_view = View(
                    Group(
                        Item('plot', editor=ComponentEditor(size=size),
                             show_label=False),
                        orientation = "vertical"),
                    resizable=True, title=title
                    )
    def _plot_default(self):
         return _create_plot_component()

demo = Demo()

if __name__ == "__main__":
    demo.configure_traits()
