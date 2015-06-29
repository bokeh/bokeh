from __future__ import absolute_import

from .models import glyphs, markers, BoxSelectTool

def _glyph_function(glyphclass, dsnames, argnames, docstring):

    def func(plot, *args, **kwargs):

        # Note: We want to reuse the glyph functions by attaching them the Plot
        # class. Imports are here to prevent circular imports.
        from .plotting_helpers import (
            _match_args, _pop_renderer_args, _pop_colors_and_alpha, _process_sequence_literals,
            _update_legend, _make_glyph)
        from .models import GlyphRenderer, Plot

        if not isinstance(plot, Plot):
            raise ValueError("expected plot object for first argument")

        # pop off glyph *function* parameters that are not glyph class properties
        legend_name = kwargs.pop("legend", None)
        renderer_kws = _pop_renderer_args(kwargs)
        source = renderer_kws['data_source']

        # pop off all color values for the glyph or nonselection glyphs
        glyph_ca = _pop_colors_and_alpha(glyphclass, kwargs)
        nsglyph_ca = _pop_colors_and_alpha(glyphclass, kwargs, prefix='nonselection_', default_alpha=0.1)

        # add the positional arguments as kwargs and make sure all required args are present
        _match_args(dsnames, glyphclass, source, args, kwargs)

        # if there are any hardcoded data sequences, move them to the data source and update
        _process_sequence_literals(glyphclass, kwargs, source)
        _process_sequence_literals(glyphclass, glyph_ca, source)
        _process_sequence_literals(glyphclass, nsglyph_ca, source)

        # create the default and nonselection glyphs
        glyph = _make_glyph(glyphclass, kwargs, glyph_ca)
        nsglyph = _make_glyph(glyphclass, kwargs, nsglyph_ca)

        glyph_renderer = GlyphRenderer(glyph=glyph, nonselection_glyph=nsglyph, **renderer_kws)

        if legend_name:
            _update_legend(plot, legend_name, glyph_renderer)

        for tool in plot.select(type=BoxSelectTool):
            tool.renderers.append(glyph_renderer)
            tool._dirty = True

        plot.renderers.append(glyph_renderer)
        plot._dirty = True
        return plot

    func.__name__ = glyphclass.__view_model__
    func.__doc__ = docstring
    return func

annular_wedge = _glyph_function(glyphs.AnnularWedge, ("x", "y", "inner_radius", "outer_radius", "start_angle", "end_angle"), ("direction",),
""" The `annular_wedge` glyph renders annular wedges centered at `x`, `y`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    inner_radius (str or list[float]) : values or field names of inner radii
    outer_radius (str or list[float]) : values or field names of outer radii
    start_angle (str or list[float]) : values or field names of starting angles
    end_angle (str or list[float]) : values or field names of ending angles
    direction ("clock" or "anticlock", optional): direction to turn between starting and ending angles, defaults to "anticlock"

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot
"""
)

annulus = _glyph_function(glyphs.Annulus, ("x", "y" ,"inner_radius", "outer_radius"), (),
""" The `annulus` glyph renders annuli centered at `x`, `y`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    inner_radius (str or list[float]) : values or field names of inner radii
    outer_radius (str or list[float]) : values or field names of outer radii

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.annulus(x=[1, 2, 3], y=[1, 2, 3], inner_radius=0.2,
                    outer_radius=0.5, color="#7FC97F"
                    )

        show(plot)
"""
)

arc = _glyph_function(glyphs.Arc, ("x", "y", "radius" ,"start_angle", "end_angle"), ("direction",),
""" The `arc` glyph renders circular arcs centered at `x`, `y`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    radius (str or list[float]) : values or field names of arc radii
    start_angle (str or list[float]) : values or field names of starting angles
    end_angle (str or list[float]) : values or field names of ending angles
    direction ("clock" or "anticlock", optional): direction to turn between starting and ending angles, defaults to "anticlock"

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot
"""
)

asterisk = _glyph_function(markers.Asterisk, ("x", "y"), (),
""" The `asterisk` glyph is a marker that renders asterisks at `x`, `y` with size `size`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.asterisk(x=[1,2,3], y=[1,2,3], size=20, color="#F0027F")

        show(plot)

"""
)

bezier = _glyph_function(glyphs.Bezier, ("x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"), (),
""" The bezier glyph displays Bezier curves with the given starting, ending, and control points.

Args:
    x0 (str or list[float]) : values or field names of starting `x` coordinates
    y0 (str or list[float]) : values or field names of starting `y` coordinates
    x1 (str or list[float]) : values or field names of ending `x` coordinates
    y1 (str or list[float]) : values or field names of ending `y` coordinates
    cx0 (str or list[float]) : values or field names of first control point `x` coordinates
    cy0 (str or list[float]) : values or field names of first control point `y` coordinates
    cx1 (str or list[float]) : values or field names of second control point `x` coordinates
    cy1 (str or list[float]) : values or field names of second control point `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot
""")

