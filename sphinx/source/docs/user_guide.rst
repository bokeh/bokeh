.. _userguide:

User Guide
==========

.. contents::
    :local:
    :depth: 2

The User Guide is being continuously updated, but please also consult the numerous
`examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples>`_
to see the kinds of parameters that can be passed in to plotting functions in ``bokeh.plotting``, and look
at the `glyph examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples/glyphs>`_ to see
the kinds of low-level object attributes that can be set to really customize a plot.

A reference for Bokeh glyphs can be found at :doc:`glyphs_ref`.

.. _userguide_plot_ranges:

Plot Ranges
-----------

To control the ranges that Bokeh plots show, there are two keyword parameters `x_range` and
`y_range`. These may be passed into the :class:`bokeh.plotting.figure` function, or into any
of the high-level plotting :ref:`bokeh_plotting_glyphs`. They may also be set as attributes on
a plot object.

Automatic Ranges
''''''''''''''''

If `None` is passed in as the value of `x_range` or `y_range`, then the plot will be configured
with a `DataRange1d` which computes the envelope of all the plot data to determine the range.
This is the default behavior.

.. note:: For non-scatter glyphs with spatial extent, the `DataRange1d` may not compute the necessary bounds fully.

Numerical Ranges
''''''''''''''''

To set the range on a plot that has numerical range values, you can pass a sequence of
numbers with length two::

    figure(xrange=[0, 100])

This will prepare a new plot that has an x-axis range that spans the interval `[0, 100]`.
You can also pass a :class:`bokeh.objects.Range1D` object explicitly::

    figure(xrange=Range1d(start=2, end=8))

This will prepare a new plot that has an x-axis range that spans the interval `[2, 8]`.
Alternatively, you can set the range as a property on a Plot object::

    plot = curplot()
    plot.y_range = Range1d(start=0, end=10)

Categorical Ranges
''''''''''''''''''

For plots with categorical ranges, it is necessary to specify the range as a sequence of strings
that give the categories in the desired order. For example::

    figure(y_range=["foo", "bar", "baz"])

will prepare a plot whose y-axis range is categorical, with the categories "foo", "bar", and "baz".
Please see `this categorical example <http://bokeh.pydata.org/docs/gallery/categorical.html>`_ from
the gallery for a concrete example.

You can also pass in a `FactorRange` explicitly as well.

Styling
-------

Properties
''''''''''
Many of the styling options are grouped into three categories of properties: :ref:`userguide_line_properties`,
:ref:`userguide_fill_properties`, and :ref:`userguide_text_properties`.

.. _userguide_line_properties:

Line Properties
***************

.. include:: includes/line_props.txt


.. _userguide_fill_properties:

Fill Properties
***************

.. include:: includes/fill_props.txt


.. _userguide_text_properties:

Text Properties
***************

.. include:: includes/text_props.txt


Plots
'''''

Plots can be configured with several keyword arguments that control appearance:

* ``background_fill`` a color to fill the inner plot area with

* ``border_fill`` a color to fill the border region around the plot area with.

* ``min_border`` a minimum size in pixels for the border. This applies to all sides of the plot. May set individual border widths with ``min_border_left``, ``min_border_right``, ``min_border_top``, and ``min_border_bottom``

* ``border_symmetry`` whether to symmetrize plot borders on opposite sides of the plot. Valid values are: ``''``, ``'h'``, ``'v'``, and ``'hv'``, where "h" and "v" are for "horizontal" and "vertical", respectively.

* ``title`` a title to display above the plot.
  - "title" is also the prefix for a set of :ref:`userguide_text_properties`, so you an set the font for the title with the parameter ``text_font``.

* "outline" is the prefix for a set of :ref:`userguide_line_properties` that control the appearance of an outline around the plot, for instance you can set the color of the outline with ``outline_line_color``.

* ``x_range`` the extent of the plotting area in the x-dimension. See :ref:`userguide_plot_ranges`

