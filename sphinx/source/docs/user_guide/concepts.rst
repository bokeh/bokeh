.. _userguide_concepts:

Defining Key Concepts
=====================

.. contents::
    :local:
    :depth: 2

.. _userguide_glossary:

Glossary
--------

In order to make the best use of this User Guide, it is important to have
context for some high level concepts and terms. Here is a small glossary of
some of the most important concepts in Bokeh.

----

BokehJS
   The JavaScript client library that actually renders the visuals and
   handles the UI interactions for Bokeh plots and widgets in the browser.
   Typically, users will not have to think about this aspect of Bokeh
   much *("We write the JavaScript, so you don't have to!")* but it is
   good to have basic knowledge of this dichotomy. For full details, see
   the :ref:`devguide_bokehjs` chapter of the :ref:`devguide`.

Charts
   Schematic statistical plots such as bar charts, horizon plots, time
   series, etc. that may include faceting, grouping, or stacking based on
   the structure of the data. Bokeh provides a high level ``bokeh.charts``
   interface to quickly construct these kinds of plots. See
   :ref:`userguide_charts` for examples and usage.

Embedding
   Various methods of including Bokeh plots and widgets into web apps and
   pages, or the IPython notebook. See :ref:`userguide_embed` for more
   details.

Glyphs
   The basic visual building blocks of Bokeh plots, e.g. lines, rectangles,
   squares, wedges, patches, etc. The ``bokeh.plotting`` interface provides
   a convenient way to create plots centered around glyphs. See
   :ref:`userguide_plotting` for more information.

Models
   The lowest-level objects that comprise Bokeh "scenegraphs". These live
   in the ``bokeh.models`` interface. *Most users will not use this level
   of interface to assemble plots directly.* However, ultimately all Bokeh
   plots consist of collections of models, so it is important to understand
   them enough to configure their attributes and properties. See
   :ref:`userguide_styling` for more information.

Server
   The ``bokeh-server`` is an optional component that can be used for sharing
   and publishing Bokeh plots and apps, for handling streaming of large data
   sets, or for enabling sophisticated user interactions based off of widgets
   and selections. See :ref:`userguide_server` for more explanation.

Widgets
   User interface elements outside of a Bokeh plot such as sliders, drop down
   menus, buttons, etc. Events and updates from widgets can inform additional
   computations, or cause Bokeh plots to update. See :ref:`userguide_interaction`
   for examples and information.

----

.. _userguide_interfaces:

Interfaces
----------

Bokeh is intended to be useful to data-scientists and domain experts, working
at a very high level, as well as to application developers and software
engineers, who may want more control or access to more sophisticated
features. Because of this, Bokeh takes a layered approach and offers
programming interfaces appropriate to different levels, as well as some
compatibility interfaces to make use of existing code from other
libraries. This section provides an overview of the different interfaces
that are available to Bokeh users, as well as more context about the most
important concepts central to the library. If you'd like to jump right
into plotting, go to :ref:`userguide_plotting` or :ref:`userguide_charts`.

*bokeh.models*
~~~~~~~~~~~~~~

Bokeh is actually composed of two library components.

The first component is a JavaScript library, BokehJS, that runs in the
browser. This library is responsible for all of the rendering and
user interaction. Its input is a collection of declarative JSON objects that
comprise a "scenegraph". The objects in this scenegraph describe everything
that BokehJS should handle: what plots and widgets are present and in what
arrangement, what tools and renderers and axes the plots will have, etc. These
JSON objects are converted into Backbone_ Models in the browser, and are
rendered by corresponding Backbone_ Views.

The second component is a library in Python (or |other languages|) that can
generate the JSON described above. In the Python Bokeh library, this is
accomplished at the lowest level by exposing a set of "model" classes
that exactly mirror the set of Backbone_ Models that are created in the
browser. These python model classes know how to validate their content and
attributes, and also how to serialize themselves to JSON. All of
these low level models live in the **low-level** |bokeh.models| interface.
Most of the models are very simple, usually consisting of a few property
attributes and no methods. Model attributes can either be configured when
the model is created, or later by setting attribute values on the model
object. Here are some examples for a |Rect| glyph object:
::

    # properties can be configured when a model object is initialized
    glyph = Rect(x="x", y="y2", w=10, h=20, line_color=None)

    # or by assigning values to attributes on the model later
    glyph.fill_alpha = 0.5
    glyph.fill_color = "navy"

These methods of configuration work in general for all Bokeh models. Because
of that, and because all Bokeh interfaces ultimately produce collections
of Bokeh models, styling and configuring plots and widgets is accomplished
in basically the same way, regardless of which interface is used.

Using the |bokeh.models| interface provides complete control over how Bokeh
plots and Bokeh widgets are put together and configured. However, it provides
no help with assembling the models in meaningful or correct ways. It is
entirely up to developers to build the scenegraph "by hand". For this reason,
most users will probably want to use one of the higher level interfaces
described below, unless they have specialized requirements that necessitate
finer control. For more information about the details of all Bokeh models,
consult the :ref:`refguide`.

*bokeh.plotting*
~~~~~~~~~~~~~~~~

Bokeh provides a **mid-level** general purpose |bokeh.plotting| interface, which
is similar in specificity to Matplotlib_ or Matlab_ style plotting interfaces.
It is centered around having users relate the visual glyphs they would like
to have displayed to their data, and otherwise taking care of putting together
plots with sensible default axes, grids, and tools. All the hard work to
assemble the appropriate Bokeh Models to form a scenegraph
that BokehJS can render is handled automatically.

