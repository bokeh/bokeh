.. _userguide_bokehjs:

Developing with JavaScript
==========================

BokehJS is a client-side library that lets you create interactive plots and
applications. It takes care of drawing, rendering, and event handling. The 
Bokeh Python library (and libraries for other languages such as R, Scala, 
and Julia) enables convenient high-level interaction with BokehJS, so you 
don't have to worry about JavaScript or web development.

However, BokehJS also has its own API that lets you do pure JavaScript development 
using BokehJS directly. Additionally, :ref:`userguide_extensions` with custom 
models typically require direct interaction with BokehJS.

.. warning::
    The BokehJS APIs is still in development and may undergo changes in future
    releases.

Obtaining BokehJS
-----------------

BokehJS is available via CDN and ``npm``. See the :ref:`install_bokehjs`
section of the :ref:`installation` page for more details.


.. _userguide_bokehjs_models:

Low-level models
----------------

Generally, the low-level models for plots and applications (e.g. guides,
glyphs, widgets) match the Bokeh Python models exactly. The :ref:`refguide`
is therefore the primary reference for BokehJS models, even though it
focuses on Python.

Whereas the Python library is organized hierarchically, JavaScript models 
are all in one flat ``Bokeh`` module. Typically any Python ``ClassName`` 
is available as ``Bokeh.ClassName`` in JavaScript. For a complete list 
of JavaScript models, see :bokeh-tree:`bokehjs/src/lib/api/models.ts`.

When creating models in JavaScript, make a JavaScript object of all the 
keyword arguments you'd pass to the Python object initializer. Here is an
example of how to initialize a `Range1d` model in both languages:

• Python

  .. code-block:: python

    xdr = Range1d(start=-0.5, end=20.5)

• JavaScript

  .. code-block:: javascript

    var xdr = new Bokeh.Range1d({ start: -0.5, end: 20.5 });

This pattern works in all similar situations. Once you create a Bokeh model,
you can set its properties in exactly the same way in both languages. For
example, ``xdr.end = 30`` sets the ``end`` value to 30 on the `Range1d` model
above in both Python and JavaScript.

Below is an example that creates a plot with axes, grids, and a line glyph
from scratch. Compare with samples in :bokeh-tree:`examples/models` and 
you'll see that the code in Python and JavaScript is nearly identical at
this level:

.. bokehjs-content::
    :title: Bokeh simple line
    :js_file: docs/user_guide/examples/simple_line.js

.. _userguide_bokehjs_interfaces:

Interfaces
----------

Similar to the Python Bokeh library, BokehJS provides various higher-level
interfaces. These interfaces let you interact with and compose low-level
model objects. The higher-level interfaces comprise ``Bokeh.Plotting`` and
``Bokeh.Charts``.

.. note::
    Starting from version ``0.12.2`` these APIs make up the BokehJS API in
    the ``bokeh-api.js`` file. You'll have to import this file in addition
    to ``bokeh.js`` to enable these APIs.

.. _userguide_bokehjs_interfaces_plotting:

``Bokeh.Plotting``
~~~~~~~~~~~~~~~~~~

The JavaScript ``Bokeh.Plotting`` API is a port of the Python
``bokeh.plotting`` interface. Accordingly, the information in the
:ref:`userguide_plotting` section of the User guide can be a useful
reference in addition to the material provided here.

The JavaScript sample below is very similar to the Python code in
:bokeh-tree:`examples/plotting/file/color_scatter.py`:

.. bokehjs-content::
    :title: Bokeh color scatter

    var plt = Bokeh.Plotting;

    // set up some data
    var M = 100;
    var xx = [];
    var yy = [];
    var colors = [];
    var radii = [];
    for (var y = 0; y <= M; y += 4) {
        for (var x = 0; x <= M; x += 4) {
            xx.push(x);
            yy.push(y);
            colors.push(plt.color(50+2*x, 30+2*y, 150));
            radii.push(Math.random() * 0.4 + 1.7)
        }
    }

    // create a data source
    var source = new Bokeh.ColumnDataSource({
        data: { x: xx, y: yy, radius: radii, colors: colors }
    });

    // make the plot and add some tools
    var tools = "pan,crosshair,wheel_zoom,box_zoom,reset,save";
    var p = plt.figure({ title: "Colorful Scatter", tools: tools });

    // call the circle glyph method to add some circle glyphs
    var circles = p.circle({ field: "x" }, { field: "y" }, {
        source: source,
        radius: radii,
        fill_color: colors,
        fill_alpha: 0.6,
        line_color: null
    });

    // show the plot
    plt.show(p);

.. _userguide_bokehjs_interfaces_charts:

``Bokeh.Charts``
~~~~~~~~~~~~~~~~

The JavaScript ``Bokeh.Charts`` API is a high-level charting interface that 
is unique to BokehJS. The API supports two high-level charts: ``pie`` and ``bar``.

.. _userguide_bokehjs_interfaces_charts_pie:

``Bokeh.Charts.pie``
''''''''''''''''''''

The following lets you create basic pie charts with ``Bokeh.Charts.pie``:

.. code-block:: javascript

    Bokeh.Charts.pie(data, { options })

