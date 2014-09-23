.. _userguide_plotting:

Basic Plotting
==============

.. contents::
    :local:
    :depth: 2

.. warning::
    The basic plotting interface was originally conceived as a stateful,
    Matlab-style interface. After some experience, it is evident that this
    kind of interface is not ideal, especially in conjunction with the IPython
    Notebook. While most of the material in this section will remain unaffected,
    some aspects of this ``plotting.py`` interface will change in an upcoming
    Bokeh releases.

At a Glance
-----------

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

To declare a new Bokeh plot (with optional plot parameters):

.. code-block:: python

    bk.figure(plot_width=600, # in units of px
               plot_height=600,
               title="Hello World!")

To plot subsequent glyphs on the same plot:

.. code-block:: python

    bk.hold()

A simple and common glyph is the line:

.. code-block:: python
    
    xs = [0,1,2,3,4,5]
    ys = [x**2 for x in xs]
    
    bk.line(xs, ys, line_width=2)

.. note::

    At the moment, the glyph functions are vectorized by default.
    If you want to plot a single glyph, you will still have to pass in
    the parameters as a list. For example: ``bk.circle([0], [0], radius=[1])``.

To save a plot to file:

.. code-block:: python
    
    # Assuming you have already declared `output_file()` above
    bk.save()

To show a plot:

.. code-block:: python

    bk.show()


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
Each glyph has specified parameters for placement and styling.
You can refer to the
`Bokeh Glyph Quick Reference <http://bokeh.pydata.org/docs/glyphs_ref.html>`_
to see all the glyphs that are currently supported, and to the
`Glyph Functions <http://bokeh.pydata.org/docs/reference.html#glyphs-functions>`_
section to see how they are configured for the ``plotting.py`` interface.

N.B.: Placement syntax is *not* uniform across glyphs—for example,
a ``rect`` glyph requires x- and y-coordinates (to define the center point)
as well as ``width`` and ``height`` parameters, while the ``quad`` glyph
takes a parameter each for the ``left``, ``right``, ``top``, and ``bottom``
sides of a quadrangle:

.. code-block:: python

    zeros = [0] * len(xs)
    ones = [1] * len(xs)

    bk.rect(xs,    # x-coordinates
             ys,    # y-coordinates
             ones,  # widths
             ones,  # heights
             fill_color="steelblue")

    bk.quad(xs[:-1],    # left
             xs[1:],     # right
             ys[:-1],    # top
             ones[:-1],  # bottom
             fill_color="crimson")

Each glyph also has a number of styling properties (see :ref:`userguide_objects_styling`),
with the associated prefixes ``line_``, ``fill_``, and ``text_``:

.. code-block:: python
    
    bk.circle(xs, ys,
               size=ys, # px
               fill_alpha=0.5,
               fill_color="steelblue",
               line_alpha=0.8,
               line_color="crimson")


Many glyphs have both line and fill properties that can be set in unison by dropping the prefix:

.. code-block:: python

    bk.circle(xs, ys,
               size=ys, # px
               alpha=0.5,
               color="steelblue")

Output
~~~~~~

Bokeh plots can be saved to file, persisted to the server, or displayed inline in an IPython Notebook.

To save the current plots to file:

.. code-block:: python
    
    # If you have already declared `output_file()` above
    bk.save()

    # Else, specify the filename
    bk.save(filename="output_filename.html")

To show a plot:

.. code-block:: python

    bk.show()