* ``y_range`` the extent of the plotting area in the y-dimension. See :ref:`userguide_plot_ranges`

* ``plot_width``, ``plot_height`` width and height of the entire plot in pixels, including border space

* ``x_axis_type``, ``y_axis_type`` can be set to ``"datetime"`` to create datetime axis

* ``x_mapper_type``, ``y_mapper_type`` can be set to ``"log"`` to specifically set the mapper used for the axis

These parameters can be passed to glyph functions such a ``circle`` or ``rect`` but it is often useful
to pass them to a call to ``figure``::

    figure(
        title="My Plot",
        title_text_font_size="20pt",
        plot_width=200,
        plot_height=300,
        outline_line_color="red",
        x_axis_type="datetime"
    )

Glyphs
''''''

Bokeh plots are centered around glyphs, which generally have some combination of line, fill, or
text properties, depending on what is appropriate for a given glyph. For example, the ``Circle``
glyph has both line and fill properties, but the ``Bezier`` glyph only has line properties.
These properties may be specified as keyword arguments when calling the glyph functions::

    rect(x, y, radius, fill_color="green", fill_alpha=0.6, line_color=None)

.. _userguide_markers:

Markers
'''''''

Markers are Bokeh glyphs that have a prescribed interface. Markers all respond to:

* `x`, `y`
* `size` (screen units)
* line properties
* fill properties

Axes
''''

Axes in Bokeh also have line properties for the axis rule line, as well as for the major ticks. These standard
line properties are prefixed with ``axis_`` and ``major_tick_`` respectively. Axes also have text
properties, for the axis label and major tick labels. These are prefixed ``axis_label_`` and
``major_tick_label_``, respectively.

* **dimension**: currently ``0`` or ``1``, corresponding to "x" or "y" axis
* **location**: where along the cross-dimension to locate this axis: ``"min", "max", "left", "right", "top", "bottom"`` or a floating point value
* **bounds**: bounds for the axis, either ``"auto"`` or a 2-tuple of ``(start, stop)``
* **axis_label_standoff**: a number of pixels to stand tick labels away from ticks
* **major_label_standoff**: a number of pixels to stand axis labels away from tick labels
* **major_label_orientation**: the angle that major tick labels should be rendered at, one of ``"horizontal", "vertical", "normal", "parallel"`` or a floating point angle (in radians)
* **major_tick_in** a distance in pixels that major ticks should extend into the plot area
* **major_tick_out** a distance in pixels that major ticks should extend out the plot area

Some examples::

    axis.axis_line_color = "red"
    axis.bounds = (3, 7)
    axis.major_label_orientation = pi/4

Axes for the current plot may be conveniently obtained using the :func:`bokeh.plotting.xaxis`, :func:`bokeh.plotting.yaxis`,
and :func:`bokeh.plotting.axis` functions. These return collections of axes that can be indexed to retrieve
individual axes, or can that have attributes set directly on them to update all axes. Examples::

    xaxis().axis_line_width = 2 # update all x-axes
    yaxis()[0].axis_line_color = "red" # only updates the first y-axis
    axis().bounds = (2, 8) # set bounds for all axes

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note:: The ``bounds`` attribute here controls only the extent of the axis! It does not set the range of the plot. For that, see :ref:`userguide_plot_ranges`. As an example, a plot window may extend from 0 to 10, but you may only want the axis to render between 4 and 8, in order to highlight a particular sub-area of the plot.

Grids
'''''

Grids are styled very similarly to axes in Bokeh. Grids have identical ``dimension`` and ``bounds`` properties
as well as line properties, prefixed with ``grid_``. There are also :func:`bokeh.plotting.xgrid`, :func:`bokeh.plotting.ygrid`,
and :func:`bokeh.plotting.grid` functions available to obtain grids for the current plot. Examples::

    xgrid().axis_line_dash = "3 3" # update all x-grids
    ygrid()[0].axis_line_color = None # only updates the first y-grid
    grid().bounds = (2, 8) # set bounds for all grids

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note:: The ``bounds`` attribute here controls only the extent of the grid! It does not set the range of the plot. For that, see :ref:`userguide_plot_ranges`. As an example, a plot window may extend from 0 to 10, but you may only want the grid to render between 4 and 8, in order to highlight a particular sub-area of the plot.

