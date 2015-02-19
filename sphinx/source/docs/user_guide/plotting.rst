.. _userguide_plotting:

Basic Plotting
==============

.. contents::
    :local:
    :depth: 2

At a Glance
-----------

.. warning::
    The plotting api was recently changed as of version 0.7. Some old functions (for
    instance, ``hold``) are now deprecated but still function. They will be completely
    removed in the next release. Using  ``python -Wd`` when running Bokeh code will enable
    printing of deprecation warnings.

To access the ``plotting.py`` interface:

.. code-block:: python

    # Clean alias
    import bokeh.plotting as bk

    # Alternatively, import plotting functions into the namespace
    from bokeh.plotting import *

To select an output mode:

.. code-block:: python

    # Plots can be displayed inline in an IPython Notebook
    bk.output_notebook()

    # They can also be saved to file
    bk.output_file("output_filename.html", title="Hello World!")

To create a new Bokeh plot (with optional plot parameters) use the ``figure`` function:

.. code-block:: python

    p = bk.figure(plot_width=600, # in units of px
                  plot_height=600,
                  title="Hello World!")

The plot objects returned by ``figure`` have methods on them for plotting all the different kinds of glyphs. A simple and common glyph is the line:

.. code-block:: python

    xs = [0,1,2,3,4,5]
    ys = [x**2 for x in xs]

    p.line(xs, ys, line_width=2)

.. note::

    At the moment, the glyph functions are vectorized by default.
    If you want to plot a single glyph, you will still have to pass in
    the parameters as a list. For example: ``p.circle([0], [0], radius=[1])``.

To add subsequent glyphs on the same plot, use glyph methods on that plot:

.. code-block:: python

    p.rect(x, y, w, h)
    p.circle(x, y)

To save a plot to file:

.. code-block:: python

    # Assuming you have already declared `output_file()` above
    bk.save(obj=p)

To show a plot:

.. code-block:: python

    bk.show(p)

In Depth
--------

Setup
~~~~~

Begin by importing ``bokeh.plotting`` into your namespace. In this guide
it is aliased to ``bk`` for clarity.

.. code-block:: python

   import bokeh.plotting as bk

Then choose an output mode—see
`Session Management <http://bokeh.pydata.org/docs/reference.html#session-management>`_
for more information. If you are in an IPython Notebook and want to display plots inline:

.. code-block:: python

   bk.output_notebook()

Else, if you are in a script and want to save these plots to file:

.. code-block:: python

    bk.output_file("output_filename.html", title="Hello World!")

Subsequent calls to ``save()`` and ``show()`` will depend on the
output mode.

Composition
~~~~~~~~~~~

Bokeh plots are composed of "glyphs", which are semi-primitive visual markers.
Each glyph has specified parameters for placement and styling. You can refer
to :ref:`bokeh.models.glyphs` and :ref:`bokeh.models.markers` to see all the
glyphs that are currently supported, and to :ref:`bokeh_plotting_plots`
to see how they are configured for the ``plotting.py`` interface.

.. note::
    Parameters are *not* completely uniform across glyphs. for example, a ``rect``
    glyph requires x- and y-coordinates (to define the center point) as well as
    ``width`` and ``height`` parameters, while the ``quad`` glyph takes a parameter
    each for the ``left``, ``right``, ``top``, and ``bottom`` sides of a ``quad``:

.. code-block:: python

    zeros = [0] * len(xs)
    ones = [1] * len(xs)

    p.rect(xs,    # x-coordinates
           ys,    # y-coordinates
           ones,  # widths
           ones,  # heights
           fill_color="steelblue")

    p.quad(xs[:-1],    # left
           xs[1:],     # right
           ys[:-1],    # top
           ones[:-1],  # bottom
           fill_color="crimson")

Each glyph also has a number of styling properties (see :ref:`userguide_objects_styling`),
with the associated prefixes ``line_``, ``fill_``, and ``text_``:

.. code-block:: python

    p.circle(xs, ys,
             size=ys, # px
             fill_alpha=0.5,
             fill_color="steelblue",
             line_alpha=0.8,
             line_color="crimson")


Many glyphs have both line and fill properties that can be set in unison by dropping the prefix:

.. code-block:: python

    p.circle(xs, ys,
             size=ys, # px
             alpha=0.5,
             color="steelblue")

Output
~~~~~~

Bokeh plots can be saved to file, persisted to the server, or displayed inline in an IPython Notebook.

To save the current plots to file:

.. code-block:: python

    # If you have already declared `output_file()` above
    bk.save(obj=p)

    # Else, specify the filename
    bk.save(p, filename="output_filename.html")

To show a plot:

.. code-block:: python

    bk.show(p)