circle = _glyph_function(markers.Circle, ("x", "y"), (),
""" The `circle` glyph is a marker that renders circles at `x`, `y` with size `size`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float], optional) : values or field names of sizes in screen units
    radius (str  or list[float], optional): values or field names of radii

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Notes:
    Only one of `size` or `radius` should be provided. Note that `radius` defaults to data units.

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle(x=[1, 2, 3], y=[1, 2, 3], radius=0.1, size=20)

        show(plot)

"""
)

circle_cross = _glyph_function(markers.CircleCross, ("x", "y"), (),
""" The `circle_cross` glyph is a marker that renders circles together with a crossbar (+) at `x`, `y` with size `size` or `radius`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_cross(x=[1,2,3], y=[4,5,6], fill_alpha=0, line_width=2,
                         color="#FB8072", size=20)

        show(plot)
"""
)

circle_x = _glyph_function(markers.CircleX, ("x", "y"), (),
""" The `circle_x` glyph is a marker that renders circles together with a "X" glyph at `x`, `y` with size `size`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_x(x=[1, 2, 3], y=[1, 2, 3], radius=0.1, size=20,
                     fill_alpha=0, color="#DD1C77")

        show(plot)
"""
)

cross = _glyph_function(markers.Cross, ("x", "y"), (),
""" The `cross` glyph is a marker that renders crossbars (+) at `x`, `y` with size `size`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                    color="#E6550D", line_width=2)

        show(plot)
"""
)

diamond = _glyph_function(markers.Diamond, ("x", "y"), (),
""" The `diamond` glyph is a marker that renders diamonds at `x`, `y` with size `size` or `radius`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.diamond(x=[1, 2, 3], y=[1, 2, 3], size=20,
                    color="#1C9099", line_width=2)

        show(plot)
"""
)

diamond_cross = _glyph_function(markers.DiamondCross, ("x", "y"), (),
""" The `diamond_cross` glyph is a marker that renders diamonds together with a crossbar (+) at `x`, `y` with size `size` or `radius`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.diamond_cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                            color="#386CB0",fill_color=None, line_width=2)

        show(plot)


"""
)

image = _glyph_function(glyphs.Image, ("image", "x", "y", "dw", "dh"), ('palette', 'reserve_color', 'reserve_val', 'color_mapper', 'dilate'),
""" The image glyph takes each image as a two-dimensional array of scalar data.

A palette (string name of a built-in palette, currently) must also be supplied to use for color-mapping the scalar image.

Args:
    image (str or 2D array_like of float) : value or field names of scalar image data
    x (str or list[float]) : values or field names of lower left `x` coordinates
    y (str or list[float]) : values or field names of lower left `y` coordinates
    dw (str or list[float]) : values or field names of image width distances
    dh (str or list[float]) : values or field names of image height distances
    palette (str or list[str]) : values or field names of palettes to use for color-mapping (see :ref:`bokeh_dot_palettes` for more details)
    colorMapper (LinearColorMapper) : a LinearColorMapper instance
    dilate (bool, optional) : whether to dilate pixel distance computations when drawing, defaults to False

Returns:
    plot

Notes:
    setting `dilate` to True will cause pixel distances (e.g., for `dw` and `dh`) to
    be rounded up, always.
"""
)

image_rgba = _glyph_function(glyphs.ImageRGBA, ("image", "x", "y", "dw", "dh"), ("dilate",),
""" The image_rgba glyph takes each ``image`` as a two-dimensional array of RGBA values (encoded
as 32-bit integers).

Args:
    image (str or 2D array_like of uint32) : value or field names of RGBA image data
    x (str or list[float]) : values or field names of lower left `x` coordinates
    y (str or list[float]) : values or field names of lower left `y` coordinates
    dw (str or list[float]) : values or field names of image width distances
    dh (str or list[float]) : values or field names of image height distances
    dilate (bool, optional) : whether to dilate pixel distance computations when drawing, defaults to False

Returns:
    plot

Notes:
    setting `dilate` to True will cause pixel distances (e.g., for `dw` and `dh`) to
    be rounded up, always.
"""
)

image_url = _glyph_function(glyphs.ImageURL, ("url", "x", "y"), (),
"""The image_url glyph takes a urls for images to display.

Args:
    url (str) : value of RGBA image data
    x (str or list[float]) : values or field names of upper left `x` coordinates
    y (str or list[float]) : values or field names of upper left `y` coordinates
    angle (float) : angle to rotate image by

Returns:
    plot
"""
)

