.. _userguide:

User Guide
==========

.. contents::
    :local:
    :depth: 2

The User Guide is being continusly updated, but please also consult the numerous
`examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples>`_
to see the kinds of parameters that can be passed in to plotting functions in ``bokeh.plotting``, and look
at the `glyph examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples/glyphs>`_ to see
the kinds of low-level object attributes that can be set to really customize a plot.

A reference for Bokeh glyphs can be found at :doc:`glyphs_ref`.

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



Glyphs
''''''

Bokeh plots are centered around glyphs, which generally have some combination of line, fill, or
text properties, depending on what is appropriate for a given glyph. For example, the ``Circle``
glyph has both line and fill properties, but the ``Bezier`` glyph only has line properties.
These properties may bespecified as keyword arguments when calling the glyph functions::

    rect(x, y, radius, fill_color="green", fill_alpha=0.6, line_color=None)

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

Axes for the current plot may be conveniently obtained using the ``plotting.xaxis()``, ``plotting.yaxis()``,
and ``plotting.axis()`` functions. These return collections of axes that can be indexed to retrieve
individual axes, or can that have attributes set directly on them to update all axes. Examples::

    xaxis().axis_line_width = 2 # update all x-axes
    yaxis()[0].axis_line_color = "red" # only updates the first y-axis
    axis().bounds = (2, 8) # set bounds for all axes

Typically after updating these attributes, a call to ``plotting.show()`` will be required.

Grids
'''''

Grids are styled very similarly to axes in Bokeh. Grids have identical ``dimension`` and ``bounds`` properties
as well as line properties, prefixed with ``grid_``. There are also ``plotting.xgrid()``, ``plotting.ygrid()``,
and ``plotting.grid()`` functions available to obtain grids for the current plot. Examples::

    xgrid().axis_line_dash = "3 3" # update all x-grids
    ygrid()[0].axis_line_color = None # only updates the first y-grid
    axis().bounds = (2, 8) # set bounds for all grids


Tools
-----

Bokeh comes with a number of interactive tools. The are typically activated
through the toolbar above plots, although some can be activated by keypresses
or specific mouse movement.

Tools are added to plots with the ``tools`` keyword argument, which has as its
value a comma separated string listing the tools to add to the plot, for example::

    tools = "pan,wheel_zoom,box_zoom,reset,resize,crosshair,select,previewsave,embed"

PanTool
'''''''
The pan tool (``'pan'``) pans the plot on left-click drag. It can be made the active tool
by clicking its button on the tool bar, however it also automatically activates on left-click
drag whenever there is no other active tool.

WheelZoomTool
'''''''''''''
The wheel zoom tool (``'wheel_zoom'``) will zoom the plot in and out, centered on the current
mouse location.  It can be made the active tool by clicking its button on the tool bar, however
it also automatically activates when the ``Shift`` key is depressed.

BoxZoomTool
'''''''''''
The box zoom tool (``'box_zoom'``) will zoom the plot in to the box region that a user
selects with left drag while it is the active tool.

ResetTool
'''''''''
The reset tool (``'reset'``) will restore the plot ranges to their original values.

ResizeTool
''''''''''
The resize tool (``'resize'``) allows the user to left drag to resize the entire plot while
it is the active tool.

PreviewSaveTool
'''''''''''''''
The preview-save tool (``'previewsave'``) pops up a modal dialog that allows the user to save
a PNG image if the plot.

EmbedTool
'''''''''
The embed tool (``'embed'``) tool pops up a modal dialog containing a javascript ``<script>``
snippet that can put int HTML pages to display the plot.

CrosshairTool
'''''''''''''
Th crosshair tool (``'crosshair'``) draws a crosshair annotation over the plot, centered on
the current mouse position.

BoxSelectTool
'''''''''''''
The box selection tool (``'select'``) allows the user to define a rectangular selection
region be left-dragging on the plot. The indicies of the data points in the selection
region are stored on the data source as the current selection. If other plots share this
datasource, then they will render a linked selection. This selection is also available
from python when using server-based output.

Embedding
---------
Coming soon!

Animated Plots
--------------

While a sophisticated animation API is planned for Bokeh, it is already possible to create animated
plots just by updating a glyph's data source periodically. This requires running ``bokeh-server`` so
that plots are notified of the updates to the data. Below is a video capture of an animated
plot in the ipython notebook (which may be found in ``examples/plotting/notebook``).

.. image:: /_images/animated.gif
    :align: center

Note that all the tools, zoom, pan, resize function normally and the plot continues to animate while
the tools are used. Currently in order to animate, you must grab the glyph renderer off a plot, update
its data source and set the dirty flag, then store the data source on the session. The code to animate
the above plot is shown here::

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
            ds._dirty = True
            session().store_obj(ds)
            time.sleep(.5)

This is somewhat clunky, but improvements and simplifications are planned for the 0.4 release and after.


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

    drug_color = {
        "Penicillin"   : "#0d3362",
        "Streptomycin" : "#c64737",
        "Neomycin"     : "black",
    }

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
        width=width, height=height, title="", tools="", x_axis_type=None, y_axis_type=None
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
