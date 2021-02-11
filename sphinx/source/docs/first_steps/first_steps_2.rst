.. _first_steps_2:

First steps 2: Adding and customizing renderers
===============================================

In the :ref:`previous first steps guide <first_steps_1>`, you used Bokeh's
:func:`~bokeh.plotting.figure` function to render line charts.

In this section, you will use different renderer functions to create various
other kinds of graphs. You will also customize what your glyphs look like.

Rendering different glyphs
--------------------------

Bokeh's :ref:`plotting <userguide_plotting>` interface supports many different
glyphs, such as lines, bars, hex tiles, or other polygons.

.. seealso::
   A full list of all supported glyph methods is available in Bokeh's reference
   guide for the :func:`~bokeh.plotting.figure` function. For detailed
   information on Bokeh's glyphs, see :ref:`userguide_plotting` in Bokeh's user
   guide.

Rendering circles
^^^^^^^^^^^^^^^^^

Use the :func:`~bokeh.plotting.Figure.circle` function instead of
:func:`~bokeh.plotting.Figure.line` to render circles:

.. code-block:: python

    p.circle(x, y3, legend_label="Objects", line_color="yellow", size=12)

Add the :func:`~bokeh.plotting.Figure.circle` function to your previous
visualization:

.. literalinclude:: examples/first_steps_2_add_circles.py
   :language: python
   :emphasize-lines: 15

.. bokeh-plot:: docs/first_steps/examples/first_steps_2_add_circles.py
    :source-position: none

Rendering bars
^^^^^^^^^^^^^^

Similarly, use the :func:`~bokeh.plotting.Figure.vbar` function to render
vertical bars:

.. code-block:: python

    p.vbar(x=x, top=y2, legend_label="Rate", width=0.5, bottom=0, color="red")

Add the :func:`~bokeh.plotting.Figure.vbar` function to your previous
visualization:

.. literalinclude:: examples/first_steps_2_add_bars.py
   :language: python
   :emphasize-lines: 14

.. bokeh-plot:: docs/first_steps/examples/first_steps_2_add_bars.py
    :source-position: none

.. seealso::
    To learn more about bar graphs and other ways Bokeh handles categorical
    data, see :ref:`userguide_categorical` in the user guide.

Customizing glyphs
------------------

The different renderer functions accept various arguments to control what
your glyphs look like.

Defining properties of new glyphs
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The :func:`~bokeh.plotting.Figure.circle` function, for example, lets you
define aspects like the color or diameter of the circles:

* ``fill_color``: the fill color of the circles
* ``fill_alpha``: the transparency of the fill color (any value between ``0``
  and ``1``)
* ``line_color``: the fill color of the circles' outlines
* ``size``: the size of the circles (in
  :ref:`screen space or data-space units<userguide_styling_units>`)
* ``legend_label``: legend entry for the circles

In Bokeh, you can :ref:`specify colors <userguide_styling_colors>` in several
ways. For example:

* Use one of the named CSS colors (for example, ``"firebrick"``)
* Use hexadecimal values, prefaced with a ``#`` (for example ``"#00ff00"``)
* Use a 3-tuple for RGB colors (for example, ``(100, 100, 255)``
* Use a 4-tuple for RGBA colors (for example ``(100, 100, 255, 0.5)``)

Create circles with the legend label "Objects" and make the circles appear
slightly transparent with a red fill color and blue outlines:

.. literalinclude:: examples/first_steps_2_style_circle.py
   :language: python
   :emphasize-lines: 11-19

.. bokeh-plot:: docs/first_steps/examples/first_steps_2_style_circle.py
    :source-position: none

.. _first_steps_2_altering_existing:

Altering properties of existing glyphs
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you want to change any property after creating an object, you can define
and overwrite the object's attributes directly.

Take the circles from above, for example. You defined the circles to have a
red color by passing the argument ``fill_color="red"``.

To change the color of your circles from red to blue, you first need to assign
a variable name (such as ``circle``) to the new object when you call the
:func:`~bokeh.plotting.Figure.circle` function.

.. code-block:: python

    circle = p.circle(
        x,
        y,
        legend_label="Objects",
        fill_color="red",
        fill_alpha=0.5,
        line_color="blue",
        size=80,
        )

Next, use that variable to access the object's ``glyph`` attribute and change
its properties:

.. code-block:: python

    glyph = circle.glyph
    glyph.fill_color = "blue"

Generate red circles once more, but this time change their color to blue before
outputting the plot:

.. literalinclude:: examples/first_steps_2_style_existing_circle.py
   :language: python
   :emphasize-lines: 22-23

.. bokeh-plot:: docs/first_steps/examples/first_steps_2_style_existing_circle.py
    :source-position: none

.. seealso::
    For more information about the various visual properties, see
    :ref:`userguide_styling_glyphs` and :ref:`userguide_styling_visual_properties`
    in the user guide.

    Each type of glyph has different properties. Refer to
    :func:`~bokeh.plotting.figure` in the reference guide to see all available
    properties for each glyph method.

.. panels::
    :column: col-lg-6 col-md-6 col-sm-6 col-xs-12 p-2

    .. link-button:: first_steps_1.html
        :text: Previous
        :classes: stretched-link

    ---
    :card: + text-right
    .. link-button:: first_steps_3.html
        :text: Next
        :classes: stretched-link