Tools
-----

Bokeh comes with a number of interactive tools. The are typically activated
through the toolbar above plots, although some can be activated by key presses
or specific mouse movement.

Tools are added to plots with the ``tools`` keyword argument, which has as its
value a comma separated string listing the tools to add to the plot, for example::

    tools = "pan,wheel_zoom,box_zoom,reset,resize"

BoxSelectTool
'''''''''''''
The box selection tool (``'select'``) allows the user to define a rectangular selection
region be left-dragging on the plot. The indicies of the data points in the selection
region are stored on the data source as the current selection. If other plots share this
datasource, then they will render a linked selection. This selection is also available
from python when using server-based output.

BoxZoomTool
'''''''''''
The box zoom tool (``'box_zoom'``) will zoom the plot in to the box region that a user
selects with left drag while it is the active tool.

CrosshairTool
'''''''''''''
Th crosshair tool (``'crosshair'``) draws a crosshair annotation over the plot, centered on
the current mouse position.

EmbedTool
'''''''''
The embed tool (``'embed'``) tool pops up a modal dialog containing a javascript ``<script>``
snippet that can put int HTML pages to display the plot.

HoverTool
'''''''''
The hover tool (``'hover'``) tool pops up a tooltip div whenever the cursor is over
a glyph. The information comes from the glyphs data source and is configurable through
a simple tooltips dictionary that maps displayed names to columns in the data source,
or to special known variables. Here is an example of how to configure the hover tool::

    # We want to add some fields for the hover tool to interrogate, but first we
    # have to get ahold of the tool. This will be made easier in future releases.
    hover = [t for t in curplot().tools if isinstance(t, HoverTool)][0]

    # Add tooltip (name, value) pairs to tooltips. Variables from the data source
    # are available with a "@" prefix, e.g., "@foo" will display the value for
    # the 'foo' column value under the cursor. There are also some special known
    # values that start with "$" symbol:
    #   - $index     index of selected point in the data source
    #   - $x, $y     "data" coordinates under cursor
    #   - $sx, $sy   canvas coordinates under cursor
    #   - $color     color data from data source, syntax: $color[options]:field_name
    #                available options for $color are: hex, swatch
    # NOTE: we use an OrderedDict here to preserve the order in the displayed tooltip
    hover.tooltips = OrderedDict([
        ("index", "$index"),
        ("(x,y)", "($x, $y)"),
        ("radius", "@radius"),
        ("fill color", "$color[hex, swatch]:fill_color"),
        ("foo", "@foo"),
        ("bar", "@bar"),
    ])

.. note:: Point hit testing is not currently available on all glyphs. Hover tool currently does not work with lines, images, or patch type glyphs.

PanTool
'''''''
The pan tool (``'pan'``) pans the plot on left-click drag. It can be made the active tool
by clicking its button on the tool bar, however it also automatically activates on left-click
drag whenever there is no other active tool.

It is also possible to constraint the pan tool to only act on either just the x-axis or
just the y-axis. For this, there are tool names ``'xpan'`` and ``'ypan'``, respectively.

PreviewSaveTool
'''''''''''''''
The preview-save tool (``'previewsave'``) pops up a modal dialog that allows the user to save
a PNG image if the plot.

ResetTool
'''''''''
The reset tool (``'reset'``) will restore the plot ranges to their original values.

ResizeTool
''''''''''
The resize tool (``'resize'``) allows the user to left drag to resize the entire plot while
it is the active tool.

