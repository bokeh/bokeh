.. _userguide_styling:

Styling Visual Attributes
=========================

.. contents::
    :local:
    :depth: 2

.. _userguide_styling_using_palettes:

Using Palettes
--------------

Palettes are sequences (lists or tuples) of RGB(A) hex strings that define a
colormap and be can set as the ``palette`` attribute of all chart types from
``bokeh.charts`` and as the ``color`` attribute of many plot objects from
``bokeh.plotting``. Bokeh offers many of the standard Brewer palettes, which
can be imported from the ``bokeh.palettes`` module. For example, importing
“Spectral6” gives a six element list of RBG(A) hex strings from the Brewer
“Spectral” colormap.

.. code-block:: python

    >>> from bokeh.palettes import Spectral6
    >>> Spectral6
    ['#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']

All of the standard palettes included in bokeh can be found at
:ref:`bokeh_dot_palettes`. Custom palettes can be made by creating sequences of
RGB(A) hex strings.

.. _userguide_styling_visual_properties:

Visual Properties
-----------------

In order to style the visual attributes of Bokeh plots, you first must
know what the available properties are. The full :ref:`refguide` will
list all the properties of every object individually, though there are three
broad groups of properties that show up often. They are:

* **line properties** line color, width, etc.
* **fill properties** fill color, alpha, etc.
* **text properties** font styles, colors, etc.

Below is more detail about each of these.

.. _userguide_styling_line_properties:

Line Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/line_props.txt

.. _userguide_styling_fill_properties:

Fill Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/fill_props.txt

.. _userguide_styling_text_properties:

Text Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/text_props.txt

.. _userguide_styling_colors:

Specifying Colors
~~~~~~~~~~~~~~~~~

Colors properties are used in many places in Bokeh, to specify the colors to
use for lines, fills or text. Color values can be provided in any of the
following ways:

.. include:: ../includes/colors.txt

Color alpha can be specified in multiple ways for the visual properties. This
can be by specifying the alpha directly with ``line|fill_alpha``, or by
providing the alpha through the RGBA 4-tuple for the ``line|fill_color``.

Additionally, there is also the freedom to use a combination of the two, or no
alpha at all. The following figure demonstrates each possible combination of
the inputs for line and fill alphas:

.. bokeh-plot::
    :source-position: none

    from bokeh.plotting import figure, show, output_file
    from itertools import product
    from math import pi
    output_file('properties_alpha.html')

    cats = ['None', 'Alpha', 'RGB', 'RGBA', 'Alpha+RGB', 'Alpha+RGBA']
    p = figure(x_range=cats, y_range=cats,
               title="Fill and Line Color Property Combinations")

    alpha = 0.5
    fill_color = (242, 44, 64)
    fill_color_alpha = (242, 44, 64, alpha)
    line_color = (0, 0, 0)
    line_color_alpha = (0, 0, 0, alpha)

    # define fill and line color combinations
    fill = [(1, {}),
            (2, {'fill_alpha': alpha}),
            (3, {'fill_color': fill_color}),
            (4, {'fill_color': fill_color_alpha}),
            (5, {'fill_alpha': alpha, 'fill_color': fill_color}),
            (6, {'fill_alpha': alpha, 'fill_color': fill_color_alpha})]

    line = [(1, {}),
            (2, {'line_alpha': alpha}),
            (3, {'line_color': line_color}),
            (4, {'line_color': line_color_alpha}),
            (5, {'line_alpha': alpha, 'line_color': line_color}),
            (6, {'line_alpha': alpha, 'line_color': line_color_alpha})]

    # plot intersection of fill and line combinations
    combinations = product(fill, line)
    for comb in combinations:
        x, fill_options = comb[0]
        y, line_options = comb[1]

        options = fill_options.copy()
        options.update(line_options)

        p.circle(x, y, line_width=7, size=50, **options)

    p.xaxis[0].axis_label = "Fill Options"
    p.xaxis[0].major_label_orientation = pi/4
    p.yaxis[0].axis_label = "Line Options"
    show(p)

.. note::
    If using the |bokeh.plotting| interface, another option is to specify
    ``color`` and/or ``alpha`` as a keyword, as well as the demonstrated color
    properties. These inputs work by applying the provided value to both of the
    corresponding ``line`` and ``fill`` properties. However, you can still
    provide ``fill|line_alpha`` or ``fill|line_color`` in combination with
    the ``color``/``alpha`` keywords, and the former will take precedence.

.. _userguide_styling_selecting:

Selecting Plot Objects
----------------------

