.. _userguide_quickstart:

Quickstart
##########

Bokeh is an interactive visualization library for modern web browsers. It
provides elegant, concise construction of versatile graphics, and affords
high-performance interactivity over large or streaming datasets. Bokeh can help
anyone who would like to quickly and easily make interactive plots, dashboards,
and data applications.

To offer both simplicity and the powerful and flexible features needed for
advanced customizations, Bokeh exposes two interface levels to users:

|bokeh.models|
    A *low-level* interface that provides the most flexibility to
    application developers.

|bokeh.plotting|
    A *higher-level* interface centered around composing visual glyphs.

This Quickstart focuses on the |bokeh.plotting| interface.

.. _userguide_quickstart_install:

Installation
============

There are multiple ways to install Bokeh, and we recommend the easiest one,
which is to use the `Anaconda Python distribution`_ and enter this command at
a Bash or Windows command prompt:

.. code-block:: sh

    conda install bokeh

This installs all the dependencies that Bokeh needs. Anaconda minimizes
installation effort on all platforms and configurations, including Windows,
and also installs the examples into the ``examples/`` subdirectory of your
Anaconda or Miniconda installation directory.

If you are confident that you have installed all needed dependencies, such as
NumPy, you may instead use ``pip`` at the command line:

.. code-block:: sh

    pip install bokeh

.. note::
    The ``pip`` method does not install the examples. Clone the Git repository
    and look in the ``examples/`` directory of the checkout to see examples.

.. _userguide_quickstart_getting_started:

Getting Started
===============

Bokeh is a large library that exposes many capabilities, so this section is
only a quick tour of some common Bokeh use cases and workflows. For more
detailed information please consult the full :ref:`userguide`.

Let's begin with some examples.

Plotting data in basic Python lists as a line plot, including zoom,
pan, save, and other tools, is simple and straightforward:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [6, 7, 2, 4, 5]

    # output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="simple line example", x_axis_label='x', y_axis_label='y')

    # add a line renderer with legend and line thickness
    p.line(x, y, legend_label="Temp.", line_width=2)

    # show the results
    show(p)

When you execute this script, you will see that a new output file
``"lines.html"`` is created and that a browser automatically opens a new tab
to display it (for presentation purposes we have included the plot output
directly inline in this document).

The basic steps to creating plots with the |bokeh.plotting| interface are:

Prepare some data
    In this case, plain Python lists, but NumPy arrays or Pandas series also
    work.

Tell Bokeh where to generate output
    In this case, using |output_file|, with the filename ``"lines.html"``.
    Another option is |output_notebook| for use in Jupyter notebooks.

Call |figure|
    This creates a plot with typical default options and easy customization
    of title, tools, and axes labels.

Add renderers
    In this case, we use |Figure.line| for our data, specifying visual
    customizations like colors, legends, and widths.

Ask Bokeh to |show| or |save| the results
    These functions save the plot to an HTML file and optionally display it in
    a browser.

Steps three and four can be repeated to create more than one plot, as shown in
some of the examples below.

The |bokeh.plotting| interface is also quite handy if we need to customize
the output a bit more by adding more data series, glyphs, logarithmic axis,
and so on. It's easy to combine multiple glyphs together on one plot, as shown
below:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
    y0 = [i**2 for i in x]
    y1 = [10**i for i in x]
    y2 = [10**(i**2) for i in x]

    # output to static HTML file
    output_file("log_lines.html")

    # create a new plot
    p = figure(
       tools="pan,box_zoom,reset,save",
       y_axis_type="log", y_range=[0.001, 10**11], title="log axis example",
       x_axis_label='sections', y_axis_label='particles'
    )

    # add some renderers
    p.line(x, x, legend_label="y=x")
    p.circle(x, x, legend_label="y=x", fill_color="white", size=8)
    p.line(x, y0, legend_label="y=x^2", line_width=3)
    p.line(x, y1, legend_label="y=10^x", line_color="red")
    p.circle(x, y1, legend_label="y=10^x", fill_color="red", line_color="red", size=6)
    p.line(x, y2, legend_label="y=10^x^2", line_color="orange", line_dash="4 4")

    # show the results
    show(p)

.. _userguide_quickstart_notebooks:

Jupyter Notebooks
=================

At this point we should mention Jupyter notebooks.

Jupyter notebooks are a common tool for exploratory data analysis, widely
used across the PyData community. Bokeh integrates seamlessly with Jupyter
notebooks. To view the above examples in a notebook, you would only
change |output_file| to |output_notebook| instead.

You can interact directly with `live tutorial notebooks`_ hosted online by
MyBinder. Static versions of these may be viewed at the
`Bokeh NBViewer Gallery`_.

The `Bokeh GitHub repository`_ also has a number of example notebooks in the
``examples/howto`` directory. After cloning the repository, navigate there and run:

