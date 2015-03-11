"Supporting objects and functions to convert Matplotlib objects into Bokeh."
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

from __future__ import absolute_import

import itertools
import warnings

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .models.glyphs import (Asterisk, Circle, Cross, Diamond, InvertedTriangle,
                            Line, MultiLine, Patches, Square, Text, Triangle, X)
from .mplexporter.exporter import Exporter
from .mplexporter.renderers import Renderer
from .mpl_helpers import (convert_dashes, delete_last_col, get_props_cycled,
                          is_ax_end, xkcd_line)
from .models import (ColumnDataSource, DataRange1d, DatetimeAxis, GlyphRenderer,
                     Grid, GridPlot, LinearAxis, PanTool, Plot, PreviewSaveTool,
                     ResetTool, WheelZoomTool)
from .plotting import (curdoc, output_file, output_notebook, output_server,
                       DEFAULT_TOOLS)
from .plotting_helpers import _process_tools_arg

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class BokehRenderer(Renderer):

    def __init__(self, pd_obj, xkcd):
        "Initial setup."
        self.fig = None
        self.pd_obj = pd_obj
        self.xkcd = xkcd
        self.source = ColumnDataSource()
        self.xdr = DataRange1d()
        self.ydr = DataRange1d()
        self.non_text = [] # to save the text we don't want to convert by draw_text

    def open_figure(self, fig, props):
        "Get the main plot properties and create the plot."
        self.width = int(props['figwidth'] * props['dpi'])
        self.height = int(props['figheight'] * props['dpi'])
        self.plot = Plot(x_range=self.xdr,
                         y_range=self.ydr,
                         plot_width=self.width,
                         plot_height=self.height)

    def close_figure(self, fig):
        "Complete the plot: add tools."
        # Add tools
        tool_objs = _process_tools_arg(self.plot, DEFAULT_TOOLS)
        self.plot.add_tools(*tool_objs)

        # Simple or Grid plot setup
        if len(fig.axes) <= 1:
            self.fig = self.plot
        else:
            # This list comprehension splits the plot.renderers list at the "marker"
            # points returning small sublists corresponding with each subplot.
            subrends = [list(x[1]) for x in itertools.groupby(
                        self.plot.renderers, lambda x: is_ax_end(x)) if not x[0]]
            plots = []
            for i, axes in enumerate(fig.axes):
                # create a new plot for each subplot
                _plot = Plot(x_range=self.xdr,
                             y_range=self.ydr,
                             plot_width=self.width,
                             plot_height=self.height)
                _plot.title = ""
                # and add new tools
                _tool_objs = _process_tools_arg(_plot, DEFAULT_TOOLS)
                _plot.add_tools(*_tool_objs)
                # clean the plot ref from axis and grids
                _plot_rends = subrends[i]
                for r in _plot_rends:
                    if not isinstance(r, GlyphRenderer):
                        r.plot = None
                # add all the renderers into the new subplot
                _plot.add_layout(_plot_rends[0], 'below')  # xaxis
                _plot.add_layout(_plot_rends[1], 'left')  # yaxis
                _plot.add_layout(_plot_rends[2])  # xgrid
                _plot.add_layout(_plot_rends[3])  # ygrid
                for r in _plot_rends[4:]:  # all the glyphs
                    _plot.renderers.append(r)
                plots.append(_plot)
            (a, b, c) = fig.axes[0].get_geometry()
            p = np.array(plots)
            n = np.resize(p, (a, b))
            grid = GridPlot(children=n.tolist())
            self.fig = grid

    def open_axes(self, ax, props):
        "Get axes data and create the axes and grids"
        # Get axes, title and grid into class attributes.
        self.ax = ax
        self.plot.title = ax.get_title()
        # to avoid title conversion by draw_text later
        self.non_text.append(self.plot.title)
        self.grid = ax.get_xgridlines()[0]

        # Add axis
        bxaxis = self.make_axis(ax.xaxis, "below", props['xscale'])
        byaxis = self.make_axis(ax.yaxis, "left", props['yscale'])

        # Add grids
        self.make_grid(bxaxis, 0)
        self.make_grid(byaxis, 1)

        # Setup collections info
        nones = ("", " ", "None", "none", None)
        cols = [col for col in self.ax.collections if col.get_paths() not in nones]

        # Add collections renderers
        [self.make_line_collection(col) for col in cols if isinstance(col, mpl.collections.LineCollection)]
        [self.make_poly_collection(col) for col in cols if isinstance(col, mpl.collections.PolyCollection)]

    def close_axes(self, ax):
        "Complete the axes adding axes-dependent plot props"
        background_fill = ax.get_axis_bgcolor()
        if background_fill == 'w':
            background_fill = 'white'
        self.plot.background_fill = background_fill
        if self.xkcd:
            self.plot.title_text_font = "Comic Sans MS, Textile, cursive"
            self.plot.title_text_font_style = "bold"
            self.plot.title_text_color = "black"

        # Add a "marker" Glyph to help the plot.renderers splitting in the GridPlot build
        dummy_source = ColumnDataSource(data=dict(name="ax_end"))
        self.plot.renderers.append(GlyphRenderer(data_source=dummy_source, glyph=X()))

    def open_legend(self, legend, props):
        pass

    def close_legend(self, legend):
        pass

    def draw_line(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Line glyph."
        _x = data[:, 0]
        if self.pd_obj is True:
            try:
                x = [pd.Period(ordinal=int(i), freq=self.ax.xaxis.freq).to_timestamp() for i in _x]
            except AttributeError as e: #  we probably can make this one more intelligent later
                x = _x
        else:
            x = _x

        y = data[:, 1]
        if self.xkcd:
            x, y = xkcd_line(x, y)

        line = Line()
        line.x = self.source.add(x)
        line.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(line.x))
        self.ydr.sources.append(self.source.columns(line.y))

        line.line_color = style['color']
        line.line_width = style['linewidth']
        line.line_alpha = style['alpha']
        line.line_dash = [int(i) for i in style['dasharray'].split(",")]  # str2list(int)
        #style['zorder'] # not in Bokeh
        #line.line_join = line2d.get_solid_joinstyle() # not in mplexporter
        #line.line_cap = cap_style_map[line2d.get_solid_capstyle()] # not in mplexporter
        if self.xkcd:
            line.line_width = 3

        self.plot.add_glyph(self.source, line)

    def draw_markers(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Marker glyph."
        x = data[:, 0]
        y = data[:, 1]

        marker_map = {
            "o": Circle,
            "s": Square,
            "+": Cross,
            "^": Triangle,
            "v": InvertedTriangle,
            "x": X,
            "D": Diamond,
            "*": Asterisk,
        }

        # Not all matplotlib markers are currently handled; fall back to Circle if we encounter an
        # unhandled marker.  See http://matplotlib.org/api/markers_api.html for a list of markers.
        try:
            marker = marker_map[style['marker']]()
        except KeyError:
            warnings.warn("Unable to handle marker: %s; defaulting to Circle" % style['marker'])
            marker = Circle()
        marker.x = self.source.add(x)
        marker.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(marker.x))
        self.ydr.sources.append(self.source.columns(marker.y))

        marker.line_color = style['edgecolor']
        marker.fill_color = style['facecolor']
        marker.line_width = style['edgewidth']
        marker.size = style['markersize']
        marker.fill_alpha = marker.line_alpha = style['alpha']
        #style['zorder'] # not in Bokeh

        self.plot.add_glyph(self.source, marker)

    def draw_path_collection(self, paths, path_coordinates, path_transforms,
                             offsets, offset_coordinates, offset_order,
                             styles, mplobj=None):
        """Path not implemented in Bokeh, but we have our own line ans poly
        collection implementations, so passing here to avoid the NonImplemented
        error.
        """
        pass

    def draw_text(self, text, position, coordinates, style,
                  text_type=None, mplobj=None):
        "Given a mpl text instance create a Bokeh Text glyph."
        # mpl give you the title and axes names as a text object (with specific locations)
        # inside the plot itself. That does not make sense inside Bokeh, so we
        # just skip the title and axes names from the conversion and covert any other text.
        if text not in self.non_text:
          x, y = position
          text = Text(x=x, y=y, text=[text])

          alignment_map = {"center": "middle", "top": "top", "bottom": "bottom", "baseline": "bottom"}
          # baseline not implemented in Bokeh, deafulting to bottom.
          text.text_alpha = style['alpha']
          text.text_font_size = "%dpx" % style['fontsize']
          text.text_color = style['color']
          text.text_align = style['halign']
          text.text_baseline = alignment_map[style['valign']]
          text.angle = style['rotation']
          #style['zorder'] # not in Bokeh

          ## Using get_fontname() works, but it's oftentimes not available in the browser,
          ## so it's better to just use the font family here.
          #text.text_font = mplText.get_fontname()) not in mplexporter
          #text.text_font = mplText.get_fontfamily()[0] # not in mplexporter
          #text.text_font_style = fontstyle_map[mplText.get_fontstyle()] # not in mplexporter
          ## we don't really have the full range of font weights, but at least handle bold
          #if mplText.get_weight() in ("bold", "heavy"):
              #text.text_font_style = bold

          self.plot.add_glyph(self.source, text)

    def draw_image(self, imdata, extent, coordinates, style, mplobj=None):
        pass

    def make_axis(self, ax, location, scale):
        "Given a mpl axes instance, returns a Bokeh LinearAxis object."
        # TODO:
        #  * handle log scaling
        #  * map `labelpad` to `major_label_standoff`
        #  * deal with minor ticks once BokehJS supports them
        #  * handle custom tick locations once that is added to bokehJS

        # we need to keep the current axes names to avoid writing them in draw_text
        self.non_text.append(ax.get_label_text())

        if scale == "linear":
            laxis = LinearAxis(axis_label=ax.get_label_text())
        elif scale == "date":
            laxis = DatetimeAxis(axis_label=ax.get_label_text())

        self.plot.add_layout(laxis, location)

        # First get the label properties by getting an mpl.Text object
        #label = ax.get_label()
        #self.text_props(label, laxis, prefix="axis_label_")
        #self.draw_text(label, position, coordinates, style, text_type="axis_label_")

        # To get the tick label format, we look at the first of the tick labels
        # and assume the rest are formatted similarly.
        #ticktext = ax.get_ticklabels()[0]
        #self.text_props(ticktext, laxis, prefix="major_label_")
        #self.draw_text(ticktext, position, coordinates, style, text_type="major_label_")

        #newaxis.bounds = axis.get_data_interval()  # I think this is the right func...

        if self.xkcd:
            laxis.axis_line_width = 3
            laxis.axis_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.axis_label_text_font_style = "bold"
            laxis.axis_label_text_color = "black"
            laxis.major_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.major_label_text_font_style = "bold"
            laxis.major_label_text_color = "black"

        return laxis

    def make_grid(self, baxis, dimension):
        "Given a mpl axes instance, returns a Bokeh Grid object."
        lgrid = Grid(dimension=dimension,
                     ticker=baxis.ticker,
                     grid_line_color=self.grid.get_color(),
                     grid_line_width=self.grid.get_linewidth())

        self.plot.add_layout(lgrid)

    def make_line_collection(self, col):
        "Given a mpl collection instance create a Bokeh MultiLine glyph."
        xydata = col.get_segments()
        t_xydata = [np.transpose(seg) for seg in xydata]
        xs = [t_xydata[x][0] for x in range(len(t_xydata))]
        ys = [t_xydata[x][1] for x in range(len(t_xydata))]
        if self.xkcd:
            xkcd_xs = [xkcd_line(xs[i], ys[i])[0] for i in range(len(xs))]
            xkcd_ys = [xkcd_line(xs[i], ys[i])[1] for i in range(len(ys))]
            xs = xkcd_xs
            ys = xkcd_ys

        multiline = MultiLine()
        multiline.xs = self.source.add(xs)
        multiline.ys = self.source.add(ys)
        self.xdr.sources.append(self.source.columns(multiline.xs))
        self.ydr.sources.append(self.source.columns(multiline.ys))

        self.multiline_props(multiline, col)

        self.plot.add_glyph(self.source, multiline)

    def make_poly_collection(self, col):
        "Given a mpl collection instance create a Bokeh Patches glyph."
        paths = col.get_paths()
        polygons = [paths[i].to_polygons() for i in range(len(paths))]
        polygons = [np.transpose(delete_last_col(polygon)) for polygon in polygons]
        xs = [polygons[i][0] for i in range(len(polygons))]
        ys = [polygons[i][1] for i in range(len(polygons))]

        patches = Patches()
        patches.xs = self.source.add(xs)
        patches.ys = self.source.add(ys)
        self.xdr.sources.append(self.source.columns(patches.xs))
        self.ydr.sources.append(self.source.columns(patches.ys))

        self.patches_props(patches, col)

        self.plot.add_glyph(self.source, patches)

    def multiline_props(self, multiline, col):
        "Takes a mpl collection object to extract and set up some Bokeh multiline properties."
        colors = get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
        widths = get_props_cycled(col, col.get_linewidth())
        multiline.line_color = self.source.add(colors)
        multiline.line_width = self.source.add(widths)
        multiline.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        multiline.line_dash_offset = convert_dashes(offset)
        multiline.line_dash = list(convert_dashes(tuple(on_off)))

    def patches_props(self, patches, col):
        "Takes a mpl collection object to extract and set up some Bokeh patches properties."
        face_colors = get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.fill_color = self.source.add(face_colors)
        edge_colors = get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.line_color = self.source.add(edge_colors)
        widths = get_props_cycled(col, col.get_linewidth())
        patches.line_width = self.source.add(widths)
        patches.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        patches.line_dash_offset = convert_dashes(offset)
        patches.line_dash = list(convert_dashes(tuple(on_off)))


