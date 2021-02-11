.. _userguide_annotations:

Adding annotations
==================

Bokeh includes several different types of :term:`annotations <Annotation>` you
can use to add supplemental information to your visualizations.

.. _userguide_plotting_titles:

Titles
------

Use |Title| annotations to add descriptive text which is rendered around
the edges of a plot.

If you use the :ref:`bokeh.plotting <userguide_interfaces_plotting>` interface,
the quickest way to add a basic title is to pass the text as the ``title``
parameter to |Figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_basic.py
    :source-position: above

The default title is generally located above a plot, aligned to the left.

To define the placement of the title in relation to the plot, use the
``title_location`` parameter. A title can be located above, below, left, or
right of a plot. For example:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_location.py
    :source-position: above

Use your plot's ``.title`` property to customize the default |Title|. You can
set visual properties for font, border, and background, for example.

This example uses the ``.title`` property to set the font and background
properties as well as the title text and title alignment:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_visuals.py
    :source-position: above

Note that the ``align`` property is relative to the direction of the text. For
example: If you have placed your title on the left side of your plot, setting
the ``align`` property to ``"left"`` means your text is rendered in the lower
left corner.

To add more titles to your document, you need to create additional |Title|
objects. Use the :func:`~bokeh.models.plots.Plot.add_layout` method of your plot
to include those additional |Title| objects in your document:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_additional.py
    :source-position: above

If a title and a :ref:`toolbar <userguide_tools>` are placed on the same side
of a plot, they will occupy the same space:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_toolbar.py
    :source-position: above

If the plot size is large enough, this can result in a more compact plot.
However, if the plot size is not large enough, the title and toolbar may
visually overlap and become impossible to read.

.. _userguide_plotting_legends:

Legends
-------

The easiest way to add a legend to your plot is to include any of the
:ref:`legend_label <userguide_plotting_legends_legend_label>`,
:ref:`legend_group <userguide_plotting_legends_legend_group>`,
or :ref:`legend_field <userguide_plotting_legends_legend_field>` properties
when calling glyph methods. Bokeh then creates a
|Legend| object for you automatically.

For more advanced control over a plot's legend, access the |Legend| object
:ref:`directly <userguide_plotting_legends_manual>`.

.. _userguide_plotting_legends_legend_label:

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

.. _userguide_plotting_legends_legend_group:

Automatic grouping (Python)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your data is in the form of a :ref:`ColumnDataSource <userguide_data_cds>`,
Bokeh can generate legend entries from strings in one of the ColumnDataSource's
columns. This way, you can create legend entries based on groups of glyphs.

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

.. _userguide_plotting_legends_legend_field:

Automatic grouping (browser-side)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You also have the option to only group elements within your legend on the
:term:`JavaScript side <BokehJS>`, in the browser. Using browser-side grouping makes sense if you
want to group a column that is only computed on the JavaScript side, for
example.

.. code-block:: python

    p.circle('x', 'y', legend_field="colname", source=source)

In this case, the Python code does *not* see multiple items in ``Legend.items``.
Instead, there is only a single item that represents the grouping which is then
performed in the browser.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_field.py
    :source-position: above

.. _userguide_plotting_legends_manual:

Manual Legends
~~~~~~~~~~~~~~

It is also possible to not specify any of the legend arguments, and manually
build a :class:`~bokeh.models.annotations.Legend` by hand. An example of this
can be found in :bokeh-tree:`examples/models/file/legends.py`:

Explicit Index
~~~~~~~~~~~~~~

Other times, it may be useful to explicitly tell Bokeh which index into a
``ColumnDataSource`` should be used when drawing a legend item. In particular,
if you want to draw multiple legend items for "multi" glyphs such as
``MultiLine`` or ``Patches``. This is accomplished by specifying an ``index``
for the legend item, as shown below.

.. bokeh-plot:: docs/user_guide/examples/plotting_legends_multi_index.py
    :source-position: above

Interactive Legends
~~~~~~~~~~~~~~~~~~~

It is also possible to configure legends to be interactive, so that clicking
or tapping on legend entries affects the corresponding glyph visibility. See
the :ref:`userguide_interaction_legends` section of the User Guide for more
information and examples.

.. note::
    :ref:`userguide_interaction_legends` features currently work on the first,
    "per-glyph" style legends. Legends that are created by specifying a column
    to automatically group do not yet support interactive features.

.. _userguide_plotting_color_bars:

Color Bars
----------

A |ColorBar| can be created using a |ColorMapper| instance, which
contains a color palette. Both on- and off-plot color bars are
supported; the desired location can be specified when adding the
|ColorBar| to the plot.

.. note::
    This example depends on the open-source NumPy library in order to
    generate demonstration data.

.. bokeh-plot:: docs/user_guide/examples/plotting_color_bars.py
    :source-position: above

.. _userguide_plotting_arrows:

Arrows
------

|Arrow| annotations can be used to connect glyphs and label annotations or
to simply highlight plot regions. Arrows are compound annotations, meaning
that their ``start`` and ``end`` attributes are themselves other |ArrowHead|
annotations. By default, the |Arrow| annotation is one-sided with the ``end``
set as an ``OpenHead``-type arrowhead (an open-backed wedge style) and the
``start`` property set to ``None``. Double-sided arrows can be created by
setting both the ``start`` and ``end`` properties as appropriate |ArrowHead|
subclass instances.

