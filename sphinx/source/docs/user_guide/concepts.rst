.. _userguide_concepts:

Defining key concepts
=====================

.. _userguide_glossary:

Glossary
--------

The following glossary contains some of the most important concepts in Bokeh
to help you navigate this user guide.

----

Application
    A piece of Python code that the Bokeh server runs when a new session is
    created.

BokehJS
    The JavaScript library that renders visuals and handles UI interactions
    for Bokeh plots and widgets in the browser saving you the neeed write any
    JavaScript yourself. For more details, see the :ref:`devguide_bokehjs`
    chapter of the :ref:`devguide`.

Document
    An organizing data structure for Bokeh applications. Documents contain
    all the models and data you need to render interactive visualizations
    or applications in the browser.

Embedding
    Various methods of including Bokeh plots and widgets in web apps and
    pages, or in Jupyter notebooks. See :ref:`userguide_embed` for more
    informations.

Glyphs
    Basic plot building blocks such as lines, rectangles, squares, wedges,
    or patches. The ``bokeh.plotting`` interface provides a convenient way
    to create plots centered around glyphs. See :ref:`userguide_plotting`
    for more information.

Models
    Low-level objects that make up Bokeh plots. You can access models via
    the ``bokeh.models`` interface. You don't have to manipulate models
    directly to create plots but knowing how to configure their attributes
    and properties can be useful. See :ref:`userguide_styling` for more
    information.

Server
    The Bokeh server is an optional component you can use to share and
    publish Bokeh plots and apps, stream large data sets, or enable complex
    user interactions based on widgets and selections. See
    :ref:`userguide_server` for more information.

Widgets
    User interface elements outside of a Bokeh plot such as sliders, drop down
    menus, and buttons. Events and updates from widgets can inform additional
    computations or update Bokeh plots. Widgets can be used both in standalone
    applications or with the Bokeh server. See :ref:`userguide_interaction` for
    examples and additional information.

----

.. _userguide_output_methods:

Output methods
--------------

Bokeh offers a variety of ways to produce interactive output with the following
two methods being the most common:

``output_file``
    Generate simple standalone HTML documents for Bokeh visualizations.

``output_notebook``
    Display Bokeh visualizations in Jupyter/Zeppelin notebooks.

You'll usually use these methods together with the ``show`` or ``save``
functions. Here's an example.

.. code-block:: python

    from bokeh.plotting import figure, output_file, show

    output_file("output.html")

    p = figure()
    p.line(x=[1, 2, 3], y=[4,6,2])

    show(p)

This script generates an HTML file called ``output.html`` that contains a line
plot. You can execute it with ``python foo.py``, where ``foo.py`` is the name
of the script.

These functions are often useful in interactive settings, or for creating
standalone Bokeh documents to serve from backend web applications.

However, Bokeh also includes a powerful command line tool that likewise lets
you generate various kinds of output.

``bokeh html``
    Create standalone HTML documents from any kind of Bokeh application
    source such as Python scripts, app directories, or JSON files.

``bokeh json``
    Generate a serialized JSON representation of a Bokeh document from any
    kind of Bokeh application source.

``bokeh serve``
    Publish Bokeh documents as interactive web applications.

An advantage of using the ``bokeh`` command is that the code you write does not
have to specify any particular output method or format. You can write *just the
visualization code* and decide how to output later. This simplifies the above
example as follows:

.. code-block:: python

    from bokeh.plotting import figure, curdoc

    p = figure()
    p.line(x=[1, 2, 3], y=[4,6,2])
    curdoc().add_root(p)

You can now run ``bokeh html foo.py`` to generate a standalone HTML file
or ``bokeh serve foo.py`` to start serving this document as a web application.
For more information on the command line tool, see :ref:`userguide_cli`.

.. _userguide_interfaces:

Interfaces
----------

Bokeh provides a simple and intuitive interface for data scientists and domain
experts who do not wish to be distracted by software. It also aims to offer a
rich and detailed interface for application developers and software engineers
who need more control and sophisticated features. To achieve this, Bokeh takes
a layered approach and offers different programming interfaces appropriate to
different users.

This section provides an overview of the various interfaces available to Bokeh
users as well as additional context for the most important concepts. If you'd
like to jump right into basic plotting, go to :ref:`userguide_plotting`.

*bokeh.models*
~~~~~~~~~~~~~~

Bokeh consists of two libraries:

* JavaScript library BokehJS
* Python Bokeh library

The JavaScript library, BokehJS, runs in the browser. This library handles
rendering and user interactions. It takes a collection of declarative JSON
objects as its input and uses them as instructions on how to handle everything:

* plots and widgets,
* layouts and arrangements,
* tools and renderers,
* plot axes,
* etc.

These JSON objects convert into BokehJS models in the browser which renders
them according to corresponding BokehJS views.

The Python library generates these JSON objects from ``model`` classes that
mirror BokehJS models for the browser. These Python ``model`` classes can
validate their content and attributes and serialize themselves to JSON. All
of these models are available from the **low-level** |bokeh.models| interface.

Most of the models are very simple, usually consisting of a few attributes and
no methods. You can configure the attributes either when creating a model or
later by setting attribute values on the model object. Here are some examples
for a |Rect| glyph object:

::

  # configure attributes when creating a model object
  glyph = Rect(x="x", y="y2", w=10, h=20, line_color=None)

  # assign attribute values to an existing model object
  glyph.fill_alpha = 0.5
  glyph.fill_color = "navy"

You can generally configure all Bokeh models this way. Since all Bokeh
interfaces ultimately produce collections of Bokeh models, this lets you
style and configure plots and widgets the same way regardless of the
interface.

The |bokeh.models| interface lets you combine and configure Bokeh plots and
widgets any way you want. However, it doesn't help you assemble the models in
meaningful or correct ways. It is entirely up to you to put them together.

Therefore, unless you have special applicatшons that require finer control,
you will probably want to use the |bokeh.plotting| interface described below.
For more information on Bokeh models, consult the :ref:`refguide`.

.. note::

   The Python library allows for binding with other languages that can produce
   appropriate JSON output. For more details and available bindings, see
   :ref:`devguide_bindings`.

*bokeh.plotting*
~~~~~~~~~~~~~~~~

Bokeh also provides a **mid-level** general purpose |bokeh.plotting| interface.
It lets you focus on relating glyphs to data and assembles sensible plots with
default axes, grids, and tools for you.

The |figure| function is at the core of the |bokeh.plotting| interface. This
function creates a |Figure| model that includes methods for adding different
kinds of glyphs to a plot. Additionally, it properly composes default axes,
grids, and tools without any extra effort.

Below is an example of typical |bokeh.plotting| use along with the resulting
plot:

.. bokeh-plot:: docs/user_guide/examples/concepts_plotting.py
    :source-position: above

Calling the |figure| function is all it takes to create a plot object, and
glyph methods such as |Figure.circle| add data renderers to it. You don't
have to worry about axes and grids (although you can configure them if you
want to), and you only need to list the tools you want to add. Just use an
output function to display your plot.

The interface offers many more possbilities such as:

* saving the plot instead of showing it,
* styling and removing axes and grids,
* applying additional data renderers,
* and arranging multiple plots together.

The :ref:`userguide_plotting` section of this :ref:`userguide` will walk you
through many more examples and common use cases for the |bokeh.plotting|
interface.

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