WheelZoomTool
'''''''''''''
The wheel zoom tool (``'wheel_zoom'``) will zoom the plot in and out, centered on the current
mouse location.  It can be made the active tool by clicking its button on the tool bar, however
it also automatically activates when the ``Shift`` key is depressed.

It is also possible to constraint the wheel zoom tool to only act on either just the x-axis or
just the y-axis. For this, there are tool names ``'xwheel_zoom'`` and ``'ywheel_zoom'``, respectively.

Embedding
---------

Bokeh provides a variety of ways to embed plots and data into HTML documents.


Standalone HTML
'''''''''''''''

Bokeh can generate standalone HTML documents, from its own generic template,
or a template you provide. These files contain the data for the plot inline
and are completely transportable, while still providing interactive tools
(pan, zoom, etc.) for your plot.

Components
''''''''''

It is also possible to ask Bokeh to return the individual components for a
inline embedding: a ``<script>`` that contains the data for your plot,
together with an accompanying ``<div>`` tag that the plot view is loaded
into. These tags can be used in HTML documents however you like.

.. note:: using these components assums that BokehJS has been loaded already.

IPython Notebook
''''''''''''''''

Bokeh can also generate ``<div>`` tags suitable for inline display in the
IPython notebook using the ``notebook_div`` function.

.. note:: Typically users will probably use the higher-level function
          ``plotting.output_notebook()`` in conjuction with ``%bokeh``
          magic in the IPython notebook.

Autoload ``<script>``
'''''''''''''''''''''

Finally it is possible to ask Bokeh to return a ``<script>`` tag that will
replace itself with a Bokeh plot, wherever happens to be located. The script
will also check for BokehJS and load it, if necessary, so it is possible to
embed a plot by placing this script tag alone in your document.

There are two cases:

server data
***********

The simplest case is to use the Bokeh server to persist your plot and data.
Additionally, the Bokeh server affords the opportunity of animated plots or
updating plots with streaming data. The :func:`bokeh.embed.autoload_server` function accepts
a plot object and a Bokeh server ``Session`` object. It returns a ``<script>``
tag that will load both your plot and data from the Bokeh server.

As a concrete example, here is some simple code using :func:`bokeh.embed.autoload_server`
with the ``plotting.py`` interface::

    from bokeh.plotting import circle, cursession, output_server
    from bokeh.embed import autoload_server
    output_server("mydoc")
    plot = circle([1,2], [3,4])
    script = autoload_server(plot, cursession())

The resulting ``<script>`` tag that you can use to embed the plot inside
a document looks like::

    <script
        src="http://localhost:5006/bokeh/autoload.js/7b6e5722-b7e1-4b9e-b8d9-84e1059f7dea"
        id="7b6e5722-b7e1-4b9e-b8d9-84e1059f7dea"
        async="true"
        data-bokeh-data="server"
        data-bokeh-modelid="da023ae3-b88b-45b5-8fc1-f45c53f09fa2"
        data-bokeh-modeltype="Plot"
        data-bokeh-root-url="http://localhost:5006/"
        data-bokeh-docid="db499b59-c06e-4415-a482-af9802512ede"
        data-bokeh-docapikey="45959c87-3120-4ce5-a1ec-ca0720023951"
        data-bokeh-conn-string="ws://localhost:5006/bokeh/sub"
    ></script>

static data
***********

If you do not need or want to use the Bokeh server, then the you can use the
:func:`bokeh.embed.autoload_static` function. This function takes the plot object you want
to display together with a resources specification and path to load a script
from. It will return a self-contained ``<script>`` tag, together with some
JavaScript code that contains the data for your plot. This code should be
saved to the script path you provided. The ``<script>`` tag will load this
separate script to realize your plot.

Here is how you might use :func:`bokeh.embed.autoload_static` with a simple plot::

    from bokeh.resources import CDN
    from bokeh.plotting import circle, output_server
    from bokeh.embed import autoload_static
    from bokeh.resources import CDN
    output_server("mydoc")
    plot = circle([1,2], [3,4])
    js, tag = autoload_static(plot, CDN, "some/path")