Arrows have standard line properties to set the color and appearance of the
arrow shaft:

.. code-block:: python

    my_arrow.line_color = "blue"
    my_arrow.line_alpha = 0.6

Arrows may also be configured to refer to additional non-default x- or
y-ranges with the ``x_range`` and ``y_range`` properties, in the same way
as :ref:`userguide_plotting_twin_axes`.

Additionally, any arrowhead objects in ``start`` or ``end`` have a ``size``
property to control how big the arrowhead is, as well as both line and
fill properties. The line properties control the outline of the arrowhead,
and the fill properties control the interior of the arrowhead (if applicable).

.. bokeh-plot:: docs/user_guide/examples/plotting_arrow.py
    :source-position: above

.. _userguide_plotting_bands:

Bands
-----

A |Band| will create a dimensionally linked "stripe", either located in data
or screen coordinates. One common use for the Band annotation is to indicate
uncertainty related to a series of measurements.

.. bokeh-plot:: docs/user_guide/examples/plotting_band.py
    :source-position: above

.. _userguide_plotting_box_annotations:

Box Annotations
---------------

A |BoxAnnotation| can be linked to either data or screen coordinates in order
to emphasize specific plot regions. By default, box annotation dimensions (e.g.
``left`` or ``top``) will extend the annotation to the edge of the plot area.

.. bokeh-plot:: docs/user_guide/examples/plotting_box_annotation.py
    :source-position: above

.. _userguide_plotting_labels:

Labels
------

Labels are text elements that can be used to annotate either glyphs or plot
regions.

To create a single text label, use the |Label| annotation. This annotation
is configured with a ``text`` property containing the text to be displayed,
as well as ``x`` and ``y`` properties to set the position (in screen or data
space units). Additionally, a render mode ``"canvas"`` or ``"css"`` may be
specified. Finally, labels have ``text``, ``border_line``, and
``background_fill`` properties. These control the visual appearance of the
text, as well as the border and background of the bounding box for the text:

.. code-block:: python

    Label(x=70, y=70, x_units='screen', text='Some Stuff', render_mode='css',
          border_line_color='black', border_line_alpha=1.0,
          background_fill_color='white', background_fill_alpha=1.0)

To create several labels at once, possibly to easily annotate another existing
glyph, use the |LabelSet| annotation, which is configured with a data
source in which the ``text`` and the ``x`` and ``y`` positions are given as column
names. ``LabelSet`` objects can also have ``x_offset`` and ``y_offset``,
which specify a distance in screen space units to offset the label positions
from ``x`` and ``y``. Finally, the ``level`` property controls the render level,
to place the label above or underneath other renderers:

.. code-block:: python

    LabelSet(x='x', y='y', text='names',
             x_offset=5, y_offset=5, source=source)

The following example illustrates the use of both:

.. bokeh-plot:: docs/user_guide/examples/plotting_label.py
    :source-position: above

.. _userguide_plotting_slope:

Slopes
------

|Slope| annotations are lines which may be sloped and extend to the
edge of the plot area.

.. bokeh-plot:: docs/user_guide/examples/plotting_slope.py
    :source-position: above

.. _userguide_plotting_spans:

Spans
-----

|Span| annotations are lines that have a single dimension (width or height)
and extend to the edge of the plot area.

.. bokeh-plot:: docs/user_guide/examples/plotting_span.py
    :source-position: above

.. _userguide_plotting_whiskers:

Whiskers
--------

A |Whisker| will create a dimensionally linked "stem", either located in data
or screen coordinates. Indicating error or uncertainty for measurements at a
single point would be one common use for the Whisker annotation.

.. bokeh-plot:: docs/user_guide/examples/plotting_whisker.py
    :source-position: above

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |Figure| replace:: :class:`~bokeh.plotting.Figure`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |ColorMapper| replace:: :class:`~bokeh.models.mappers.ColorMapper`

.. |Arrow|         replace:: :class:`~bokeh.models.annotations.Arrow`
.. |ArrowHead|     replace:: :class:`~bokeh.models.arrow_heads.ArrowHead`
.. |Band|          replace:: :class:`~bokeh.models.annotations.Band`
.. |BoxAnnotation| replace:: :class:`~bokeh.models.annotations.BoxAnnotation`
.. |ColorBar|      replace:: :class:`~bokeh.models.annotations.ColorBar`
.. |Label|         replace:: :class:`~bokeh.models.annotations.Label`
.. |LabelSet|      replace:: :class:`~bokeh.models.annotations.LabelSet`
.. |Legend|        replace:: :class:`~bokeh.models.annotations.Legend`
.. |Slope|         replace:: :class:`~bokeh.models.annotations.Slope`
.. |Span|          replace:: :class:`~bokeh.models.annotations.Span`
.. |Title|         replace:: :class:`~bokeh.models.annotations.Title`
.. |Whisker|       replace:: :class:`~bokeh.models.annotations.Whisker`