.. code-block:: sh

    jupyter notebook

You can open and interact with any of the notebooks listed on the index page
that automatically opens up. In particular, you might check out these examples,
which show how Bokeh can be used together with Jupyter interactive widgets:

:bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb`
    A basic example that combines Bokeh's interactive capabilities with
    Jupyter's dropdowns and sliders.

:bokeh-tree:`examples/howto/notebook_comms/Numba Image Example.ipynb`
    A more advanced example that uses Numba to efficiently perform image
    processing interactively based on Jupyter widget controls.

.. note::

    **Bokeh plots will not display inline in GitHub notebook previews**. Bokeh
    plots use JavaScript code to render, but GitHub scrubs all JavaScript from
    previewed content.

.. _userguide_quickstart_sample_data:

Sample Data
===========

Some of the examples included in the Bokeh source make use of sample data files
that are distributed separately. To download this data, execute the following
commands at a Bash or Windows command prompt:

.. code-block:: sh

    bokeh sampledata

For more information see the |bokeh.sampledata| reference.

.. _userguide_quickstart_concepts:

Concepts
========

Let's consider the plots above, and use them to help define some core concepts.

Plot
----

Plots are a central concept in Bokeh. They are containers that hold all the
various objects (renderers, guides, data, and tools) that comprise the final
visualization that is presented to users. The |bokeh.plotting| interface
provides a |figure| function to help with assembling all the necessary objects.

Glyphs
------

Glyphs are the basic visual marks that Bokeh can display. At the lowest level,
there are **glyph objects**, such as |Line|. If you are using the low-level
|bokeh.models| interface, it is your responsibility to create and coordinate
all the various Bokeh objects, including glyph objects and their data sources.
To make life easier, the |bokeh.plotting| interface exposes higher-level
**glyph methods** such as the |Figure.line| method used in the first example.
The second example also adds in calls to |Figure.circle| to display circle
and line glyphs together on the same plot. Besides lines and circles, Bokeh
makes many additional |glyphs| and |markers| available.

The visual appearance of a glyph is tied directly to the data values that are
associated with the glyph's various attributes. In the example above we see
that positional attributes like `x` and `y` can be set to vectors of data.
But glyphs also have some combination of |line_props|, |fill_props|, and
|text_props| to control their appearance. All of these attributes can be set
with "vectorized" values as well. We will show examples of this below.

Guides and Annotations
----------------------

Bokeh plots can also have other visual components that aid presentation or
help the user make comparisons. These fall into two categories. **Guides**
are visual aids that help users judge distances, angles, etc. These include
grid lines or bands, axes (such as linear, log, or datetime) that may have
ticks and tick labels as well. **Annotations** are visual aids that label or
name parts of the plot. These include titles, legends, etc.

Ranges
------

Ranges describe the data-space bounds of a plot. By default, plots generated
with the |bokeh.plotting| interface come configured with
:class:`DataRange1d <bokeh.models.ranges.DataRange1d>` objects that try to
automatically set the plot bounds to encompass all the available data.
But it is possible to supply explicit
:class:`Range1d <bokeh.models.ranges.Range1d>` objects for fixed bounds.
As a convenience, these can also typically be spelled as 2-tuples or lists::

    p = figure(x_range=[0,10], y_range=(10, 20))

Resources
---------

To generate plots, the client library BokehJS JavaScript and CSS code must
be loaded into the browser. By default, the |output_file| function will
load BokehJS from ``cdn.bokeh.org``. However, you can also configure Bokeh
to generate static HTML files with BokehJS resources embedded directly inside,
by passing the argument ``mode="inline"`` to the |output_file| function.

More Examples
=============

Here are a few more examples to demonstrate other common tasks and use cases
with the |bokeh.plotting| interface.

.. _userguide_quickstart_vectorized:

Vectorized Colors and Sizes
---------------------------

This example shows how it is possible to provide sequences of data values for
glyph attributes like ``fill_color`` and ``radius``. Other things to look out
for in this example:

* supplying an explicit list of tool names to |figure|
* fetching BokehJS resources from CDN using the ``mode`` argument
* setting the ``x_range`` and ``y_range`` explicitly
* turning a line *off* (by setting its value to ``None``)
* using NumPy arrays for supplying data

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    N = 4000
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = [
        "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
    ]

    # output to static HTML file (with CDN resources)
    output_file("color_scatter.html", title="color_scatter.py example", mode="cdn")

    TOOLS = "crosshair,pan,wheel_zoom,box_zoom,reset,box_select,lasso_select"

    # create a new plot with the tools above, and explicit ranges
    p = figure(tools=TOOLS, x_range=(0, 100), y_range=(0, 100))

    # add a circle renderer with vectorized colors and sizes
    p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    # show the results
    show(p)

.. _userguide_quickstart_linked:

Linked Panning and Brushing
---------------------------

Linking together various aspects of different plots can be a useful technique
for data visualization. In Bokeh, such linkages are typically accomplished by
*sharing* some plot component between plots. Below is an example that
demonstrates **linked panning** (where changing the range of one plot causes
others to update) by sharing range objects between the plots. Some other
things to look out for in this example:

* calling |figure| multiple times to create multiple plots
* using |gridplot| to arrange several plots in an array
* showing new glyphs using new glyph methods |Figure.triangle| and
  |Figure.square|
* hiding the toolbar by setting ``toolbar_location`` to ``None``
* setting convenience arguments ``color`` (sets both ``line_color`` and
  ``fill_color``) and ``alpha`` (sets both ``line_alpha`` and
  ``fill_alpha``)

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.layouts import gridplot
    from bokeh.plotting import figure, output_file, show

    # prepare some data
    N = 100
    x = np.linspace(0, 4*np.pi, N)
    y0 = np.sin(x)
    y1 = np.cos(x)
    y2 = np.sin(x) + np.cos(x)

    # output to static HTML file
    output_file("linked_panning.html")

    # create a new plot
    s1 = figure(width=250, plot_height=250, title=None)
    s1.circle(x, y0, size=10, color="navy", alpha=0.5)

    # NEW: create a new plot and share both ranges
    s2 = figure(width=250, height=250, x_range=s1.x_range, y_range=s1.y_range, title=None)
    s2.triangle(x, y1, size=10, color="firebrick", alpha=0.5)

    # NEW: create a new plot and share only one range
    s3 = figure(width=250, height=250, x_range=s1.x_range, title=None)
    s3.square(x, y2, size=10, color="olive", alpha=0.5)

    # NEW: put the subplots in a gridplot
    p = gridplot([[s1, s2, s3]], toolbar_location=None)

    # show the results
    show(p)

Although the toolbar is hidden, the pan tool is still present and active. Click
and drag the above plots to pan them, and see how their ranges are linked
together.

Another linkage that is often useful is **linked brushing** (where a selection
on one plot causes a selection to update on other plots). Below is an example
that demonstrates linked brushing by sharing a |ColumnDataSource| between two
plots:

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *
    from bokeh.models import ColumnDataSource

    # prepare some date
    N = 300
    x = np.linspace(0, 4*np.pi, N)
    y0 = np.sin(x)
    y1 = np.cos(x)

    # output to static HTML file
    output_file("linked_brushing.html")

    # NEW: create a column data source for the plots to share
    source = ColumnDataSource(data=dict(x=x, y0=y0, y1=y1))

    TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select,lasso_select"

    # create a new plot and add a renderer
    left = figure(tools=TOOLS, width=350, height=350, title=None)
    left.circle('x', 'y0', source=source)

    # create another new plot and add a renderer
    right = figure(tools=TOOLS, width=350, height=350, title=None)
    right.circle('x', 'y1', source=source)

    # put the subplots in a gridplot
    p = gridplot([[left, right]])

    # show the results
    show(p)

Choose the box or lasso select tool, and click and drag to make a
selection on one plot, which will update the selection on the other
plot.

.. _userguide_quickstart_datetime:

Datetime Axes
-------------

Dealing with date and time series is another common task. Bokeh has a
sophisticated |DatetimeAxis| that can change the displayed ticks based
on the current scale of the plot. There are some inputs for which Bokeh
will automatically default to |DatetimeAxis|, but you can always
explicitly ask for one by passing the value ``"datetime"`` to the
``x_axis_type`` or ``y_axis_type`` parameters to |figure|. A few things
of interest to look out for in this example:

* setting the ``plot_width`` and ``plot_height`` arguments to |figure|
* customizing plots and other objects by assigning values to their attributes
* accessing guides and annotations with convenience |Figure| attributes:
  |legend|, |grid|, |xgrid|, |ygrid|, |axis|, |xaxis|, |yaxis|

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, output_file, show
    from bokeh.sampledata.stocks import AAPL

    # prepare some data
    aapl = np.array(AAPL['adj_close'])
    aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

    window_size = 30
    window = np.ones(window_size)/float(window_size)
    aapl_avg = np.convolve(aapl, window, 'same')

    # output to static HTML file
    output_file("stocks.html", title="stocks.py example")

    # create a new plot with a datetime axis type
    p = figure(plot_width=800, plot_height=350, x_axis_type="datetime")

    # add renderers
    p.circle(aapl_dates, aapl, size=4, color='darkgrey', alpha=0.2, legend_label='close')
    p.line(aapl_dates, aapl_avg, color='navy', legend_label='avg')

    # NEW: customize by setting attributes
    p.title.text = "AAPL One-Month Average"
    p.legend.location = "top_left"
    p.grid.grid_line_alpha = 0
    p.xaxis.axis_label = 'Date'
    p.yaxis.axis_label = 'Price'
    p.ygrid.band_fill_color = "olive"
    p.ygrid.band_fill_alpha = 0.1

    # show the results
    show(p)

.. _userguide_quickstart_server:

Bokeh Applications
==================

Bokeh also comes with an optional server component, the Bokeh Server. It is
possible to create many interesting and interactive visualizations without
using the Bokeh server, as we have seen above. However, the Bokeh server
affords many novel and powerful capabilities, including:

* UI widgets and plot selections driving computations and plot updates.
* Intelligent server-side downsampling of large datasets.
* Streaming data automatically updating plots.
* Sophisticated glyph re-writing and transformations for "Big Data".
* Plot and dashboard publishing for wider audiences.

Details of Bokeh server usage require more space than a Quickstart allows,
but you can see (and interact with) a simple Bokeh server app below:

.. raw:: html

    <div>
    <iframe
        src="https://demo.bokeh.org/sliders"
        frameborder="0"
        style="overflow:hidden;height:460px;width: 120%;
        -moz-transform: scale(0.85, 0.85);
        -webkit-transform: scale(0.85, 0.85);
        -o-transform: scale(0.85, 0.85);
        -ms-transform: scale(0.85, 0.85);
        transform: scale(0.85, 0.85);
        -moz-transform-origin: top left;
        -webkit-transform-origin: top left;
        -o-transform-origin: top left;
        -ms-transform-origin: top left;
        transform-origin: top left;"
        height="460"
    ></iframe>
    </div>

More examples of hosted Bokeh applications can be found in the
:ref:`gallery_server_examples` section of the :ref:`gallery`. For
information about how to use the server and write Bokeh server plots
and apps, consult the :ref:`userguide_server` section of the
:ref:`userguide`.

.. _userguide_quickstart_next:

What's Next?
============

This Quickstart barely scratches the surface of Bokeh's capabilities.

For more information about the different plotting APIs Bokeh offers,
using the Bokeh server, and how to embed Bokeh plots in your own apps and
documents, check out the :ref:`userguide`. For detailed information about
all modules, classes, models, and objects, consult the :ref:`refguide`.
If you are interested in learning how to build and develop Bokeh, or for
information about how to create a new language binding, see the
:ref:`devguide` Guide.

To see ready-made examples of how you might use Bokeh with your own data,
check out the :ref:`gallery`. To see detailed examples and walkthroughs as
well as find exercises for learning Bokeh by doing, work through the
`live tutorial notebooks`_.

For questions and technical assistance, come join the `Bokeh Discourse`_.

Visit the `Bokeh GitHub repository`_ and try the examples.

Be sure to follow us on Twitter `@bokeh <Twitter_>`_!

.. _Anaconda Python distribution: http://anaconda.com/anaconda
.. _Bokeh GitHub repository: https://github.com/bokeh/bokeh
.. _Bokeh Discourse: https://discourse.bokeh.org
.. _Bokeh NBViewer Gallery: http://nbviewer.ipython.org/github/bokeh/bokeh-notebooks/blob/master/index.ipynb
.. _live Tutorial notebooks: https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb
.. _Twitter: https://twitter.com/bokeh

.. |bokeh.models|   replace:: :ref:`bokeh.models <bokeh.models>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <userguide_plotting>`
.. |bokeh.sampledata| replace:: :ref:`bokeh.sampledata <bokeh.sampledata>`

.. |glyphs|  replace:: :ref:`glyphs <bokeh.models.glyphs>`
.. |markers| replace:: :ref:`markers <bokeh.models.markers>`

.. |figure| replace:: :func:`~bokeh.plotting.figure`
.. |Figure| replace:: :class:`~bokeh.plotting.Figure`

.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`

.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |DatetimeAxis|     replace:: :class:`~bokeh.models.axes.DatetimeAxis`
.. |Line|             replace:: :class:`~bokeh.models.glyphs.Line`

.. |Figure.circle|   replace:: :func:`~bokeh.plotting.Figure.circle`
.. |Figure.line|     replace:: :func:`~bokeh.plotting.Figure.line`
.. |Figure.square|   replace:: :func:`~bokeh.plotting.Figure.square`
.. |Figure.triangle| replace:: :func:`~bokeh.plotting.Figure.triangle`

.. |gridplot| replace:: :func:`~bokeh.layouts.gridplot`

.. |line_props| replace:: :ref:`userguide_styling_line_properties`
.. |fill_props| replace:: :ref:`userguide_styling_fill_properties`
.. |text_props| replace:: :ref:`userguide_styling_text_properties`
