.. _userguide_annotations:

Adding annotations
==================

Bokeh includes several different types of :term:`annotations <Annotation>` you
can use to add supplemental information to your visualizations.

.. _userguide_annotations_titles:

Titles
------

Use |Title| annotations to add descriptive text which is rendered around
the edges of a plot.

If you use the |plotting interface|, the quickest way to add a basic title is to
pass the text as the ``title`` parameter to |Figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_basic.py
    :source-position: above

The default title is generally located above a plot, aligned to the left.

The title text may value contain newline characters which will result in a
multi-line title.

.. code-block:: python

    p = figure(title="A longer title\nwith a second line underneath")

To define the placement of the title in relation to the plot, use the
``title_location`` parameter. A title can be located above, below, left, or
right of a plot. For example:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_location.py
    :source-position: above

Use your plot's ``.title`` property to customize the default |Title|. Use the
standard |text properties| to define visual properties such as font, border, and
background.

This example uses the ``.title`` property to set the font and background
properties as well as the title text and title alignment:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_visuals.py
    :source-position: above

Note that the ``align`` property is relative to the direction of the text. For
example: If you have placed your title on the left side of your plot, setting
the ``align`` property to ``"left"`` means your text is rendered in the lower
left corner.

To add more titles to your document, you need to create additional |Title|
objects. Use the |add layout| method of your plot to include those additional
|Title| objects in your document:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_additional.py
    :source-position: above

If a title and a :ref:`toolbar <userguide_tools>` are placed on the same side
of a plot, they will occupy the same space:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_toolbar.py
    :source-position: above

If the plot size is large enough, this can result in a more compact plot.
However, if the plot size is not large enough, the title and toolbar may
visually overlap.

.. _userguide_annotations_legends:

Legends
-------

The easiest way to add a legend to your plot is to include any of the
:ref:`legend_label <userguide_annotations_legends_legend_label>`,
:ref:`legend_group <userguide_annotations_legends_legend_group>`,
or :ref:`legend_field <userguide_annotations_legends_legend_field>` properties
when calling glyph methods. Bokeh then creates a |Legend| object for you
automatically.

For more advanced control over a plot's legend, access the |Legend| object
:ref:`directly <userguide_annotations_legends_manual>`.

.. _userguide_annotations_legends_legend_label:

Basic legend label
~~~~~~~~~~~~~~~~~~

To provide a simple explicit label for a glyph, pass the ``legend_label``
keyword argument:

.. code-block:: python

    p.circle('x', 'y', legend_label="some label")

If you assign the same label name to multiple glyphs, all the glyphs will be
combined into a single legend item with that label.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_label.py
    :source-position: above

.. _userguide_annotations_legends_legend_group:

Automatic grouping (Python-side)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your data is in the form of a |ColumnDataSource|, Bokeh can generate legend
entries from strings in one of the ColumnDataSource's columns. This way, you can
create legend entries based on groups of glyphs.

To use data from a column of a ColumnDataSource to generate your plot's legend,
pass the column name as the ``legend_group`` keyword argument to a glyph method:

.. code-block:: python

    p.circle('x', 'y', legend_group="colname", source=source)

Because ``legend_group`` references a column of a ColumnDataSource, you need to
always provide a ``source`` argument to the glyph method as well. Additionally,
the column containing the label names has to be present in the data source at
that point:

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_group.py
    :source-position: above

Using ``legend_group`` means that Bokeh groups the legend entries immediately.
Therefore, any subsequent Python code will be able to see the individual legend
items in the ``Legend.items`` property. This way, you can re-arrange or modify
the legend at any time.

.. _userguide_annotations_legends_legend_field:

Automatic grouping (browser-side)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You also have the option to only group elements within your legend on the
:term:`JavaScript side <BokehJS>`, in the browser. Using browser-side grouping
makes sense if you want to group a column that is only computed on the
JavaScript side, for example.

.. code-block:: python

    p.circle('x', 'y', legend_field="colname", source=source)

In this case, the Python code does *not* see multiple items in ``Legend.items``.
Instead, there is only a single item that represents the grouping, and the
grouping happens in the browser.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_field.py
    :source-position: above

.. _userguide_annotations_legends_item_visibility:

Hiding legend items
~~~~~~~~~~~~~~~~~~~

To manually control the visibility of individual legend items, set the
``visible`` property of a :class:`~bokeh.models.annotations.LegendItem` to
either ``True`` or ``False``.

.. bokeh-plot:: docs/user_guide/examples/plotting_legends_item_visibility.py
    :source-position: above

.. note::
    If all items in a legend are invisible, the entire legend will be hidden.
    Also, if you use
    :ref:`automatic grouping on the browser side <userguide_annotations_legends_legend_field>`
    and set the visibility of a ``legend_field`` item to ``False``, the entire
    group will be invisible.

