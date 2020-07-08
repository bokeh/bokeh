.. _userguide_concepts:

Defining Key Concepts
=====================

.. _userguide_glossary:

Glossary
--------

In order to make the best use of this User Guide, it is important to have
context for some high-level concepts and terms. Here is a small glossary of
some of the most important concepts in Bokeh.

----

Application
    A Bokeh application is a recipe for generating Bokeh documents. Typically,
    this is Python code run by a Bokeh server when new sessions are created.

BokehJS
    The JavaScript client library that actually renders the visuals and
    handles the UI interactions for Bokeh plots and widgets in the browser.
    Typically, users will not have to think about this aspect of Bokeh
    much *("We write the JavaScript, so you don't have to!")* but it is
    good to have basic knowledge of this dichotomy. For full details, see
    the :ref:`devguide_bokehjs` chapter of the :ref:`devguide` Guide.

Documents
    An organizing data structure for Bokeh applications. Documents
    contain all the Bokeh Models and data needed to render an interactive
    visualization or application in the browser.

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
    The Bokeh server is an optional component that can be used for sharing
    and publishing Bokeh plots and apps, for handling streaming of large data
    sets, or for enabling sophisticated user interactions based off of widgets
    and selections. See :ref:`userguide_server` for more explanation.

Widgets
    User interface elements outside of a Bokeh plot such as sliders, drop down
    menus, buttons, etc. Events and updates from widgets can inform additional
    computations, or cause Bokeh plots to update. Widgets can be used in both
    standalone applications or with the Bokeh server. For examples and
    information, see :ref:`userguide_interaction`.

----

.. _userguide_output_methods:

Output Methods
--------------

As we will see demonstrated frequently throughout the User Guide, there are
various ways to generate output for Bokeh documents. The most common for
interactive usage are:

``output_file``
    For generating simple standalone HTML documents for Bokeh visualizations.

``output_notebook``
    For displaying Bokeh visualizations inline in Jupyter/Zeppelin notebook cells.

These functions are most often used together with the ``show`` or ``save``
functions. Scripts that output with these typically look something like:

.. code-block:: python

    from bokeh.plotting import figure, output_file, show

    output_file("output.html")

    p = figure()
    p.line(x=[1, 2, 3], y=[4,6,2])

    show(p)

If this script is called ``foo.py`` then executing ``python foo.py`` will
result in an HTML file ``output.html`` being generated with the line plot.
These functions are often useful in interactive settings, or for creating
standalone Bokeh documents to serve from (Flask, Django, etc.) web
applications.

However, Bokeh also comes with a powerful command line tool ``bokeh`` that
can also be used to generate various kinds of output:

``bokeh html``
    Create standalone HTML documents from any kind of Bokeh application
    source: e.g., python scripts, app directories, JSON files, and others.

``bokeh json``
    Generate a serialized JSON representation of a Bokeh document from any
    kind of Bokeh application source.

``bokeh serve``
    Publish Bokeh documents as interactive web applications.

An advantage of using the ``bokeh`` command is that the code you write does not
have to specify any particular output method or format. You can write *just the
visualization code* once, and decide later to output in different ways. The
above example would be simplified to:

.. code-block:: python

    from bokeh.plotting import figure, curdoc

    p = figure()
    p.line(x=[1, 2, 3], y=[4,6,2])
    curdoc().add_root(p)

Now, you can run ``bokeh html foo.py`` to generate a standalone HTML file,
or ``bokeh serve foo.py`` to start serving this document as a web application.
For more information on the command line tool see :ref:`userguide_cli`.

.. _userguide_interfaces:

Interfaces
----------

Bokeh is intended to provide a quick and simple interface to data scientists
and domain experts who do not want to be distracted by the details of the
software, and also provide a richly detailed interface to application
developers and software engineers who may want more control or access to more
sophisticated features. Because of this, Bokeh takes a layered approach and
offers different programming interfaces appropriate to different levels
of use. This section provides an overview of the various interfaces
that are available to Bokeh users, as well as more context about the most
important concepts central to the library. If you'd like to jump right
into basic plotting, go to :ref:`userguide_plotting`.

*bokeh.models*
~~~~~~~~~~~~~~

Bokeh is actually composed of two library components.

The first component is a JavaScript library, BokehJS, that runs in the
browser. This library is responsible for all of the rendering and
user interaction. Its input is a collection of declarative JSON objects that
comprise a "scenegraph". The objects in this scenegraph describe everything
that BokehJS should handle: what plots and widgets are present and in what
arrangement, what tools and renderers and axes the plots will have, etc. These
JSON objects are converted into BokehJS Models in the browser, and are
rendered by corresponding BokehJS Views.

The second component is a library in Python (or other languages) that can
generate the JSON described above. In the Python Bokeh library, this is
accomplished at the lowest level by exposing a set of "model" classes
that exactly mirror the set of BokehJS Models that are created in the
browser. These Python model classes know how to validate their content and
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
most users will probably want to use the |bokeh.plotting| interface
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

The main class in the |bokeh.plotting| interface is the |figure| function. This
creates a |Figure| model that includes methods for adding different kinds of
glyphs to a plot. Additionally, it composes default axes, grids, and tools in
the proper way without any extra effort.

A prototypical example of the |bokeh.plotting| usage is show below, along
with the resulting plot:

.. bokeh-plot:: docs/user_guide/examples/concepts_plotting.py
    :source-position: above

The main observation is that the typical usage involves creating plot objects
with the |figure| function, then using the glyph methods like |Figure.circle|
to add renderers for our data. We do not have to worry about configuring any
axes or grids (although we can configure them if we need to), and specifying
tools is done simply with the names of tools to add. Finally, we use some output
functions to display our plot.

There are many other possibilities: saving our plot instead of showing it,
styling or removing the axes or grids, adding additional renderers, and
laying out multiple plots together. The :ref:`userguide_plotting` section of
this :ref:`userguide` will walk through many more examples and common use
cases of using the |bokeh.plotting| interface.

.. _Matlab: http://www.mathworks.com/products/matlab/
.. _Matplotlib: http://matplotlib.org

.. |bokeh.models|   replace:: :ref:`bokeh.models <bokeh.models>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
.. |bokeh.io|       replace:: :ref:`bokeh.io <bokeh.io>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |Rect| replace:: :class:`~bokeh.models.glyphs.Rect`

.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. |figure|          replace:: :func:`~bokeh.plotting.figure`
.. |Figure|          replace:: :class:`~bokeh.plotting.Figure`
.. |Figure.circle|   replace:: :func:`Figure.circle <bokeh.plotting.Figure.circle>`