def to_bokeh(fig=None, name=None, server=None, notebook=False, pd_obj=True, xkcd=False):
    """ Uses bokeh to display a Matplotlib Figure.

    You can store a bokeh plot in a standalone HTML file, as a document in
    a Bokeh plot server, or embedded directly into an IPython Notebook
    output cell.

    Parameters
    ----------

    fig: matplotlib.figure.Figure
        The figure to display. If None or not specified, then the current figure
        will be used.

    name: str (default=None)
        If this option is provided, then the Bokeh figure will be saved into
        this HTML file, and then a web browser will used to display it.

    server: str (default=None)
        Fully specified URL of bokeh plot server. Default bokeh plot server
        URL is "http://localhost:5006" or simply "deault"

    notebook: bool (default=False)
        Return an output value from this function which represents an HTML
        object that the IPython notebook can display. You can also use it with
        a bokeh plot server just specifying the URL.

    pd_obj: bool (default=True)
        The implementation asumes you are plotting using the pandas.
        You have the option to turn it off (False) to plot the datetime xaxis
        with other non-pandas interfaces.

    xkcd: bool (default=False)
        If this option is True, then the Bokeh figure will be saved with a
        xkcd style.
    """

    if fig is None:
        fig = plt.gcf()

    if any([name, server, notebook]):
        if name:
            if not server:
                filename = name + ".html"
                output_file(filename)
            else:
                output_server(name, url=server)
        elif server:
            if not notebook:
                output_server("unnameuuuuuuuuuuuuuud", url=server)
            else:
                output_notebook(url=server)
        elif notebook:
            output_notebook()
    else:
        output_file("Unnamed.html")

    doc = curdoc()

    renderer = BokehRenderer(pd_obj, xkcd)
    exporter = Exporter(renderer)

    exporter.run(fig)

    doc._current_plot = renderer.fig  # TODO (bev) do not rely on private attrs
    doc.add(renderer.fig)

    return renderer.fig
