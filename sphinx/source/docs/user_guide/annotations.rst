.. _userguide_annotations:

Adding Annotations
==================

Bokeh includes several different types of annotations to allow users to add
supplemental information to their visualizations.

.. _userguide_plotting_titles:

Titles
~~~~~~

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
example for titles on the left side of a plot "left" will be in the
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
However if the plot size is not large enough, the title and toolbar may
visually overlap in way that is not desirable.

.. _userguide_plotting_legends:

Legends
~~~~~~~

It is possible to create |Legend| annotations easily by specifying a legend
argument to the glyph methods, when creating a plot.

.. note::
    This example depends on the open source NumPy library in order to more
    easily generate better data suitable for demonstrating legends.

.. bokeh-plot:: docs/user_guide/examples/plotting_legends.py
    :source-position: above

It is also possible to create multiple legend items for the same glyph when
if needed by passing a legend that is the column of the column data source.

.. bokeh-plot:: docs/user_guide/examples/plotting_legends_by_source.py
    :source-position: above

If you do not want this automatic behavior, you can use the ``field()`` or
``value()`` functions from :ref:`bokeh.core.properties`, to be explicit about
your  intentions. See :bokeh-tree:`examples/app/gapminder/main.py` for an
example. Alternatively, you can not specify any legend argument, and manually
build a :class:`~bokeh.models.annotations.Legend` by hand. You can see an
example of this in :bokeh-tree:`examples/models/file/legends.py`:

It's also possible to configure legends to be interactive, so that clicking
or tapping on legend entries affects the corresponding glyph visibility. See
the :ref:`userguide_interaction_legends` section of the User's Guide for more
information and examples.

.. note::
    :ref:`userguide_interaction_legends` features currently work on the first,
    "per-glyph" style legends. Legends that are created by specifying a column
    to automatically group do no yet support interactive features.

.. _userguide_plotting_color_bars:

Color Bars
~~~~~~~~~~

Users can use a |ColorMapper| instance, which contain a color palette,
to create a |ColorBar|. Both on and off-plot color bars are supported, users
just need to specify their desired location when adding the ColorBar to the
plot.

.. note::
    This example depends on the open source NumPy and matplotlib libraries in
    order to more easily generate better data suitable for demonstrating
    legends.

.. bokeh-plot:: docs/user_guide/examples/plotting_color_bars.py
    :source-position: above

.. _userguide_plotting_arrows:

Arrows
~~~~~~

|Arrow| annotations can be used to connect glyphs and label annotations or
to simply highlight plot regions. Arrows are compound annotations, meaning
that their``start`` and ``end`` attributes are themselves other |ArrowHead|
annotations. By default, the |Arrow| annotation is one-sided with the ``end``
set as an ``OpenHead``-type arrow head (an open-backed wedge style) and the
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

Additionally any arrow head objects in ``start`` or ``end`` have a ``size``
property to control how big the arrow head is, as well as both line and
fill properties. The line properties control the outline of the arrow head,
and the fill properties control the interior of the arrow head (if applicable).

.. bokeh-plot:: docs/user_guide/examples/plotting_arrow.py
    :source-position: above

.. _userguide_plotting_bands:

Bands
~~~~~

A |Band| will create a dimensionally-linked "stripe", either located in data
or screen coordinates. One common use for the Band annotation is to indicate
uncertainty related to a series of measurements.

.. bokeh-plot:: docs/user_guide/examples/plotting_band.py
    :source-position: above

.. _userguide_plotting_box_annotations:

Box Annotations
~~~~~~~~~~~~~~~

A |BoxAnnotation| can be linked to either data or screen coordinates in order
to emphasize specific plot regions. By default, box annotation dimensions (e.g.
``left`` or ``top``) default will extend the annotation to the edge of the
plot area.

.. bokeh-plot:: docs/user_guide/examples/plotting_box_annotation.py
    :source-position: above

.. _userguide_plotting_labels:

Labels
~~~~~~

Labels are text elements that can be used to annotate either glyphs or plot
regions.

To create a single text label, use the |Label| annotation. This annotation
is configured with a ``text`` property containing the text to be displayed,
as well as ``x`` and ``y`` properties to set the position (in screen or data
space units). Additionally a render mode ``"canvas"`` or ``"css"`` may be
specified. Finally, labels have ``text``, ``border_line``, and
``background_fill`` properties. These control the visual appearance of the
text, as well as the border and background of the bounding box for the text:

.. code-block:: python

    Label(x=70, y=70, x_units='screen', text='Some Stuff', render_mode='css',
          border_line_color='black', border_line_alpha=1.0,
          background_fill_color='white', background_fill_alpha=1.0)

To create several labels at once, possibly to easily annotate another existing
glyph, use the |LabelSet| annotation, which is configured with a data
source, with the ``text`` and ``x`` and ``y`` positions are given as column
names. ``LabelSet`` objects can also have ``x_offset`` and ``y_offset``,
which specify a distance in screen space units to offset the label positions
from ``x`` and ``y``. Finally the render level may be controlled with the
``level`` property, to place the label above or underneath other renderers:


.. code-block:: python

    LabelSet(x='x', y='y', text='names', level='glyph',
             x_offset=5, y_offset=5, source=source)

The following example illustrates the use of both:

.. bokeh-plot:: docs/user_guide/examples/plotting_label.py
    :source-position: above

.. _userguide_plotting_spans:

Spans
~~~~~

|Span| annotations are lines that have a single dimension (width or height)
and extend to the edge of the plot area.

.. bokeh-plot:: docs/user_guide/examples/plotting_span.py
    :source-position: above

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |Figure| replace:: :class:`~bokeh.plotting.figure.Figure`

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
.. |Span|          replace:: :class:`~bokeh.models.annotations.Span`
.. |Title|         replace:: :class:`~bokeh.models.annotations.Title`