The resulting ``<script>`` tag looks like::

    <script
        src="some/path"
        id="f1a5ad43-8d26-4199-8916-6405fe53b143"
        async="true"
        data-bokeh-data="static"
        data-bokeh-modelid="5dd89f11-1f06-4408-a6be-281933ee3e0c"
        data-bokeh-modeltype="Plot"
    ></script>

The resulting JavaScript code should be saved to a file that can be reached
on the server at `"some/path", from the document that has the plot embedded.


.. note:: In both cases the ``<script>`` tag loads a ``<div>`` in place, so
          it must be placed under ``<head>``.

Animated Plots
--------------

While a sophisticated animation API is planned for Bokeh, it is already possible to create animated
plots just by updating a glyph's data source periodically. This requires running ``bokeh-server`` so
that plots are notified of the updates to the data. Below is a video capture of an animated
plot in the ipython notebook (which may be found in ``examples/plotting/notebook``).

.. image:: /_images/animated.gif
    :align: center

Note that all the tools, zoom, pan, resize function normally and the plot
continues to animate while the tools are used. Currently in order to animate,
you must grab the glyph renderer off a plot, update its data source, then
store the data source on the session. The code to animate the above plot is
shown here::

    renderer = [r for r in curplot().renderers if isinstance(r, Glyph)][0]
    ds = renderer.data_source
    while True:
        for i in linspace(-2*pi, 2*pi, 50):

            rmin = ds.data["inner_radius"]
            rmin = roll(rmin, 1)
            ds.data["inner_radius"] = rmin

            rmax = ds.data["outer_radius"]
            rmax = roll(rmax, -1)
            ds.data["outer_radius"] = rmax

            cursession().store_objects(ds)
            time.sleep(.10)

Novel Plots
-----------

Bokeh is designed to allow you to flexibly compose many different glyph types into one plot. As an
example, we will step through how to reproduce `Will Burtin's antibiotics chart
<http://www.americanscientist.org/issues/pub/thats-funny>`_, shown below, using Bokeh.

.. image:: /_images/burtin_novel.png
    :align: center
    :scale: 50 %

This first block defines the data and computes some derived quantities used in the plot using
`NumPy <http://www.numpy.org>`_ and `Pandas <http://pandas.pydata.org>`_::

    import numpy as np
    import pandas as pd
    from bokeh.plotting import *
    from bokeh.objects import Range1d
    from StringIO import StringIO
    from math import log, sqrt
    from collections import OrderedDict

    antibiotics = """
    bacteria,                        penicillin, streptomycin, neomycin, gram
    Mycobacterium tuberculosis,      800,        5,            2,        negative
    Salmonella schottmuelleri,       10,         0.8,          0.09,     negative
    Proteus vulgaris,                3,          0.1,          0.1,      negative
    Klebsiella pneumoniae,           850,        1.2,          1,        negative
    Brucella abortus,                1,          2,            0.02,     negative
    Pseudomonas aeruginosa,          850,        2,            0.4,      negative
    Escherichia coli,                100,        0.4,          0.1,      negative
    Salmonella (Eberthella) typhosa, 1,          0.4,          0.008,    negative
    Aerobacter aerogenes,            870,        1,            1.6,      negative
    Brucella antracis,               0.001,      0.01,         0.007,    positive
    Streptococcus fecalis,           1,          1,            0.1,      positive
    Staphylococcus aureus,           0.03,       0.03,         0.001,    positive
    Staphylococcus albus,            0.007,      0.1,          0.001,    positive
    Streptococcus hemolyticus,       0.001,      14,           10,       positive
    Streptococcus viridans,          0.005,      10,           40,       positive
    Diplococcus pneumoniae,          0.005,      11,           10,       positive
    """

    drug_color = OrderedDict([
        ("Penicillin",   "#0d3362"),
        ("Streptomycin", "#c64737"),
        ("Neomycin",     "black"  ),
    ])

    gram_color = {
        "positive" : "#aeaeb8",
        "negative" : "#e69584",
    }

    df = pd.read_csv(StringIO(antibiotics), skiprows=1, skipinitialspace=True)

    width = 800
    height = 800
    inner_radius = 90
    outer_radius = 300 - 10

    minr = sqrt(log(.001 * 1E4))
    maxr = sqrt(log(1000 * 1E4))
    a = (outer_radius - inner_radius) / (minr - maxr)
    b = inner_radius - a * maxr

    def rad(mic):
        return a * np.sqrt(np.log(mic * 1E4)) + b

    big_angle = 2.0 * np.pi / (len(df) + 1)
    small_angle = big_angle / 7