inverted_triangle = _glyph_function(markers.InvertedTriangle, ("x", "y"), (),
""" The `inverted_triangle` glyph is a marker that renders upside-down triangles at `x`, `y` with size `size` or `radius`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot


Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.inverted_triangle(x=[1, 2, 3], y=[1, 2, 3], size=20,
                              color="#DE2D26")

        show(plot)
"""
)

line = _glyph_function(glyphs.Line, ("x", "y"), (),
""" The line glyph displays a single line that connects several points given by the arrays of coordinates `x` and `y`.

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Args:
    x (str or list[float]) : values or field names of line `x` coordinates
    y (str or list[float]) : values or field names of line `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(title="line", plot_width=300, plot_height=300)
       p.line(x=[1, 2, 3, 4, 5], y=[6, 7, 2, 4, 5])

       show(p)
"""
)

multi_line = _glyph_function(glyphs.MultiLine, ("xs", "ys"), (),
""" The multi_line glyph displays lines, each with points given by the arrays of coordinates that are the elements of xs and ys.

Args:
    xs (str or list[list[float]]): values or field names of lines `x` coordinates
    ys (str or list[list[float]]): values or field names of lines `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

.. note:: For this glyph, the data is not simply an array of scalars, it is really an "array of arrays".

Returns:
    plot

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.multi_line(xs=[[1, 2, 3], [2, 3, 4]], ys=[[6, 7, 2], [4, 5, 7]],
                    color=['red','green'])

       show(p)
""")

oval = _glyph_function(glyphs.Oval, ("x", "y", "width", "height"), (),
""" The oval glyph displays ovals centered on the given coordinates with the given dimensions and angle.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    width (str or list[float]) : values or field names of widths
    height (str or list[float]) : values or field names of heights
    angle (str or list[float], optional) : values or field names of rotation angles, defaults to 0

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.oval(x=[1, 2, 3], y=[1, 2, 3], width=15, height=25, angle=-0.7, color="#1D91C0",
                 width_units="screen", height_units="screen")

        show(plot)
"""
)

patch = _glyph_function(glyphs.Patch, ("x", "y"), (),
""" The patch glyph displays a single polygonal patch that connects several points given by the arrays of coordinates `x` and `y`.

Args:
    x (str or list[float]) : values or field names of patch `x` coordinates
    y (str or list[float]) : values or field names of patch `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.patch(x=[1, 2, 3, 2], y=[6, 7, 2, 2], color="#99d8c9")

       show(p)
"""
)

patches = _glyph_function(glyphs.Patches, ("xs", "ys"), (),
""" The patches glyph displays several patches, each with points given by the arrays of coordinates that are the elements of xs and ys.

Args:
    xs (str or list[list[float]]): values or field names of patches `x` coordinates
    ys (str or list[list[float]]): values or field names of patches `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

.. note:: For this glyph, the data is not simply an array of scalars, it is really an "array of arrays".

Returns:
    plot

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.patches(xs=[[1,2,3],[4,5,6,5]], ys=[[1,2,1],[4,5,5,4]],
                color=["#43a2ca", "#a8ddb5"])

       show(p)
""")

quad = _glyph_function(glyphs.Quad, ("left", "right", "top", "bottom"), (),
""" The quad glyph displays axis-aligned rectangles with the given dimensions.

Args:
    left (str or list[float]) : values or field names of left edges
    right (str or list[float]) : values or field names of right edges
    top (str or list[float]) : values or field names of top edges
    bottom (str or list[float]) : values or field names of bottom edges

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
            right=[1.2, 2.5, 3.7], color="#B3DE69")

        show(plot)
""")

quadratic = _glyph_function(glyphs.Quadratic, ("x0", "y0", "x1", "y1", "cx", "cy"), (),
""" The quadratic glyph displays quadratic curves with the given starting, ending, and control points.

Args:
    x0 (str or list[float]) : values or field names of starting `x` coordinates
    y0 (str or list[float]) : values or field names of starting `y` coordinates
    x1 (str or list[float]) : values or field names of ending `x` coordinates
    y1 (str or list[float]) : values or field names of ending `y` coordinates
    cx (str or list[float]) : values or field names of control point `x` coordinates
    cy (str or list[float]) : values or field names of control point `y` coordinates

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot
""")

ray = _glyph_function(glyphs.Ray, ("x", "y", "length", "angle"), (),
""" The ray glyph displays line segments starting at the given coordinate and extending the given length at the given angle.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    length (str or list[float]) : values or field names of ray lengths in screen units
    angle (str or list[float]) : values or field names of ray angles

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=-0.7, color="#FB8072",
                 line_width=2)

        show(plot)
"""
)