.. _userguide_annotations_legends_manual:

Manual legends
~~~~~~~~~~~~~~

To build a legend by hand, don't use any of the ``legend`` arguments and instead
assign values to the various properties of a |Legend| object directly.

See :bokeh-tree:`examples/models/file/legends.py` for an example.

Explicit index
~~~~~~~~~~~~~~

To explicitly specify which index into a |ColumnDataSource| to use in a legend,
set the ``index`` property of a :class:`~bokeh.models.annotations.LegendItem`.

This is useful for displaying multiple entries in a legend when you use glyphs
that are rendered in several parts, such as
:class:`~bokeh.models.glyphs.MultiLine`
(:func:`~bokeh.plotting.Figure.multi_line`) or
:class:`~bokeh.models.glyphs.Patches` :func:`~bokeh.plotting.Figure.patches`:

.. bokeh-plot:: docs/user_guide/examples/plotting_legends_multi_index.py
    :source-position: above

Interactive legends
~~~~~~~~~~~~~~~~~~~

You can use legends as interactive elements to control some aspects of the
appearance of your plot. Clicking or tapping on interactive legend entries
controls the visibility of the glyphs associated with the legend entry.

See |interactive legends| in the user guide for more information and examples.

.. note::
    The features of |interactive legends| currently only work on the basic
    legend labels described :ref:`above <userguide_annotations_legends_legend_label>`.
    Legends that are created by specifying a column to automatically group do
    not yet support interactive features.

.. _userguide_annotations_color_bars:

Color bars
----------

To create a |ColorBar|, use an instance of |ColorMapper| containing a color
palette.

Color bars can be located inside as well as left, right, below, or above the
plot. Specify the location of a color bar when adding the |ColorBar| object to
the plot using the |add layout| method.

.. bokeh-plot:: docs/user_guide/examples/plotting_color_bars.py
    :source-position: above

.. _userguide_annotations_arrows:

Arrows
------

You can use |Arrow| annotations to connect glyphs and label annotations. Arrows
can also help highlight plot regions.

Arrows are compound annotations. This means that they use additional |ArrowHead|
objects as their ``start`` and ``end``. By default, the |Arrow| annotation is a
one-sided arrow: The ``end`` property is set to an ``OpenHead``-type arrowhead
(looking like an open-backed wedge style) and the ``start`` property is set to
``None``. If you want to create double-sided arrows, set both the ``start`` and
``end`` properties to one of the available arrowheads.

The available arrowheads are:

.. bokeh-plot:: docs/user_guide/examples/annotations_arrowheads.py
    :source-position: none

Control the appearance of an arrowhead with these properties:

* use the ``size`` property to control the size of any arrowheads
* use the standard |line properties| such as ``line_color`` and ``line_alpha``
  to control the appearance of the outline of the arrowhead.
* use ``fill_color`` and ``fill_alpha`` to control the appearance of the
  arrowhead's inner surface, if applicable.

|Arrow| objects themselves have the standard |line properties|. Set those
properties to control the color and appearance of the arrow shaft. For example:

.. code-block:: python

    my_arrow.line_color = "blue"
    my_arrow.line_alpha = 0.6

Optionally, you can set the ``x_range`` and ``y_range`` properties to make an
arrow annotation refer to additional non-default x- or y-ranges. This works the
same as :ref:`userguide_plotting_twin_axes`.

.. bokeh-plot:: docs/user_guide/examples/plotting_arrow.py
    :source-position: above

.. _userguide_annotations_bands:

Bands
-----

A |Band| annotation is a colored stripe that is dimensionally linked to the data
in a plot. One common use for the band annotation is to indicate uncertainty
related to a series of measurements.

To define a band, use either |screen units| or |data units|.

.. bokeh-plot:: docs/user_guide/examples/plotting_band.py
    :source-position: above

.. _userguide_annotations_box_annotations:

Box annotations
---------------

A |BoxAnnotation| is a rectangular box that you can use to highlight specific
plot regions. Use either |screen units| or |data units| to position a box
annotation.

To define the bounds of these boxes, use the ``left``/``right`` or ``top``/
``bottom`` properties. If you provide only one bound (for example, a ``left``
value but no ``right`` value), the box will extend to the edge of the available
plot area for the dimension you did not specify.

.. bokeh-plot:: docs/user_guide/examples/plotting_box_annotation.py
    :source-position: above

.. _userguide_annotations_polygon_annotations:

Polygon annotations
-------------------

A |PolyAnnotation| is a polygon with vertices in either |screen units| or
|data units|.

To define the polygon's vertices, supply a series of coordinates to the
``xs`` and ``ys`` properties. Bokeh automatically connects the last vertex
to the first to create a closed shape.

.. bokeh-plot:: docs/user_guide/examples/plotting_polygon_annotation.py
    :source-position: above