Configure Bokeh to generate static HTML output using ``output_file``::

    output_file("burtin.html", title="burtin.py example")

We are going to be combining several glyph renderers on to one plot, first we need to tell Bokeh to
reuse the same plot using ``hold``::

    hold()

Next we add the first glyph, the red and blue regions using ``annular_wedge``. We also take this
opportunity toset some of the overall properties of the plot::

    angles = np.pi/2 - big_angle/2 - df.index*big_angle
    colors = [gram_color[gram] for gram in df.gram]
    annular_wedge(
        x, y, inner_radius, outer_radius, -big_angle+angles, angles, color=colors,
        plot_width=width, plot_height=height, title="", tools="", x_axis_type=None, y_axis_type=None
    )

Next we grab the current plot using ``curplot`` and customize the look of the plot further::

    plot = curplot()
    plot.x_range = Range1d(start=-420, end=420)
    plot.y_range = Range1d(start=-420, end=420)
    plot.min_border = 0
    plot.background_fill = "#f0e1d2"
    plot.border_fill = "#f0e1d2"
    plot.outline_line_color = None
    xgrid().grid_line_color = None
    ygrid().grid_line_color = None

Add the small wedges representing the antibiotic effectiveness, also using ``annular_wedge``::

    annular_wedge(
        x, y, inner_radius, rad(df.penicillin), -big_angle+angles + 5*small_angle, -big_angle+angles+6*small_angle, color=drug_color['Penicillin'],
    )
    annular_wedge(
        x, y, inner_radius, rad(df.streptomycin), -big_angle+angles + 3*small_angle, -big_angle+angles+4*small_angle, color=drug_color['Streptomycin'],
    )
    annular_wedge(
        x, y, inner_radius, rad(df.neomycin), -big_angle+angles + 1*small_angle, -big_angle+angles+2*small_angle, color=drug_color['Neomycin'],
    )

Add circular and radial axes lines using ``circle``, ``text``, and ``annular_wedge``::

    labels = np.power(10.0, np.arange(-3, 4))
    radii = a * np.sqrt(np.log(labels * 1E4)) + b
    circle(x, y, radius=radii, fill_color=None, line_color="white")
    text(x[:-1], radii[:-1], [str(r) for r in labels[:-1]], angle=0, text_font_size="8pt", text_align="center", text_baseline="middle")

    annular_wedge(
        x, y, inner_radius-10, outer_radius+10, -big_angle+angles, -big_angle+angles, color="black",
    )

Text labels for the bacteria using ``text``::

    xr = radii[0]*np.cos(np.array(-big_angle/2 + angles))
    yr = radii[0]*np.sin(np.array(-big_angle/2 + angles))
    label_angle=np.array(-big_angle/2+angles)
    label_angle[label_angle < -np.pi/2] += np.pi # easier to read labels on the left side
    text(xr, yr, df.bacteria, angle=label_angle, text_font_size="9pt", text_align="center", text_baseline="middle")