As described in :ref:`userguide_concepts`, Bokeh plots comprise graphs of
objects that represent all the different parts of the plot: grids, axes,
glyphs, etc. In order to style Bokeh plots, it is necessary to first find
the right object, then set its various attributes. Some objects have
convenience methods to help find the objects of interest (see `Axes`_,
`Grids`_, and `Legends`_). But there is also a |select| method on |Plot|
that can be used to query for Bokeh plot objects more generally.

For example, you can query for objects by type. The following snippet
returns all the `PanTool` objects a plot has:

.. code-block:: python

    >>> p.select(type=PanTool)
    [<bokeh.models.tools.PanTool at 0x106608b90>]

The |select| method can query on other attributes as well:

.. code-block:: python

    >>> p.circle(0, 0, name="mycircle")
    <bokeh.plotting.Figure at 0x106608810>

    >>> p.select(name="mycircle")
    [<bokeh.models.renderers.GlyphRenderer at 0x106a4c810>]

This sort of query can be especially useful for styling visual attributes
of `Glyphs`_.

.. _userguide_styling_plots:

Plots
-----

|Plot| objects themselves have many visual characteristics that can be styled:
the dimensions of the plot, backgrounds, borders, outlines, etc. This section
describes how to change these attributes of a Bokeh plot. The example code
primarily uses the |bokeh.plotting| interface to create plots, however the
instructions apply regardless of how a Bokeh plot was created.

.. _userguide_styling_plot_dimensions:

Dimensions
~~~~~~~~~~

The dimensions (width and height) of a |Plot| are controlled by ``plot_width``
and ``plot_height`` attributes. These values are in screen units, and they
control the size of the entire canvas area, including any axes or titles (but
not the toolbar). If you are using the |bokeh.plotting| or |bokeh.charts|
interfaces, then these values can be passed to |figure| or the Chart function
as a convenience:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("dimensions.html")

    # create a new plot with a title
    p = figure(plot_width=700)
    p.plot_height=300

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_title:

Title
~~~~~

The styling of the plot title is controlled by a set of `Text Properties`_
on the |Plot|, that are prefixed with ``title_``. For instance, to set the
color of the title text, use ``title_text_color``:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("title.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400, title="Some Title")
    p.title_text_color = "olive"
    p.title_text_font = "times"
    p.title_text_font_style = "italic"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_background:

Background
~~~~~~~~~~

The background fill color is controlled by the ``background_fill`` property
of the |Plot| object:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("background.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.background_fill = "beige"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_border:

Border
~~~~~~

The border fill color is controlled by the ``border_fill`` property
of the |Plot| object. You can also set the minimum border on each side
(in screen units) with the properties

``min_border_left``

``min_border_right``

``min_border_top``

``min_border_bottom``

Additionally, setting ``min_border`` will apply a minimum border setting
to all sides as a convenience. The ``min_border`` default value is 40px.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("border.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.border_fill = "whitesmoke"
    p.min_border_left = 80

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_outline:

Outline
~~~~~~~

The styling of the outline of the plotting area is controlled by a set of
`Line Properties`_ on the |Plot|, that are prefixed with ``outline_``. For
instance, to set the color of the outline, use ``outline_line_color``:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("outline.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.outline_line_width = 7
    p.outline_line_alpha = 0.3
    p.outline_line_color = "navy"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_glyphs:

Glyphs
------

As seen in :ref:`userguide_styling_selecting`, the |select| method can be
used to retrieve ``GlyphRenderer`` objects from a plot:

.. code-block:: python

    >>> p.select(name="mycircle")
    [<bokeh.models.renderers.GlyphRenderer at 0x106a4c810>]

To style the fill, line, or text properties of a glyph, it is first
necessary to obtain a specific ``GlyphRenderer`` from the returned
list:

.. code-block:: python

    >>> p.select(name="mycircle")[0]
    <bokeh.models.renderers.GlyphRenderer at 0x106a4c810>

Then, the glyph itself is obtained from the ``.glyph`` attribute of a
``GlyphRenderer``:

.. _userguide_styling_axes:

.. code-block:: python

    >>> p.select(name="mycircle")[0].glyph
    <bokeh.models.markers.Circle at 0x10799ba10>

This is the object to set fill, line, or text property values for:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], name="mycircle")

    glyph = p.select(name="mycircle")[0].glyph
    glyph.size = 60
    glyph.fill_alpha = 0.2
    glyph.line_color = "firebrick"
    glyph.line_dash = [6, 3]
    glyph.line_width = 2

    show(p)

``GlyphRenderer`` objects can also be configured with ``selection_glyph``
and ``nonselection_glyph`` attributes that control the visual appearance of
glyphs when selection tools are used.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400, tools="lasso_select")
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=50, name="mycircle")

    glyph = p.select(name="mycircle")[0].nonselection_glyph
    glyph.fill_alpha = 0.2
    glyph.line_color = "firebrick"
    glyph.line_dash = [6, 3]
    glyph.line_width = 2

    show(p)