rect = _glyph_function(glyphs.Rect, ("x", "y", "width", "height"), ("dilate",),
""" The rect glyph displays rectangles centered on the given coordinates with the given dimensions and angle.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    width (str or list[float]) : values or field names of widths
    height (str or list[float]) : values or field names of heights
    angle (str or list[float], optional) : values or field names of rotation angles, defaults to 0
    dilate (bool, optional) : whether to dilate pixel distance computations when drawing, defaults to False

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Returns:
    plot

Notes:
    setting `dilate` to True will cause pixel distances (e.g., for `width` and `height`) to
    be rounded up, always.


Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.rect(x=[1, 2, 3], y=[1, 2, 3], width=10, height=20, color="#CAB2D6",
            width_units="screen", height_units="screen")

        show(plot)
"""
)

segment = _glyph_function(glyphs.Segment, ("x0", "y0", "x1", "y1"), (),
""" The segment glyph displays line segments with the given starting and ending coordinates.

Args:
    x0 (str or list[float]) : values or field names of starting `x` coordinates
    y0 (str or list[float]) : values or field names of starting `y` coordinates
    x1 (str or list[float]) : values or field names of ending `x` coordinates
    y1 (str or list[float]) : values or field names of ending `y` coordinates

In addition the the parameters specific to this glyph, :ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.segment(x0=[1, 2, 3], y0=[1, 2, 3], x1=[1, 2, 3],
                    y1=[1.2, 2.5, 3.7], color="#F4A582",
                    line_width=3)

        show(plot)

""")

square = _glyph_function(markers.Square, ("x", "y"), (),
""" The `square` glyph is a marker that renders squares at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)
"""
)

square_cross = _glyph_function(markers.SquareCross, ("x", "y"), (),
""" The `square_cross` glyph is a marker that renders squares together with a crossbar (+) at `x`, `y` with size `size`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

In addition the the parameters specific to this glyph, :ref:`userguide_styling_line_properties` and
:ref:`userguide_styling_fill_properties` are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_cross(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                         color="#7FC97F",fill_color=None, line_width=2)

        show(plot)
"""
)

square_x = _glyph_function(markers.SquareX, ("x", "y"), (),
""" The `square_x` glyph is a marker that renders squares together with "X" glyphs at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph, :ref:`userguide_styling_line_properties` and
:ref:`userguide_styling_fill_properties` are also accepted as keyword parameters.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_x(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                     color="#FDAE6B",fill_color=None, line_width=2)

        show(plot)
"""
)

text = _glyph_function(glyphs.Text, ("x", "y", "text"), (),
""" The text glyph displays text at the given coordinates rotated by the given angle.

Args:
    x (str or list[float]) : values or field names of text `x` coordinates
    y (str or list[float]) : values or field names of text `y` coordinates
    text (str or list[text]): values or field names of texts
    angle (str or list[float], optional) : values or field names of text angles, defaults to 0

In addition the the parameters specific to this glyph, :ref:`userguide_styling_text_properties`
are also accepted as keyword parameters.

.. note:: The location and angle of the text relative to the `x`, `y` coordinates is indicated by the alignment and baseline text properties.

Returns:
    plot

"""
)

triangle = _glyph_function(markers.Triangle, ("x", "y"), (),
""" The `triangle` glyph is a marker that renders triangles at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`
are also accepted as keyword parameters.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.triangle(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                     color="#99D594", line_width=2)

        show(plot)
"""
)

wedge = _glyph_function(glyphs.Wedge, ("x", "y", "radius", "start_angle", "end_angle"), ("direction",),
""" The `wedge` glyph renders circular wedges centered at `x`, `y`.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    radius (str or list[float]) : values or field names of wedge radii
    start_angle (str or list[float]) : values or field names of starting angles
    end_angle (str or list[float]) : values or field names of ending angles
    direction ("clock" or "anticlock", optional): direction to turn between starting and ending angles, defaults to "anticlock"

In addition the the parameters specific to this glyph, :ref:`userguide_styling_line_properties` and
:ref:`userguide_styling_fill_properties` are also accepted as keyword parameters.

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=15, start_angle=0.6,
                     end_angle=4.1, radius_units="screen", color="#2b8cbe")

        show(plot)
"""
)

x = _glyph_function(markers.X, ("x", "y"), (),
""" The `x` glyph is a marker that renders "x" glyphs at `x`, `y` with size `size`.

In addition the the parameters specific to this glyph,
:ref:`userguide_styling_line_properties`
are also accepted as keyword parameters.

Args:
    x (str or list[float]) : values or field names of center `x` coordinates
    y (str or list[float]) : values or field names of center `y` coordinates
    size (str or list[float]) : values or field names of sizes in screen units

Returns:
    plot

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.x(x=[1, 2, 3], y=[1, 2, 3], size=[10, 20, 25], color="#fa9fb5")

        show(plot)
"""
)