Legends (by hand, for now) using ``circle``, ``text``, and ``rect``::

    circle([-40, -40], [-370, -390], color=gram_color.values(), radius=5)
    text([-30, -30], [-370, -390], text=["Gram-" + x for x in gram_color.keys()], angle=0, text_font_size="7pt", text_align="left", text_baseline="middle")

    rect([-40, -40, -40], [18, 0, -18], width=30, height=13, color=drug_color.values())
    text([-15, -15, -15], [18, 0, -18], text=drug_color.keys(), angle=0, text_font_size="9pt", text_align="left", text_baseline="middle")

Finally, show the plot::

    show()

Bokeh charts
------------

The main idea behind the ``bokeh.charts`` interface is to help the users to easily get their plot
using a very high level API.

Currently the ``bokeh.charts`` interface supports:

* ``Histograms`` (grouped)
* ``Bar plots`` (grouped and stacked)
* ``Scatter plots`` (grouped and stacked)

To use it, you only have to import the ``Bokeh`` chart of interest from ``bokeh.charts``::

    from bokeh.charts import Histogram

initialize your plot with some specific arguments (for chart customization)::

    hist = Histogram(normal_dist, bins=50, mu=mu, sigma=sigma,
                     title="kwargs, dict_input", ylabel="frequency", legend="top_left",
                     width=400, height=350, notebook=True)

and finally call the ``show()`` method::

    hist.show()

.. image:: /_images/histogram.png
    :align: center

Generic arguments and chained methods
'''''''''''''''''''''''''''''''''''''

You can pass some arguments when you instantiate the class, as we shown you before, or you can use
chained methods as we shown below::

    hist = Histogram(distributions, bins=50, notebook=True)
    hist.title("chained_methods, dict_input").ylabel("frequency").legend(True).width(400).height(350).show()

.. note:: Be aware that the ``show()`` method can not be chained. It has to be called at the end of your chain.

Available arguments and chained methods are:

* ``title``, string type, to add a title to your chart
* ``xlabel``, string type, to label the x axis
* ``ylabel``, string type, to label the y axis
* ``legend``, string type, it can be `top_left`, `top_right`, `bottom_left`, `bottom_right`. The legend content is inferred from incoming input.
* ``width``, int type, to set the chart width
* ``height``, int type, to set the chart height
* ``tools``, bool type, to setup (or avoid) the tools in your chart

Specific arguments
''''''''''''''''''

In some charts, you can pass specific arguments which only makes sense in an specific chart context.

For instance, in the Histogram chart, you need to set up the ``bins`` and, additionally, you can pass a ``mu`` and ``sigma``
to get the ``pdf`` and the ``cdf`` line plots of theoretical normal distributions for these parameters.

In the Bar charts case, if you pass several groups, they will be shown ``grouped`` by default:

.. image:: /_images/bargrouped.png
    :align: center

But if you specify the argument ``stacked`` as True, it will be shown as stacked bars as follow:

.. image:: /_images/barstacked.png
    :align: center

