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

import warnings

import matplotlib as mpl
import numpy as np
from six import string_types

from ...layouts import gridplot
from ...models import (ColumnDataSource, FactorRange, DataRange1d, DatetimeAxis, GlyphRenderer,
                     Grid, LinearAxis, Plot, CategoricalAxis, Legend, LegendItem)
from ...models.glyphs import (Asterisk, Circle, Cross, Diamond, InvertedTriangle,
                            Line, MultiLine, Patches, Square, Text, Triangle, X)
from ...plotting import DEFAULT_TOOLS
from ...plotting.helpers import _process_tools_arg
from ...util.dependencies import import_optional

from ..properties import value

from .mplexporter.renderers import Renderer
from .mpl_helpers import convert_color, convert_dashes, get_props_cycled, xkcd_line

pd = import_optional('pandas')

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class BokehRenderer(Renderer):

    def __init__(self, tools, use_pd, xkcd):
        "Initial setup."
        self.fig = None
        self.use_pd = use_pd
        self.tools = tools
        self.xkcd = xkcd
        self.zorder = {}
        self.handles = {}

    def open_figure(self, fig, props):
        "Get the main plot properties and create the plot."
        self.width = int(props['figwidth'] * props['dpi'])
        self.height = int(props['figheight'] * props['dpi'])
        self.plot = Plot(x_range=DataRange1d(),
                         y_range=DataRange1d(),
                         plot_width=self.width,
                         plot_height=self.height)

    def close_figure(self, fig):
        "Complete the plot: add tools."
        # Add tools
        tool_objs, tools_map = _process_tools_arg(self.plot, self.tools)
        self.plot.add_tools(*tool_objs)

        # Simple or Grid plot setup
        if len(fig.axes) <= 1:
            self.fig = self.plot
            self.plot.renderers.sort(key=lambda x: self.zorder.get(x._id, 0))
        else:
            # This list comprehension splits the plot.renderers list at the "marker"
            # points returning small sublists corresponding with each subplot.
            subrends = []
            for i in range(1, len(self._axes)):
                start, end = self._axes[i-1], self._axes[i]
                subrends += [self.plot.renderers[start:end]]

            plots = []
            for i, axes in enumerate(fig.axes):
                # create a new plot for each subplot
                _plot = Plot(x_range=self.plot.x_range,
                             y_range=self.plot.y_range,
                             plot_width=self.width,
                             plot_height=self.height)

                _plot.title.text = ''
                # and add new tools
                _tool_objs, _tool_map = _process_tools_arg(_plot, DEFAULT_TOOLS)
                _plot.add_tools(*_tool_objs)
                # clean the plot ref from axis and grids
                _plot_rends = subrends[i]
                for r in _plot_rends:
                    if not isinstance(r, GlyphRenderer):
                        r.plot = None
                # add all the renderers into the new subplot
                for r in _plot_rends:
                    if isinstance(r, GlyphRenderer):
                        _plot.renderers.append(r)
                    elif isinstance(r, Grid):
                        _plot.add_layout(r)
                    else:
                        if r in self.plot.below:
                            _plot.add_layout(r, 'below')
                        elif r in self.plot.above:
                            _plot.add_layout(r, 'above')
                        elif r in self.plot.left:
                            _plot.add_layout(r, 'left')
                        elif r in self.plot.right:
                            _plot.add_layout(r, 'right')

                _plot.renderers.sort(key=lambda x: self.zorder.get(x._id, 0))
                plots.append(_plot)
            (a, b, c) = fig.axes[0].get_geometry()
            p = np.array(plots)
            n = np.resize(p, (a, b))
            grid = gridplot(n.tolist())
            self.fig = grid

    def open_axes(self, ax, props):
        "Get axes data and create the axes and grids"
        # Get axes, title and grid into class attributes.
        self.ax = ax
        self.plot.title.text = ax.get_title()
        # to avoid title conversion by draw_text later

        #Make sure that all information about the axes are passed to the properties
        if props.get('xscale', False):
            props['axes'][0]['scale'] = props['xscale']

        if props.get('yscale', False):
            props['axes'][1]['scale'] = props['yscale']

        # Add axis
        for props in props['axes']:
            if   props['position'] == "bottom" : location, dim, thing = "below", 0, ax.xaxis
            elif props['position'] == "top"    : location, dim, thing = "above", 0, ax.xaxis
            else: location, dim, thing = props['position'], 1, ax.yaxis

            baxis = self.make_axis(thing, location, props)

            if dim==0:
                gridlines = ax.get_xgridlines()
            else:
                gridlines = ax.get_ygridlines()

            if gridlines:
                self.make_grid(baxis, dim, gridlines[0])

    def close_axes(self, ax):
        "Complete the axes adding axes-dependent plot props"
        if hasattr(ax, 'get_facecolor'):
            background_fill_color = convert_color(ax.get_facecolor())
        else:
            background_fill_color = convert_color(ax.get_axis_bgcolor())
        self.plot.background_fill_color = background_fill_color
        if self.xkcd:
            self.plot.title.text_font = "Comic Sans MS, Textile, cursive"
            self.plot.title.text_font_style = "bold"
            self.plot.title.text_color = "black"

        # Add a "marker" Glyph to help the plot.renderers splitting in the GridPlot build
        self._axes = getattr(self, "_axes", [0])
        self._axes.append(len(self.plot.renderers))

    def open_legend(self, legend, props):
        lgnd = Legend(location="top_right")
        try:
            for label, obj in zip(props['labels'], props['handles']):
                lgnd.items.append(LegendItem(label=value(label), renderers=[self.handles[id(obj)]]))
            self.plot.add_layout(lgnd)
        except KeyError:
            pass

    def close_legend(self, legend):
        pass

    def draw_line(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Line glyph."
        _x = data[:, 0]
        if pd and self.use_pd:
            try:
                x = [pd.Period(ordinal=int(i), freq=self.ax.xaxis.freq).to_timestamp() for i in _x]
            except AttributeError: #  we probably can make this one more intelligent later
                x = _x
        else:
            x = _x

        y = data[:, 1]
        if self.xkcd:
            x, y = xkcd_line(x, y)

        line = Line()
        source = ColumnDataSource()
        line.x = source.add(x)
        line.y = source.add(y)
        line.line_color = convert_color(style['color'])
        line.line_width = style['linewidth']
        line.line_alpha = style['alpha']
        line.line_dash = [] if style['dasharray'] is "none" else [int(i) for i in style['dasharray'].split(",")]  # str2list(int)
        # line.line_join = line2d.get_solid_joinstyle() # not in mplexporter
        # line.line_cap = cap_style_map[line2d.get_solid_capstyle()] # not in mplexporter
        if self.xkcd:
            line.line_width = 3

        r = self.plot.add_glyph(source, line)
        self.zorder[r._id] = style['zorder']
        self.handles[id(mplobj)] = r

    def draw_markers(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Marker glyph."
        x = data[:, 0]
        y = data[:, 1]

        marker_map = {
            ".": Circle,
            "o": Circle,
            "s": Square,
            "+": Cross,
            "^": Triangle,
            "v": InvertedTriangle,
            "x": X,
            "d": Diamond,
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
        source = ColumnDataSource()
        marker.x = source.add(x)
        marker.y = source.add(y)

        marker.line_color = convert_color(style['edgecolor'])
        marker.fill_color = convert_color(style['facecolor'])
        marker.line_width = style['edgewidth']
        marker.size = style['markersize']
        marker.fill_alpha = marker.line_alpha = style['alpha']

        r = self.plot.add_glyph(source, marker)
        self.zorder[r._id] = style['zorder']
        self.handles[id(mplobj)] = r

    def draw_path(self, data, coordinates, pathcodes, style,
                  offset=None, offset_coordinates="data", mplobj=None):
        warnings.warn("Path drawing has performance issues, please use mpl PathCollection instead")
        pass

    def draw_path_collection(self, paths, path_coordinates, path_transforms,
                             offsets, offset_coordinates, offset_order,
                             styles, mplobj=None):
        "Given a mpl PathCollection instance create a Bokeh Marker glyph."
        x = offsets[:, 0]
        y = offsets[:, 1]
        style = styles

        warnings.warn("Path marker shapes currently not handled, defaulting to Circle")
        marker = Circle()
        source = ColumnDataSource()
        marker.x = source.add(x)
        marker.y = source.add(y)

        if len(style['facecolor']) > 1:
            fill_color = []
            for color in style['facecolor']:
                # Apparently there is an issue with ColumnDataSources and rgb/a tuples, converting to hex
                fill_color.append('#%02x%02x%02x' % convert_color(tuple(map(tuple,[color]))[0]))
            marker.fill_color = source.add(fill_color)
        else:
            marker.fill_color = convert_color(tuple(map(tuple,style['facecolor']))[0])

        if len(style['edgecolor']) > 1:
            edge_color = []
            for color in style['edgecolor']:
                # Apparently there is an issue with ColumnDataSources, line_color, and rgb/a tuples, converting to hex
                edge_color.append('#%02x%02x%02x' % convert_color(tuple(map(tuple,[color]))[0]))
            marker.line_color = source.add(edge_color)
        else:
            marker.line_color = convert_color(tuple(map(tuple,style['edgecolor']))[0])

        if len(style['linewidth']) > 1:
            line_width = []
            for width in style['linewidth']:
                line_width.append(width)
            marker.line_width = source.add(line_width)
        else:
            marker.line_width = style['linewidth'][0]

        if len(mplobj.get_axes().collections) > 1:
            warnings.warn("Path marker sizes support is limited and may not display as expected")
            marker.size = mplobj.get_sizes()[0]/mplobj.get_axes().collections[-1].get_sizes()[0]*20
        else:
            marker.size = 5
        marker.fill_alpha = marker.line_alpha = style['alpha']

        r = self.plot.add_glyph(source, marker)
        self.zorder[r._id] = style['zorder']
        self.handles[id(mplobj)] = r

    def draw_text(self, text, position, coordinates, style,
                  text_type=None, mplobj=None):
        "Given a mpl text instance create a Bokeh Text glyph."
        # mpl give you the title and axes names as a text object (with specific locations)
        # inside the plot itself. That does not make sense inside Bokeh, so we
        # just skip the title and axes names from the conversion and covert any other text.
        if text_type in ['xlabel', 'ylabel', 'title']:
            return

        if coordinates != 'data':
            return

        x, y = position
        text = Text(x=x, y=y, text=[text])

        alignment_map = {"center": "middle", "top": "top", "bottom": "bottom", "baseline": "bottom"}
        # baseline not implemented in Bokeh, defaulting to bottom.
        text.text_alpha = style['alpha']
        text.text_font_size = "%dpx" % style['fontsize']
        text.text_color = convert_color(style['color'])
        text.text_align = style['halign']
        text.text_baseline = alignment_map[style['valign']]
        text.angle = style['rotation']

        ## Using get_fontname() works, but it's oftentimes not available in the browser,
        ## so it's better to just use the font family here.
        #text.text_font = mplText.get_fontname()) not in mplexporter
        #text.text_font = mplText.get_fontfamily()[0] # not in mplexporter
        #text.text_font_style = fontstyle_map[mplText.get_fontstyle()] # not in mplexporter
        ## we don't really have the full range of font weights, but at least handle bold
        #if mplText.get_weight() in ("bold", "heavy"):
            #text.text_font_style = bold

        source = ColumnDataSource()
        r = self.plot.add_glyph(source, text)
        self.zorder[r._id] = style['zorder']
        self.handles[id(mplobj)] = r

    def draw_image(self, imdata, extent, coordinates, style, mplobj=None):
        pass

    def make_axis(self, ax, location, props):
        "Given a mpl axes instance, returns a Bokeh LinearAxis object."
        # TODO:
        #  * handle log scaling
        #  * map `labelpad` to `major_label_standoff`
        #  * deal with minor ticks once BokehJS supports them
        #  * handle custom tick locations once that is added to bokehJS
        tf = props['tickformat']
        tv = props['tickvalues']
        if tf and any(isinstance(x, string_types) for x in tf):
            laxis = CategoricalAxis(axis_label=ax.get_label_text())
            assert np.min(tv) >= 0, "Assuming categorical axis have positive-integer dump tick values"
            # Seaborn position its categories on dump tick values indented to zero;
            # Matplotlib does from 1. We need then different offset given the assumed identation.
            offset = np.min(tv) - 1
            rng = FactorRange(factors=[str(x) for x in tf], offset=offset)
            if location in ["above", "below"]:
                self.plot.x_range = rng
            else:
                self.plot.y_range = rng

        else:
            if props['scale'] == "linear":
                laxis = LinearAxis(axis_label=ax.get_label_text())
            elif props['scale'] == "date":
                laxis = DatetimeAxis(axis_label=ax.get_label_text())

        self.plot.add_layout(laxis, location)

        # First get the label properties by getting an mpl.Text object
        label = ax.get_label()
        self.text_props(label, laxis, prefix="axis_label_")


        # Set the tick properties (for now just turn off if necessary)
        #  TODO: mirror tick properties
        if props['nticks'] == 0:
            laxis.major_tick_line_color = None
            laxis.minor_tick_line_color = None
            laxis.major_label_text_color = None

        # To get the tick label format, we look at the first of the tick labels
        # and assume the rest are formatted similarly.
        ticklabels = ax.get_ticklabels()
        if ticklabels:
            self.text_props(ticklabels[0], laxis, prefix="major_label_")

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

    def make_grid(self, baxis, dimension, gridline):
        "Given a mpl axes instance, returns a Bokeh Grid object."
        lgrid = Grid(dimension=dimension,
                     ticker=baxis.ticker,
                     grid_line_color=convert_color(gridline.get_color()),
                     grid_line_width=gridline.get_linewidth())
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
        source = ColumnDataSource()
        multiline.xs = source.add(xs)
        multiline.ys = source.add(ys)

        self.multiline_props(source, multiline, col)

        r = self.plot.add_glyph(source, multiline)
        self.zorder[r._id] = col.zorder
        self.handles[id(col)] = r

    def make_poly_collection(self, col):
        "Given a mpl collection instance create a Bokeh Patches glyph."

        xs = []
        ys = []
        for path in col.get_paths():
            for sub_poly in path.to_polygons():
                xx, yy = sub_poly.transpose()
                xs.append(xx)
                ys.append(yy)

        patches = Patches()
        source = ColumnDataSource()
        patches.xs = source.add(xs)
        patches.ys = source.add(ys)

        self.patches_props(source, patches, col)

        r = self.plot.add_glyph(source, patches)
        self.zorder[r._id] = col.zorder
        self.handles[id(col)] = r

    def multiline_props(self, source, multiline, col):
        "Takes a mpl collection object to extract and set up some Bokeh multiline properties."
        colors = get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
        colors = [convert_color(x) for x in colors]
        widths = get_props_cycled(col, col.get_linewidth())
        multiline.line_color = source.add(colors)
        multiline.line_width = source.add(widths)
        if col.get_alpha() is not None:
            multiline.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        multiline.line_dash_offset = convert_dashes(offset)
        multiline.line_dash = list(convert_dashes(tuple(on_off)))

    def patches_props(self, source, patches, col):
        "Takes a mpl collection object to extract and set up some Bokeh patches properties."
        face_colors = get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        face_colors = [convert_color(x) for x in face_colors]
        patches.fill_color = source.add(face_colors)
        edge_colors = get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        edge_colors = [convert_color(x) for x in edge_colors]
        patches.line_color = source.add(edge_colors)
        widths = get_props_cycled(col, col.get_linewidth())
        patches.line_width = source.add(widths)
        if col.get_alpha() is not None:
            patches.line_alpha = col.get_alpha()
            patches.fill_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        patches.line_dash_offset = convert_dashes(offset)
        patches.line_dash = list(convert_dashes(tuple(on_off)))

    def text_props(self, text, obj, prefix=""):
        fp = text.get_font_properties()
        setattr(obj, prefix+"text_font", fp.get_family()[0])
        setattr(obj, prefix+"text_font_size", "%fpt" % fp.get_size_in_points())
        setattr(obj, prefix+"text_font_style", fp.get_style())