The main class in the |bokeh.plotting| interface is the |Figure| class. This
is a subclass of the basic |Plot| model, that includes methods for easily
adding different kinds of glyphs to a plot. Additionally it composes default
axes, grids, and tools in the proper way without any extra effort. Typically,
users will want to create |Figure| objects by using the |figure| function.

A prototypical example of the |bokeh.plotting| usage is show below, along
with the resulting plot:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # create a Figure object
    p = figure(width=300, height=300, tools="pan,reset,save")

    # add a Circle renderer to this figure
    p.circle([1, 2.5, 3, 2], [2, 3, 1, 1.5], radius=0.3, alpha=0.5)

    # specify how to output the plot(s)
    output_file("foo.html")

    # display the figure
    show(p)

The main observation is that the typical usage involves creating plots objects
with the |figure| function, then using the glyph methods like |Figure.circle|
to add renderers for our data. We do not have to worry about configuring any
axes or grids (although we can configure them if we need to), and specifying
tools is done simply with the names of tools to add. Finally we use some output
functions to display our plot.

.. note::
    The output functions |output_file| and |show|, etc. are
    defined in the |bokeh.io| module, but are also importable from
    |bokeh.plotting| for convenience.

There are many other possibilities: saving our plot instead of showing it,
styling or removing the axes or grids, adding additional renderers, and
laying out multiple plots together. The :ref:`userguide_plotting` section of
this :ref:`userguide` will walk through many more examples and common use
cases of using the |bokeh.plotting| interface.


*bokeh.charts*
~~~~~~~~~~~~~~

Bokeh also provides a very **high-level** |bokeh.charts| interface for quickly
creating statistical charts. As with |bokeh.plotting|, the main purpose of
the interface is to help simplify the creation of Bokeh object graphs by
encapsulating patterns of assembling Bokeh models. The |bokeh.charts|
interface may also take the additional step of performing necessary
statistical or data processing for the user. The interface presents functions
for common, schematic statistical charts. Additionally, the chart functions
can take care of automatically coloring and faceting based on group structure.

The interface includes chart types such as: |Bar|, |BoxPlot|, |Histogram|,
|Timeseries|, and many others. One simple example using |Scatter| is shown
below:

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Scatter, output_file, show

    # prepare some data, a Pandas GroupBy object in this case
    from bokeh.sampledata.iris import flowers
    grouped = flowers[["petal_length", "petal_width", "species"]].groupby("species")

    # create a scatter chart
    p = Scatter(grouped, title="iris data", width=400, height=400,
                xlabel="petal length", ylabel="petal width", legend='top_left')

    # specify how to output the plot(s)
    output_file("foo.html")

    # display the figure
    show(p)

Important to note is that the same output functions are used across different
interfaces. As with |bokeh.plotting|, the output functions |output_file| and
|show|, etc. that are defined in |bokeh.io|, are also importable from
|bokeh.charts| as a convenience.

other interfaces
~~~~~~~~~~~~~~~~

Bokeh provides some level of Matplotlib_ compatibility, by using the
third-party mplexporter_ library. Although it does not provide 100% coverage
of Matplotlib_ capabilities, it is still quite useful. For instance, in
addition to many Matplotlib_ plots, it is often possible to convert plots
created using the python Seaborn_ and `ggplot.py`_ libraries into Bokeh
plots very easily. There are several examples in the :ref:`gallery`. Here is
a quick example that shows a Seaborn_ plot converted to a Bokeh plot with
just one additional line of code:

.. bokeh-plot::
    :source-position: above

    import numpy as np
    import matplotlib.pyplot as plt
    import seaborn as sns
    from bokeh import mpl
    from bokeh.plotting import show

    # generate some random data
    data = 1 + np.random.randn(20, 6)

    # Use Seaborn and Matplotlib normally
    sns.violinplot(data, color="Set3")
    plt.title("Seaborn violin plot in Bokeh")

    # Convert to interactive Bokeh plot with one command
    show(mpl.to_bokeh(name="violin"))

.. _Backbone: http://backbonejs.org
.. _ggplot.py: https://github.com/yhat/ggplot
.. _Matlab: http://www.mathworks.com/products/matlab/
.. _Matplotlib: http://matplotlib.org
.. _mplexporter: https://github.com/mpld3/mplexporter
.. _Seaborn: http://stanford.edu/~mwaskom/software/seaborn/

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.models|   replace:: :ref:`bokeh.models <bokeh.models>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
.. |bokeh.io|       replace:: :ref:`bokeh.io <bokeh.io>`

.. |other languages| replace:: :ref:`other languages <quickstart_other_languages>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
.. |Rect| replace:: :class:`~bokeh.models.glyphs.Rect`

.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |output_server|   replace:: :func:`~bokeh.io.output_server`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. |figure|          replace:: :func:`~bokeh.plotting.figure`
.. |Figure|          replace:: :class:`~bokeh.plotting.Figure`
.. |Figure.circle|   replace:: :func:`Figure.circle <bokeh.plotting.Figure.circle>`

.. |Bar|        replace:: :func:`~bokeh.plotting.Bar`
.. |BoxPlot|    replace:: :func:`~bokeh.plotting.BoxPlot`
.. |Histogram|  replace:: :func:`~bokeh.plotting.Histogram`
.. |Scatter|    replace:: :func:`~bokeh.plotting.Scatter`
.. |TimeSeries| replace:: :func:`~bokeh.plotting.TimeSeries`