Use the lasso tool to select circles on the plot above to see the effect
on the nonselected glyphs.

.. note::
    Only the *visual* properties of ``selection_glyph`` and
    ``nonselection_glyph`` are considered when renderering. Changing
    positions, sizes, etc. will have no effect.

Axes
----

In this section you will learn how to change various visual properties
of Bokeh plot axes.

To set style attributes on Axis objects, use the |xaxis|, |yaxis|, and
|axis| methods on |Plot| to first obtain a plot's Axis objects:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

This returns a list of Axis objects (since there may be more than
one). But note that, as convenience, these lists are *splattable*,
meaning that you can set attributes directly on this result, and
the attributes will be applied to all the axes in the list:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

will change the value of ``axis_label`` for every x-axis (however
many there may be).

Below is code that will set some of the properties of axes. You can
execute this code, and try setting other properties as well.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-axes
    p.xaxis.axis_label = "Temp"
    p.xaxis.axis_line_width = 3
    p.xaxis.axis_line_color = "red"

    # change just some things about the y-axes
    p.yaxis.axis_label = "Pressure"
    p.yaxis.major_label_text_color = "orange"
    p.yaxis.major_label_orientation = "vertical"

    # change things on all axes
    p.axis.minor_tick_in = -3
    p.axis.minor_tick_out = 6

    show(p)

.. _userguide_styling_axes_labels:

Labels
~~~~~~

The text of an overall label for an axis is controlled by the ``axis_label``
property. Additionally, there are `Text Properties`_ prefixed with
``axis_label_`` that control the visual appearance of the label. For instance
to set the color of the label, set ``axis_label_text_color``. Finally, to
change the distance between the axis label and the major tick labels, set
the ``axis_label_standoff`` property:

.. bokeh-plot::
    :source-position: above

    from bokeh.models.ranges import Range1d
    from bokeh.plotting import figure, output_file, show

    output_file("bounds.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.axis_label = "Lot Number"
    p.xaxis.axis_label_text_color = "#aa6666"
    p.xaxis.axis_label_standoff = 30

    p.yaxis.axis_label = "Bin Count"
    p.yaxis.axis_label_text_font_style = "italic"

    show(p)


.. _userguide_styling_axes_bounds:

Bounds
~~~~~~

Sometimes it is useful to limit the bounds where axes are drawn. This can be
accomplished by setting the ``bounds`` property of an axis object to a 2-tuple
of *(start, end)*:

.. bokeh-plot::
    :source-position: above

    from bokeh.models.ranges import Range1d
    from bokeh.plotting import figure, output_file, show

    output_file("bounds.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.bounds = (2, 4)

    show(p)

.. _userguide_styling_axes_tick_lines:

Tick Lines
~~~~~~~~~~

The visual appearance of the major and minor ticks is controlled by
a collection of `Line Properties`_, prefixed with ``major_tick_`` and
``minor_tick_``, respectively. For instance, to set the color of the
major ticks, use ``major_tick_line_color``. To hide either set of ticks,
set the color to ``None``. Additionally, you can control how far in and
out of the plotting area the ticks extend, with the properties
``major_tick_in``/``major_tick_out`` and ``minor_tick_in``/``minor_tick_out``.
These values are in screen units, and negative values are acceptable.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.major_tick_line_color = "firebrick"
    p.xaxis.major_tick_line_width = 3
    p.xaxis.minor_tick_line_color = "orange"

    p.yaxis.minor_tick_line_color = None

    p.axis.major_tick_out = 10
    p.axis.minor_tick_in = -3
    p.axis.minor_tick_out = 8

    show(p)

.. _userguide_styling_axes_tick_label_formats:

Tick Label Formats
~~~~~~~~~~~~~~~~~~

The text styling of axis labels is controlled by a ``TickFormatter`` object
configured on the axis' ``formatter`` property. Bokeh uses a number of ticker
formatters by default in different situations:

* |BasicTickFormatter| --- Default formatter for  linear axes.

* |CategoricalTickFormatter| --- Default formatter for categorical axes.

* |DatetimeTickFormatter| --- Default formatter for datetime axes.

* |LogTickFormatter| --- Default formatter for log axes.

These default tick formatters do not expose many configurable properties.
To control tick formatting at a finer grained level, use one of the
|NumeralTickFormatter| or |PrintfTickFormatter| described below.

.. note::
    To replace a tick formatter on an Axis, you must set the ``formatter``
    property on an actual ``Axis`` object, not on a splattable list. This is
    why ``p.yaxis[0].formatter``, etc. (with the subscript ``[0]``) is used.

``NumeralTickFormatter``
''''''''''''''''''''''''

The |NumeralTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import NumeralTickFormatter

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis[0].formatter = NumeralTickFormatter(format="0.0%")
    p.yaxis[0].formatter = NumeralTickFormatter(format="$0.00")

    show(p)

Many additional formats are available, see the full |NumeralTickFormatter|
documentation in the :ref:`refguide`.

``PrintfTickFormatter``
'''''''''''''''''''''''

The |PrintfTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks using ``printf`` style
format strings.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import PrintfTickFormatter

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis[0].formatter = PrintfTickFormatter(format="%4.1e")
    p.yaxis[0].formatter = PrintfTickFormatter(format="%5.3f mu")

    show(p)

For full details about formats, see the full |PrintfTickFormatter|
documentation in the :ref:`refguide`.

.. _userguide_styling_axes_tick_label_orientation:

Tick Label Orientation
~~~~~~~~~~~~~~~~~~~~~~

The orientation of major tick labels can be controlled with the
``major_label_orientation`` property. This property accepts the
values ``"horizontal"`` or ``"vertical"`` or a floating point number
that gives the angle (in radians) to rotate from the horizontal:

.. bokeh-plot::
    :source-position: above

    from math import pi
    from bokeh.plotting import figure, output_file, show

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.major_label_orientation = pi/4
    p.yaxis.major_label_orientation = "vertical"

    show(p)

----

There are more properties that Bokeh axes support configuring.
For a complete listing of all the various attributes that can be set
on different types of Bokeh axes, consult the :ref:`bokeh.models.axes`
section of the :ref:`refguide`.

.. _userguide_styling_grids:

Grids
-----

In this section you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

Similar to the convenience methods for axes, there are |xgrid|, |ygrid|,
and |grid| methods on |Plot| that can be used to obtain a plot's Grid
objects:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists, so that you can set an attribute
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (i.e., are vertical). Correspondingly, ``ygrid`` provides
    the grid objects that intersect the y-axis (i.e., are horizontal).

.. _userguide_styling_grid_lines:

Lines
~~~~~

The visual appearance of grid lines is controlled by a collection of
`Line Properties`_, prefixed with ``grid_``. For instance, to set the
color of grid lines, use ``grid_line_color``. To hide grid lines, set
their line color to ``None``.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.grid_line_alpha = 0.5
    p.ygrid.grid_line_dash = [6, 4]

    show(p)

Minor Lines
~~~~~~~~~~~

The visual appearance of minor grid lines is controlled by a collection of
`Line Properties`_, prefixed with ``minor_grid_``. For instance, to set the
color of grid lines, use ``minor_grid_line_color``. By default, minor grid
lines are hidden (i.e., their line color is set to ``None``).

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("minorgridlines.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the y-grid
    p.ygrid.minor_grid_line_color = 'navy'
    p.ygrid.minor_grid_line_alpha = 0.1

    show(p)


.. _userguide_styling_grid_bands:

Bands
~~~~~

It is also possible to display filled, shaded bands between adjacent
grid lines. The visual appearance of these bands is controlled by a
collection of `Fill Properties`_, prefixed with ``band_``. For instance,
to set the color of grid bands, use ``band_fill_color``. To hide grid
bands, set their fill color to ``None`` (this is the default).

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridbands.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.band_fill_alpha = 0.1
    p.ygrid.band_fill_color = "navy"

    show(p)

.. _userguide_styling_grid_bounds:

Bounds
~~~~~~

Grids also support setting explicit bounds between which they are drawn.
They are set in an identical fashion to axes bounds, with a 2-tuple
of *(start, end)*:

.. bokeh-plot::
    :source-position: above

    from bokeh.models.ranges import Range1d
    from bokeh.plotting import figure, output_file, show

    output_file("bounds.html")

    p = figure(plot_width=400, plot_height=400)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.grid.bounds = (2, 4)

    show(p)



----

There are other properties that Bokeh grids support configuring. For a
complete listing of all the various attributes that can be set on Bokeh
plot grids, consult the :ref:`bokeh.models.grids` section of the
:ref:`refguide`.

.. _userguide_styling_legends:

Legends
-------

Similar to the convenience methods for axes and grids, there is a
|legend| method on |Plot| that can be used to obtain a plot's legend
objects:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.renderers.Legend at 0x106fa2278>]

This method also returns a splattable list, so that you can set an attribute
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.legend.label_text_font = "times"

.. note::
    The examples in this section use NumPy to more easily generate better
    data suitable for demonstrating legends.

Location
~~~~~~~~

The location of the legend labels is controlled by the ``orientation``
property. Valid values for this property are:

``"top_right"``

``"top_left"``

``"bottom_left"``

``"bottom_right"``

The default location is ``"top_right"``.

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *

    x = np.linspace(0, 4*np.pi, 100)
    y = np.sin(x)

    output_file("legend_labels.html")

    p = figure()

    p.circle(x, y, legend="sin(x)")
    p.line(x, y, legend="sin(x)")

    p.line(x, 2*y, legend="2*sin(x)",
        line_dash=[4, 4], line_color="orange", line_width=2)

    p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
    p.line(x, 3*y, legend="3*sin(x)", line_color="green")

    p.legend.orientation = "bottom_left"

    show(p)

.. note::
    It is not currently possible to position a legend outside the plot area,
    or using absolute coordinates. These and other improvements are planned.

Label Text
~~~~~~~~~~

The visual appearance of the legend labels is controlled by  a collection of
`Text Properties`_, prefixed with ``label_``. For instance, to set the font
style of the labels, use ``label_text_font_style``.

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *

    x = np.linspace(0, 4*np.pi, 100)
    y = np.sin(x)

    output_file("legend_labels.html")

    p = figure()

    p.circle(x, y, legend="sin(x)")
    p.line(x, y, legend="sin(x)")

    p.line(x, 2*y, legend="2*sin(x)",
        line_dash=[4, 4], line_color="orange", line_width=2)

    p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
    p.line(x, 3*y, legend="3*sin(x)", line_color="green")

    p.legend.label_text_font = "times"
    p.legend.label_text_font_style = "italic"
    p.legend.label_text_color = "navy"

    show(p)

Border
~~~~~~

The visual appearance of the legend border is controlled by  a collection of
`Line Properties`_, prefixed with ``border_``. For instance, to set the color
of the border, use ``border_line_color``. To make the border invisible, set
the border line color to ``None``.

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *

    x = np.linspace(0, 4*np.pi, 100)
    y = np.sin(x)

    output_file("legend_labels.html")

    p = figure()

    p.circle(x, y, legend="sin(x)")
    p.line(x, y, legend="sin(x)")

    p.line(x, 2*y, legend="2*sin(x)",
        line_dash=[4, 4], line_color="orange", line_width=2)

    p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
    p.line(x, 3*y, legend="3*sin(x)", line_color="green")

    p.legend.border_line_width = 3
    p.legend.border_line_color = "navy"
    p.legend.border_line_alpha = 0.5

    show(p)

Dimensions
~~~~~~~~~~

There are several properties that can be used to control the layout,
spacing, etc. of the legend compononents:

.. bokeh-prop:: bokeh.models.renderers.Legend.label_standoff
.. bokeh-prop:: bokeh.models.renderers.Legend.label_width
.. bokeh-prop:: bokeh.models.renderers.Legend.label_height
.. bokeh-prop:: bokeh.models.renderers.Legend.glyph_width
.. bokeh-prop:: bokeh.models.renderers.Legend.glyph_height
.. bokeh-prop:: bokeh.models.renderers.Legend.legend_padding
.. bokeh-prop:: bokeh.models.renderers.Legend.legend_spacing

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *

    x = np.linspace(0, 4*np.pi, 100)
    y = np.sin(x)

    output_file("legend_labels.html")

    p = figure()

    p.circle(x, y, legend="sin(x)")
    p.line(x, y, legend="sin(x)")

    p.line(x, 2*y, legend="2*sin(x)",
        line_dash=[4, 4], line_color="orange", line_width=2)

    p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
    p.line(x, 3*y, legend="3*sin(x)", line_color="green")

    p.legend.label_standoff = 5
    p.legend.glyph_width = 50
    p.legend.legend_spacing = 10
    p.legend.legend_padding = 50

    show(p)


.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
.. |select| replace:: :func:`~bokeh.models.plots.Plot.select`


.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Range1d| replace:: :class:`~bokeh.models.ranges.Range1d`

.. |bokeh.models.formatters| replace:: :ref:`bokeh.models.formatters <bokeh.models.formatters>`
.. |BasicTickFormatter| replace:: :class:`~bokeh.models.formatters.BasicTickFormatter`
.. |CategoricalTickFormatter| replace:: :class:`~bokeh.models.formatters.CategoricalTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |LogTickFormatter| replace:: :class:`~bokeh.models.formatters.LogTickFormatter`
.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`