Interface inputs
''''''''''''''''

The ``bokeh.charts`` interface is ready to get your input as, essentially, ``OrderedDict`` and pandas ``dataframe objects``
(also pandas ``groupby objects`` in some cases). The idea behind this canonical format is to easily represent groups of
data and easily plot them through the interface.

Let see some examples using different kind of inputs.

* Using ``OrderedDict``::

    from collections import OrderedDict

    from bokeh.charts import Scatter
    from bokeh.sampledata.iris import flowers

    setosa = flowers[(flowers.species == "setosa")][["petal_length", "petal_width"]]
    versicolor = flowers[(flowers.species == "versicolor")][["petal_length", "petal_width"]]
    virginica = flowers[(flowers.species == "virginica")][["petal_length", "petal_width"]]

    xyvalues = OrderedDict([("setosa", setosa.values), ("versicolor", versicolor.values), ("virginica", virginica.values)])

    scatter = Scatter(xyvalues)
    scatter.title("iris dataset, dict_input").xlabel("petal_length").ylabel("petal_width").legend("top_left").width(600).height(400).notebook().show()

.. image:: /_images/scatter.png
    :align: center

* Using a ``hierarchical`` pandas ``dataframe``::

    import pandas as pd

    xyvalues = OrderedDict([("setosa", setosa), ("versicolor", versicolor), ("virginica", virginica)])

    df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

    scatter = Scatter(df)
    scatter.title("iris dataset, df_input").legend("top_left").width(600).height(400).notebook().show()

* Using a pandas ``groupby`` object::

    from bokeh.charts import Scatter
    from bokeh.sampledata.iris import flowers

    df = flowers[["petal_length", "petal_width", "species"]]
    g = df.groupby("species")

    scatter = Scatter(g)
    scatter.title("iris dataset, gp_by_input").legend("top_left").width(600).height(400).notebook().show()

As you can see, in the last two cases, we inferred the ``x`` and ``y`` labels from the pandas object, so you have not to be aware
of specifying them by yourself.

.. note:: For plotting just one group you can build a simple ``OrderedDict``
          having the group of interest and pass this object to the interface, ie::

              mu, sigma = 0, 0.5
              normal = np.random.normal(mu, sigma, 1000)
              normal_dist = OrderedDict(normal=normal)

Interface outputs
'''''''''''''''''

As with the low and middle level ``Bokeh`` plotting APIs, in ``bokeh.charts``, we also support the chart output to a file::

    hist = Histogram(distributions, bins=50, filename="my_plot")

* ``filename``, string type, the name of your chart. If you pass ``True`` to this argument (or chained method) it will use ``untitled`` as a filename)

to the ``bokeh-server``::

    hist = Histogram(distributions, bins=50, server=True)

* ``server``, string type, the name of your chart in the server. If you pass ``True`` to this argument (or chained method) it will use ``untitled`` as a server name)

and to the IPython notebook::

    hist = Histogram(distributions, bins=50, notebook=True)

* ``notebook``, bool type, if you want to output (or not) to the notebook.

Keep in mind that, as with any other ``Bokeh`` plots in the IPython notebook, you have to load the ``BokehJS`` library into the notebook just doing::

    import bokeh
    bokeh.load_notebook()

.. note:: You can output to any or all of these 3 possibilities because, right now, they are not mutually exclusive.

Reporting bugs
--------------

You can report any possible bug, start discussions or ask for features at our
`issue tracker <https://github.com/ContinuumIO/bokeh/issues?state=open>`_ list.
To start a new issue, you will find a ``New issue`` green button at the top right area of the page.

But ``Bokeh`` also provides a programmatic way to open an issue. You only need to use the
``bokeh.report_issue()`` interactive function::

    In [1]: import bokeh

    In [2]: bokeh.report_issue()
    This is the Bokeh reporting engine.

    Next, you will be guided to build the report
    Write the title for the intended issue: This is a text.
    Write the body for the intended issue: And this is the problem.
    You need to add your GHUSER (Github username) and GHPASS (Github password)
    to the environmentor complete the next lines.
    Do you want to abort to set up the environment variable? no
    Write your Github username: damianavila
    Write your Github password: xxxxxxxxxxx

    Preview:

    title: This is a text.
    body: And this is the problem.

        Bokeh version: 0.4.4-455-gc3324df-dirty
        Python version: 2.7.4-CPython
        Platform: Linux-3.11.0-031100rc7-generic-x86_64-with-Ubuntu-13.04-raring

    Submit the intended issue/comment? y

Then, ``Bokeh`` will push the issue to our issue tracker and it will open a new browser tab
showing your submitted issue, if you want to add more comments.
As you can see, this function will also append some important information about versions
and your architecture to help us to reproduce the intended bug.

Finally, you can even make a comment in any issue using this tool just passing the issue number as
an argument::

    In [3]: bokeh.report_issue(555)
    This is the Bokeh reporting engine.

    Next, you will be guided to build the report
    Write your comment here: Adding a new comment to an already opened issue.