Where ``data`` is a JavaScript object that has ``labels`` and
``values`` keys and ``options`` is an object that can include
any of the following optional keys:

:``width``: *number* --- chart width in pixels
:``height``: *number* --- chart height in pixels
:``inner_radius``: *number* --- inner radius for wedges in pixels
:``outer_radius``: *number* --- outer radius for wedges in pixels
:``start_angle``: *number* --- start angle for wedges in radians
:``end_angle``: *number* --- end angle for wedges in radians
:``center``: *[number, number]* --- ``(x, y)`` location of the pie center in pixels
:``palette``: *Palette | Array<Color>* --- a named palette or list of colors to color-map the values
:``slice_labels``: *"labels" | "values" | "percentages"* --- what the tooltip should show

By default, plots created with ``Bokeh.Charts.pie`` automatically add a tooltip
and hover policy. Here is an example of a ``pie`` chart and the plot it generates:

.. bokehjs-content::
    :title: Bokeh pie chart

    var plt = Bokeh.Plotting;

    var pie_data = {
        labels: ['Work', 'Eat', 'Commute', 'Sport', 'Watch TV', 'Sleep'],
        values: [8, 2, 2, 4, 0, 8],
    };

    var p1 = Bokeh.Charts.pie(pie_data);
    var p2 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        start_angle: Math.PI / 2
    });
    var p3 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        start_angle: Math.PI / 6,
        end_angle: 5 * Math.PI / 6
    });
    var p4 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        palette: "Oranges9",
        slice_labels: "percentages"
    });

    // add the plot to a document and display it
    var doc = new Bokeh.Document();
    doc.add_root(plt.gridplot(
                     [[p1, p2], [p3, p4]],
                     {plot_width:250, plot_height:250}));
    Bokeh.embed.add_document_standalone(doc, document.currentScript.parentElement);

.. _userguide_bokehjs_interfaces_charts_bar:

``Bokeh.Charts.bar``
''''''''''''''''''''

The following lets you create basic bar charts with ``Bokeh.Charts.bar``:

.. code-block:: javascript

    Bokeh.Charts.bar(data, { options })

Where ``data`` is an array with entries representing rows of a data table.
The first row should contain the column headers. Here is an example of
some sales data from different regions for different years:

.. code-block:: javascript

    var data = [
        ['Region', 'Year', 'Sales'],
        ['East',   2015,    23000 ],
        ['East',   2016,    35000 ],
        ['West',   2015,    16000 ],
        ['West',   2016,    34000 ],
        ['North',  2016,    12000 ],
    ];

Similar to the ``pie`` chart, the ``options`` parameter is an object that 
can include any of the following optional keys:

:``width``: *number* --- chart width in pixels
:``height``: *number* --- chart height in pixels
:``stacked``: *boolean* --- whether the bars should be stacked or not
:``orientation``: *"horizontal" | "vertical"* --- how the bars should be oriented
:``bar_width``: *number* --- width of each bar in pixels
:``palette``: *Palette | Array<Color>* --- a named palette or list of colors to color-map the values
:``axis_number_format``: *string* --- a format string to use for axis ticks

By default, plots created with ``Bokeh.Charts.bar`` automatically add a tooltip
and hover policy. Here is an example of a ``bar`` chart and the plot it generates:

.. bokehjs-content::
    :title: Bokeh bar chart

    var plt = Bokeh.Plotting;

    var bar_data = [
        ['City', '2010 Population', '2000 Population'],
        ['NYC', 8175000, 8008000],
        ['LA', 3792000, 3694000],
        ['Chicago', 2695000, 2896000],
        ['Houston', 2099000, 1953000],
        ['Philadelphia', 1526000, 1517000],
    ];

    var p1 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a"
    });
    var p2 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        stacked: true
    });
    var p3 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        orientation: "vertical"
    });
    var p4 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        orientation: "vertical",
        stacked: true
    });

    plt.show(plt.gridplot([[p1, p2], [p3, p4]], {plot_width:350, plot_height:350}));

Minimal example
---------------

The following basic example shows how to import libraries and 
create and modify plots.

.. bokehjs-content::
    :title: Minimal Example
    :include_html: true
    :disable_codepen: true

    // create a data source to hold data
    var source = new Bokeh.ColumnDataSource({
        data: { x: [], y: [] }
    });

    // make a plot with some tools
    var plot = Bokeh.Plotting.figure({
        title: 'Example of random data',
        tools: "pan,wheel_zoom,box_zoom,reset,save",
        height: 300,
        width: 300
    });

    // add a line with data from the source
    plot.line({ field: "x" }, { field: "y" }, {
        source: source,
        line_width: 2
    });

    // show the plot, appending it to the end of the current section
    Bokeh.Plotting.show(plot);

    function addPoint() {
        // add data --- all fields must be the same length.
        source.data.x.push(Math.random())
        source.data.y.push(Math.random())

        // update the data source with local changes
        source.change.emit()
    }

    var addDataButton = document.createElement("Button");
    addDataButton.appendChild(document.createTextNode("Some data."));
    document.currentScript.parentElement.appendChild(addDataButton);
    addDataButton.addEventListener("click", addPoint);

    addPoint();
    addPoint();