.. _userguide_annotations_labels:

Labels
------

Labels are rectangular boxes with additional information about glyphs or plot
regions.

To create a single text label, use the |Label| annotation. Those are the most
important properties for this annotation:

* A ``text`` property containing the text to display inside the label.
* ``x`` and ``y`` properties to set the position (in |screen units| or
  |data units|).
* ``x_offset`` and ``y_offset`` properties to specify where to place the label
  in relation to its ``x`` and ``y`` coordinates.
* The standard |text properties| as well as other styling parameters such as
* ``border_line`` and ``background_fill`` properties.

.. code-block:: python

    Label(x=100, y=5, x_units='screen', text='Some Stuff',
          border_line_color='black', border_line_alpha=1.0,
          background_fill_color='white', background_fill_alpha=1.0)

The ``text`` may value contain newline characters which will result in a
multi-line label.

.. code-block:: python

    Label(x=100, y=5, text='A very long label\nwith mutiple lines')

To create several labels at once, use the |LabelSet| annotation. To configure
the labels of a label set, use a data source that contains columns with data for
the labels' properties such as ``text``, ``x`` and ``y``. If you assign a
value to a property such as ``x_offset`` and ``y_offset`` directly instead of a
column name, this value is used for all labels of the label set.

.. code-block:: python

    LabelSet(x='x', y='y', text='names',
             x_offset=5, y_offset=5, source=source)

The following example illustrates the use of |Label| and |LabelSet|:

.. bokeh-plot:: docs/user_guide/examples/plotting_label.py
    :source-position: above

The ``text`` values for ``LabelSet`` may value contain newline characters which
will result in multi-line labels.

.. _userguide_annotations_slope:

Slopes
------

|Slope| annotations are lines that can go from one edge of the plot to
another at a specific angle.

These are the most commonly used properties for this annotation:

* ``gradient``: The gradient of the line, in |data units|.
* ``y_intercept``: The y intercept of the line, in |data units|.
* The standard |line properties|.

.. bokeh-plot:: docs/user_guide/examples/plotting_slope.py
    :source-position: above

.. _userguide_annotations_spans:

Spans
-----

|Span| annotations are lines that are orthogonal to the x or y axis of a plot.
They have a single dimension (width or height) and go from one edge of the plot
area to the opposite edge.

These are the most commonly used properties for this annotation:

* ``dimension``: The direction of the span line. The direction can be one of
  these two values: Either * ``"height"`` for a line that is parallel to the
  plot's x axis. Or ``"width"`` for a line that is parallel to the plot's y
  axis.
* ``location``: The location of the span along the axis specified with
  ``dimension``.
* ``location_units``: The |unit| type for the ``location`` property. The default
  is to use |data units|.
* The standard |line properties|.

.. bokeh-plot:: docs/user_guide/examples/plotting_span.py
    :source-position: above

.. _userguide_annotations_whiskers:

Whiskers
--------

A |Whisker| annotation is a "stem" that is dimensionally linked to the data in
the plot. You can define this annotation using |data units| or |screen units|.

A common use for whisker annotations is to indicate error margins or
uncertainty for measurements at a single point.

These are the most commonly used properties for this annotation:

* ``lower``: The coordinates of the lower end of the whisker.
* ``upper``: The coordinates of the upper end of the whisker.
* ``dimension``: The direction of the whisker. The direction can be one of
  these two values: Either * ``"width"`` for whiskers that are parallel to the
  plot's x axis. Or ``"height"`` for whiskers that are parallel to the plot's y
  axis.
* ``base``: The location of the whisker along the dimension specified with
  ``dimension``.
* The standard |line properties|.

.. bokeh-plot:: docs/user_guide/examples/plotting_whisker.py
    :source-position: above

.. |ColorMapper| replace:: :class:`~bokeh.models.mappers.ColorMapper`

.. |Arrow|         replace:: :class:`~bokeh.models.annotations.Arrow`
.. |ArrowHead|     replace:: :class:`~bokeh.models.arrow_heads.ArrowHead`
.. |Band|          replace:: :class:`~bokeh.models.annotations.Band`
.. |PolyAnnotation| replace:: :class:`~bokeh.models.annotations.PolyAnnotation`
.. |ColorBar|      replace:: :class:`~bokeh.models.annotations.ColorBar`
.. |Label|         replace:: :class:`~bokeh.models.annotations.Label`
.. |LabelSet|      replace:: :class:`~bokeh.models.annotations.LabelSet`
.. |Slope|         replace:: :class:`~bokeh.models.annotations.Slope`
.. |Span|          replace:: :class:`~bokeh.models.annotations.Span`
.. |Title|         replace:: :class:`~bokeh.models.annotations.Title`
.. |Whisker|       replace:: :class:`~bokeh.models.annotations.Whisker`
