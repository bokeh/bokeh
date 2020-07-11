.. _userguide_annotations:

Adding Annotations
==================

Bokeh includes several different types of annotations to allow users to add
supplemental information to their visualizations.

.. _userguide_plotting_titles:

Titles
------

|Title| annotations allow descriptive text to be rendered around the edges
of a plot.

When using ``bokeh.plotting`` or ``bokeh.Charts``, the quickest way to add
a basic title is to pass the text as the ``title`` parameter to |Figure| or
any Chart function:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_basic.py
    :source-position: above

The default title is normally on the top of a plot, aligned to the left. But
which side of the plot the default title appears on can be controlled by the
``title_location`` parameter:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_location.py
    :source-position: above

The default |Title| is accessible through the ``Plot.title`` property.
Visual properties for font, border, background, and others can be set
directly on ``.title``. Here is an example that sets font and background
properties as well as the title text and title alignment using ``.title``:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_visuals.py
    :source-position: above

Note that the alignment is measured along the direction of text. For
example, for titles on the left side of a plot, "left" will be in the
lower corner.

In addition to the default title, it is possible to create and add
additional |Title| objects to plots using the ``add_layout`` method
of Plots:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_additional.py
    :source-position: above

If a title and a sticky toolbar are set to the same side, they will occupy
the same space:

.. bokeh-plot:: docs/user_guide/examples/plotting_title_toolbar.py
    :source-position: above

If the plot size is large enough, this can result in a more compact plot.
However, if the plot size is not large enough, the title and toolbar may
visually overlap in a way that is not desirable.

.. _userguide_plotting_legends:

Legends
-------

It is possible to create |Legend| annotations easily by specifying legend
arguments to the glyph methods when creating a plot.

Basic Legend Label
~~~~~~~~~~~~~~~~~~

To provide a simple explicit label for a glyph, pass the ``legend_label``
keyword argument:

.. code-block:: python

    p.circle('x', 'y', legend_label="some label")

If multiple glyphs are given the same label, they will all be combined into a
single legend item with that label.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_label.py
    :source-position: above

Automatic Grouping (Python)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

It is often desirable to generate multiple legend items by grouping the values
in a data source column. It is possible for Bokeh to perform such a grouping by
passing the ``legend_group`` keyword argument to a glyph method:

.. code-block:: python

    p.circle('x', 'y', legend_group="colname", source=source)

When this method is used, the grouping is performed immediately in Python, and
subsequent Python code will be able to see the individual legend items in
``Legend.items`` property. If desired, these items can be re-arranged or modified.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_group.py
    :source-position: above

.. note::

    To use this feature, a ``source`` argument *must also be provided* to the
    glyph method. Additionally, the column to be grouped must already be present
    in the data source at that point.

Automatic Grouping (Browser)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

It is also possible to specify that the grouping should happen on the JavaScript
side, in the browser. This may be desirable, e.g. if the grouping should happen
on a column that is only computed on the JavaScript side.

.. code-block:: python

    p.circle('x', 'y', legend_field="colname", source=source)

In this case, the Python code does *not* see multiple items in ``Legend.items``.
Instead, there is only a single item that represents the grouping to perform in
the browser.

.. bokeh-plot:: docs/user_guide/examples/plotting_legend_field.py
    :source-position: above

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

It's also possible to configure legends to be interactive, so that clicking
or tapping on legend entries affects the corresponding glyph visibility. See
the :ref:`userguide_interaction_legends` section of the User Guide for more
information and examples.

.. note::
    :ref:`userguide_interaction_legends` features currently work on the first,
    "per-glyph" style legends. Legends that are created by specifying a column
    to automatically group do no yet support interactive features.

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
source in which the ``text`` and ``x`` and ``y`` positions are given as column
names. ``LabelSet`` objects can also have ``x_offset`` and ``y_offset``,
which specify a distance in screen space units to offset the label positions
from ``x`` and ``y``. Finally, the render level may be controlled with the
``level`` property, to place the label above or underneath other renderers:


.. code-block:: python

    LabelSet(x='x', y='y', text='names', level='glyph',
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
