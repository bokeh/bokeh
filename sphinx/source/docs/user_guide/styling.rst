.. _userguide_styling:

Styling visual attributes
=========================

.. _userguide_styling_using_themes:

Using themes
------------

Bokeh's themes are a set of pre-defined design parameters that you can apply to
your plots. Themes can include settings for parameters such as colors, fonts,
or line styles.

.. _userguide_styling_using_themes_built_in:

Applying Bokeh's built-in themes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh comes with five :ref:`built-in themes <bokeh.themes>` to quickly change
the appearance of one or more plots: ``caliber``, ``dark_minimal``,
``light_minimal``, ``night_sky``, and ``contrast``.

.. container:: theme-examples

    .. image:: /_images/themes_caliber.png
        :scale: 50%
        :alt: Screenshot of the caliber theme for Bokeh

    .. image:: /_images/themes_dark_minimal.png
        :scale: 50%
        :alt: Screenshot of the dark_minimal theme for Bokeh

    .. image:: /_images/themes_light_minimal.png
        :scale: 50%
        :alt: Screenshot of the light_minimal theme for Bokeh

    .. image:: /_images/themes_night_sky.png
        :scale: 50%
        :alt: Screenshot of the night_sky theme for Bokeh

    .. image:: /_images/themes_contrast.png
        :scale: 50%
        :alt: Screenshot of the contrast theme for Bokeh


To use one of the built-in themes, assign the name of the theme you want to use
to the ``theme`` property of your document.

For example:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import curdoc
    from bokeh.plotting import figure, output_file, show

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    output_file("dark_minimal.html")

    curdoc().theme = 'dark_minimal'

    p = figure(title='dark_minimal', plot_width=300, plot_height=300)
    p.line(x, y)

    show(p)

For more examples and detailed information, see :class:`bokeh.themes`.

.. _userguide_styling_using_themes_custom:

Creating custom themes
~~~~~~~~~~~~~~~~~~~~~~

Themes in Bokeh are defined in YAML or JSON files. To create your own theme
files, follow the format defined in :class:`bokeh.themes.Theme`.

Using YAML, for example:

.. code-block:: yaml

    attrs:
        Figure:
            background_fill_color: '#2F2F2F'
            border_fill_color: '#2F2F2F'
            outline_line_color: '#444444'
        Axis:
            axis_line_color: !!null
        Grid:
            grid_line_dash: [6, 4]
            grid_line_alpha: .3
        Title:
            text_color: "white"

To use your custom theme in a Bokeh plot, load your YAML or JSON file into a
:class:`bokeh.themes.Theme` object:

.. code-block:: python

    from bokeh.themes import Theme
    curdoc().theme = Theme(filename="./theme.yml")

.. _userguide_styling_using_palettes:

Using palettes
--------------

Palettes are sequences of RGB(A) hex strings that define a colormap. The
sequences you use for defining colormaps can be either lists or tuples. Once you
have created a colormap, you can use it with the ``color`` attribute of many
plot objects from ``bokeh.plotting``.

Bokeh includes several pre-defined palettes, such as the standard Brewer
palettes. To use one of those pre-defined palettes, import it from the
``bokeh.palettes`` module. When you import "Spectral6", for example, Bokeh gives
you access to a six element list of RGB(A) hex strings from the Brewer
"Spectral" colormap:

.. code-block:: python

    >>> from bokeh.palettes import Spectral6
    >>> Spectral6
    ['#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']

For a list of all the standard palettes included in Bokeh, see
:ref:`bokeh.palettes`.

You can also create custom palettes by defining a sequence of RGB(A) hex
strings yourself.

.. _userguide_styling_using_mappers:

Using mappers
-------------

Use Bokeh's color mappers to encode a sequence of data into a palette of colors
that are based on the values in that sequence. You can then set a marker
object's ``color`` attribute to your color mapper. Bokeh includes several types
of mappers to encode colors:

* ``bokeh.transform.factor_cmap``: Maps colors to specific categorical elements.
  See :ref:`userguide_categorical` for more detail.
* ``bokeh.transform.linear_cmap``: Maps a range of numeric values across the
  available colors from high to low. For example, a range of `[0,99]` given the
  colors `['red', 'green', 'blue']` would be mapped as follows::

        x < 0  : 'red'     # values < low are clamped
    0 >= x < 33 : 'red'
    33 >= x < 66 : 'green'
    66 >= x < 99 : 'blue'
    99 >= x      : 'blue'    # values > high are clamped

* ``bokeh.transform.log_cmap``: Similar to ``linear_cmap`` but uses a natural
  log scale to map the colors.

These mapper functions return a ``DataSpec`` property. Pass this property to
the color attribute of the glyph you want to use it with.

The dataspec that the mapper function returns includes a ``bokeh.transform``.
You can access this data to use the result of the mapper function in a different
context. To create a ``ColorBar``, for example:

.. bokeh-plot:: docs/user_guide/examples/styling_linear_mappers.py
    :source-position: above

.. _userguide_styling_visual_properties:

Customizing visual properties
-----------------------------

To style the visual attributes of Bokeh plots, you need to know what the
available properties are. The full :ref:`refguide` contains all properties of
every object individually. However, there are three groups of properties that
many objects have in common. They are:

* **line properties**: line color, width, etc.
* **fill properties**: fill color, alpha, etc.
* **text properties**: font styles, colors, etc.

This section contains more details about some of the most common properties.

.. _userguide_styling_line_properties:

Line properties
~~~~~~~~~~~~~~~

.. include:: ../includes/line_props.txt

.. _userguide_styling_fill_properties:

Fill properties
~~~~~~~~~~~~~~~

.. include:: ../includes/fill_props.txt

.. _userguide_styling_hatch_properties:

Hatch properties
~~~~~~~~~~~~~~~~

.. include:: ../includes/hatch_props.txt

.. _userguide_styling_text_properties:

Text properties
~~~~~~~~~~~~~~~

.. include:: ../includes/text_props.txt

.. _userguide_styling_visible_property:

Visible property
~~~~~~~~~~~~~~~~

Glyph renderers, axes, grids, and annotations all have a ``visible`` property.
Use this property to turn them on and off.

.. bokeh-plot:: docs/user_guide/examples/styling_visible_property.py
    :source-position: above

This can be particularly useful in interactive examples with a Bokeh server or
CustomJS.

.. bokeh-plot:: docs/user_guide/examples/styling_visible_annotation_with_interaction.py
    :source-position: above

.. _userguide_styling_colors:

Color properties
~~~~~~~~~~~~~~~~

Bokeh objects have several properties related to colors. Use those color
properties to control the appearance of lines, fills, or text, for example.

Use one of these options to define colors in Bokeh:

- Any of the
  `named CSS colors <http://www.w3schools.com/colors/colors_names.asp>`_, such
  as ``'green'`` or ``'indigo'``. You can also use the additional name
  ``'transparent'`` (equal to ``'#00000000'``).
- An RGB(A) hex value, such as ``'#FF0000'`` (without alpha information) or
  ``'#44444444'`` (with alpha information).
- A CSS4 ``rgb()``, ``rgba()``, or ``hsl()``
  `color string <https://www.w3.org/TR/css-color-4/>`_, such as
  ``'rgb(0 127 0 / 1.0)'``, ``'rgba(255, 0, 127, 0.6)'``, or
  ``'hsl(60deg 100% 50% / 1.0)'``.
- A 3-tuple of integers ``(r, g, b)`` (where *r*, *g*, and *b* are integers
  between 0 and 255).
- A 4-tuple of ``(r, g, b, a)`` (where *r*, *g*, and *b* are integers between 0
  and 255 and *a* is a floating-point value between 0 and 1).
- A 32-bit unsigned integer representing RGBA values in a 0xRRGGBBAA
  byte order pattern, such as ``0xffff00ff`` or ``0xff0000ff``.

To define a series of colors, use an array of color data such as a list or the
column of a :ref:`ColumnDataSource <userguide_data_cds>`. This also includes
`NumPy arrays <https://numpy.org/doc/stable/reference/generated/numpy.array.html>`_.

For example:

.. bokeh-plot:: docs/user_guide/examples/styling_specifying_colors.py
    :source-position: above

In addition to specifying the alpha value of a color when defining the color
itself, you can also set an alpha value separately by using the
``line_alpha`` or ``fill_alpha`` properties of a glyph.

In case you define a color with an alpha value and also explicitly provide an
alpha value through a ``line_alpha`` or ``fill_alpha`` property at the same
time, the following happens: If your color definition does include an alpha
value (such as ``'#00FF0044'`` or ``'rgba(255, 0, 127, 0.6)'``), this alpha
value takes precedence over the alpha value you provide through the objects's
property. Otherwise, the alpha value defined in the objects's property is used.

The following figure demonstrates each possible combination of using RGB and
RGBA colors together with the ``line_alpha`` or ``fill_alpha`` properties:

.. bokeh-plot:: docs/user_guide/examples/styling_specifying_colors_properties.py
    :source-position: none

.. note::
    If you use
    :ref:`Bokeh's plotting interface <userguide_interfaces_plotting>`, you also
    have the option to specify ``color`` and/or ``alpha`` as keywords when
    calling a renderer method. Bokeh automatically applies these values to the
    corresponding ``fill`` and ``line`` properties of your glyphs.

    You then still have the option to provide additional ``fill_color``,
    ``fill_alpha``, ``line_color``, and ``line_alpha`` arguments as well. In
    this case, the former will take precedence.

.. _userguide_styling_units:

Screen units and data-space units
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When setting visual properties of Bokeh objects, you use either screen units or
data-space units:

* Screen units use raw numbers of pixels to specify height or width
* Data-space units are relative to the data and the axes of the plot

Take a 400 pixel by 400 pixel graph with x and y axes ranging from 0
through 10, for example. A glyph that is one fifth as wide and tall as the graph
would have a size of 80 screen units or 2 data-space units.


Objects in Bokeh that support both screen units and data-space units usually
have a dedicated property to choose which unit to use. This unit-setting
property is the name of the property with an added ``_units``. For
example: A :class:`~bokeh.models.annotations.Whisker`
:ref:`annotation <userguide_plotting_whiskers>` has the property ``upper``. To
define which unit to use, set the ``upper_units`` property to either
``'screen'`` or ``'data'``.

.. _userguide_styling_selecting:

Selecting plot objects
----------------------

If you want to customize the appearance of any element of your Bokeh plot, you
first need to identify which object you want to modify. As described in
:ref:`userguide_concepts`, Bokeh plots are a combination of Python objects that
represent all the different parts of your plot: its grids, axes, and glyphs, for
example.

Some objects have convenience methods to help you identify the objects you want
to address. See `Styling axes`_, `Styling grids`_, and `Styling legends`_ for
examples.

To query for any Bokeh plot object, use the |select| method on |Plot|. For
example, to find all `PanTool` objects in a plot:

.. code-block:: python

    >>> p.select(type=PanTool)
    [<bokeh.models.tools.PanTool at 0x106608b90>]

You can also use the |select| method to query on other attributes as well:

.. code-block:: python

    >>> p.circle(0, 0, name="mycircle")
    <bokeh.plotting.Figure at 0x106608810>

    >>> p.select(name="mycircle")
    [<bokeh.models.renderers.GlyphRenderer at 0x106a4c810>]

This query method can be especially useful when you want to style visual
attributes of `Styling glyphs`_.

.. _userguide_styling_plots:

Styling plots
-------------

In addition to the individual plot elements, a |Plot| object itself also has
several visual characteristics that you can customize: the dimensions of the
plot, its backgrounds, borders, or outlines, for example. This section describes
how to change these attributes of a Bokeh plot.

The example code primarily uses the |bokeh.plotting| interface to create plots.
However, the instructions apply regardless of how a Bokeh plot was created.

.. _userguide_styling_plot_dimensions:

Dimensions
~~~~~~~~~~

To change the width and height of a |Plot|, use its ``plot_width`` and
``plot_height`` attributes. Those two attributes use screen units. They
control the size of the entire canvas area, including any axes or titles (but
not the toolbar).

If you are using the |bokeh.plotting| interface, you can pass these values to
|figure| directly:

.. bokeh-plot:: docs/user_guide/examples/styling_dimensions.py
    :source-position: above

.. _userguide_styling_plot_responsive_dimensions:

Responsive sizes
~~~~~~~~~~~~~~~~

To automatically adjust the width or height of your plot in relation to the
available space in the browser, use the plot's
:class:`~bokeh.models.plots.Plot.sizing_mode` property.

To control how the plot scales to fill its container, see the documentation for
:ref:`bokeh.models.layouts`, in particular the ``sizing_mode`` property of
:class:`~bokeh.models.layouts.LayoutDOM`.

If you set ``sizing_mode`` to anything different than ``fixed``, Bokeh adjusts
the ``plot_width`` and ``plot_height`` as soon as a plot is rendered. However,
Bokeh uses ``plot_width`` and ``plot_height`` to calculate the initial aspect
ratio of your plot.

Plots will only resize down to a minimum of 100px (height or width) to prevent
problems in displaying your plot.

.. _Bokeh GitHub repository: https://github.com/bokeh/bokeh

.. _userguide_styling_plot_title:

Title
~~~~~

To style the title of your plot, use the |Title| annotation, which is available
as the ``.title`` property of the |Plot|.

You can use most of the standard `Text Properties`_. However, ``text_align`` and
``text_baseline`` do not apply. To position the title relative to the entire
plot, use the properties :class:`~bokeh.models.annotations.Title.align` and
:class:`~bokeh.models.annotations.Title.offset` instead.

As an example, to set the color and font style of the title text, use
``plot.title.text_color``:

.. bokeh-plot:: docs/user_guide/examples/styling_title.py
    :source-position: above

.. _userguide_styling_plot_background:

Background
~~~~~~~~~~

To change the background fill style, adjust the ``background_fill_color`` and
``background_fill_alpha`` properties of the |Plot| object:

.. bokeh-plot:: docs/user_guide/examples/styling_background_fill.py
    :source-position: above

.. _userguide_styling_plot_border:

Border
~~~~~~

To adjust the border fill style, use the ``border_fill_color`` and
``border_fill_alpha`` properties of the |Plot| object. You can also set the
minimum border on each side (in screen units) with these properties:

* ``min_border_left``
* ``min_border_right``
* ``min_border_top``
* ``min_border_bottom``

Additionally, if you set ``min_border``, Bokeh applies a minimum border setting
to all sides as a convenience. The ``min_border`` default value is 40px.

.. bokeh-plot:: docs/user_guide/examples/styling_min_border.py
    :source-position: above

.. _userguide_styling_plot_outline:

Outline
~~~~~~~

Bokeh :class:`~bokeh.models.plots.Plot` objects have various
`line properties <Line properties>`_. To change the appearance of outlines, use
those line properties that are prefixed with ``outline_``.

For example, to set the color of the outline, use ``outline_line_color``:

.. bokeh-plot:: docs/user_guide/examples/styling_plot_outline_line_color.py
    :source-position: above

.. _userguide_styling_glyphs:

Styling glyphs
--------------

To style the fill, line, or text properties of a glyph, you first need to
identify which ``GlyphRenderer`` you want to customize. If you are using the
|bokeh.plotting| interface, the glyph functions return the renderer:

.. code-block:: python

    >>> r = p.circle([1,2,3,4,5], [2,5,8,2,7])
    >>> r
    <bokeh.models.renderers.GlyphRenderer at 0x106a4c810>

Next, obtain the glyph itself from the ``.glyph`` attribute of a
``GlyphRenderer``:

.. code-block:: python

    >>> r.glyph
    <bokeh.models.glyphs.Circle at 0x10799ba10>

This is the object to set fill, line, or text property values for:

.. bokeh-plot:: docs/user_guide/examples/styling_glyph_properties.py
    :source-position: above

.. _userguide_styling_selected_unselected_glyphs:

Selected and unselected glyphs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To customize the styling of selected and non-selected glyphs, set the
|selection_glyph| and |nonselection_glyph| attributes of the |GlyphRenderer|.
You can either set them manually or by passing them to |add_glyph|.

.. |add_glyph| replace:: :func:`~bokeh.models.plots.Plot.add_glyph`
.. |GlyphRenderer| replace:: :class:`~bokeh.models.renderers.GlyphRenderer`
.. |selection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.selection_glyph`
.. |nonselection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.nonselection_glyph`

The plot below uses the |bokeh.plotting| interface to set these attributes.
Click or tap any of the circles on the plot to see the effect on the selected
and non-selected glyphs. To clear the selection and restore the original state,
click anywhere in the plot *outside* of a circle.

.. bokeh-plot:: docs/user_guide/examples/styling_glyph_selections_plotting_glyph.py
    :source-position: above

If you just need to set the color or alpha parameters of the selected or
non-selected glyphs, provide color and alpha arguments to the glyph function,
prefixed by ``"selection_"`` or ``"nonselection_"``:

.. bokeh-plot:: docs/user_guide/examples/styling_glyph_selections_plotting_params.py
    :source-position: above

If you use the :ref:`bokeh.models` interface, use the
:func:`~bokeh.models.plots.Plot.add_glyph` function:

.. code-block:: python

    p = Plot()
    source = ColumnDataSource(dict(x=[1, 2, 3], y=[1, 2, 3]))

    initial_circle = Circle(x='x', y='y', fill_color='blue', size=50)
    selected_circle = Circle(fill_alpha=1, fill_color="firebrick", line_color=None)
    nonselected_circle = Circle(fill_alpha=0.2, fill_color="blue", line_color="firebrick")

    p.add_glyph(source,
                initial_circle,
                selection_glyph=selected_circle,
                nonselection_glyph=nonselected_circle)

.. note::
    When rendering, Bokeh considers only the *visual* properties of
    ``selection_glyph`` and ``nonselection_glyph``. Changing
    positions, sizes, etc., will have no effect.

.. _userguide_styling_hover_inspections:

Hover inspections
~~~~~~~~~~~~~~~~~

To style the appearance of glyphs that are hovered over, pass color or alpha
parameters prefixed with ``"hover_"`` to your renderer function.

Alternatively, set the |selection_glyph| and |nonselection_glyph| attributes of
the |GlyphRenderer|, just like in
:ref:`userguide_styling_selected_unselected_glyphs` above.

This example uses the first method of passing a color parameter with the
``"hover_"`` prefix:

.. bokeh-plot:: docs/user_guide/examples/styling_glyph_hover.py
    :source-position: above

.. note::
    When rendering, Bokeh considers only the *visual* properties of
    ``hover_glyph``. Changing positions, sizes, etc. will have no effect.

.. _userguide_styling_tool_overlays:

Styling tool overlays
---------------------

Some Bokeh tools also have configurable visual attributes.

For instance, the various region selection tools and the box zoom tool all have
an ``overlay``. To style their line and fill properties, pass values to the
respective attributes:

.. bokeh-plot:: docs/user_guide/examples/styling_tool_overlays.py
    :source-position: above

For more information, see the reference guide's entries for
:class:`BoxSelectTool.overlay <bokeh.models.tools.BoxSelectTool.overlay>`,
:class:`BoxZoomTool.overlay <bokeh.models.tools.BoxZoomTool.overlay>`,
:class:`LassoSelectTool.overlay <bokeh.models.tools.LassoSelectTool.overlay>`,
:class:`PolySelectTool.overlay <bokeh.models.tools.PolySelectTool.overlay>`, and
:class:`RangeTool.overlay <bokeh.models.tools.RangeTool.overlay>`.

.. _userguide_styling_toolbar_autohide:

Toggling ToolBar autohide
-------------------------

To make your toolbar hide automatically, set the toolbar's
:class:`~bokeh.models.tools.Toolbar.autohide` property to True. When you set
``autohide`` to True, the toolbar is visible only when the mouse is inside the
plot area and is otherwise hidden.

.. bokeh-plot:: docs/user_guide/examples/styling_toolbar_autohide.py
    :source-position: above


.. _userguide_styling_axes:

Styling axes
------------

This section focuses on changing various visual properties of Bokeh plot axes.

To set style attributes on Axis objects, use the |xaxis|, |yaxis|, and
|axis| methods on |Plot| to first obtain a plot's Axis objects. For example:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

Because there may be more than one axis, this method returns a list of Axis
objects. However, as a convenience, these lists are *splattable*. This means that
you can set attributes directly on this result, and the attributes will be
applied to all the axes in the list. For example:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

This changes the value of ``axis_label`` for every x-axis of ``p``, however
many there may be.

The example below demonstrates the use of the |xaxis|, |yaxis|, and
|axis| methods in more details:

.. bokeh-plot:: docs/user_guide/examples/styling_axis_properties.py
    :source-position: above

.. _userguide_styling_axes_labels:

Labels
~~~~~~

To add or change the text of an axis' overall label, use the ``axis_label``
property. To add line breaks to the text in an axis label, include ``\n`` in
your string.

To control the visual appearance of the label text, use
`Text Properties`_ prefixed with ``axis_label_``. For instance, to set the text
color of the label, set ``axis_label_text_color``.

To change the distance between the axis label and the major tick labels, set the
``axis_label_standoff`` property.

For example:

.. bokeh-plot:: docs/user_guide/examples/styling_labels.py
    :source-position: above

.. _userguide_styling_axes_bounds:

Bounds
~~~~~~

To limit the bounds where axes are drawn, set the ``bounds`` property of an axis
object to a 2-tuple of *(start, end)*:

.. bokeh-plot:: docs/user_guide/examples/styling_bounds.py
    :source-position: above

.. _userguide_styling_axes_tick_lines:

Tick locations
~~~~~~~~~~~~~~

Bokeh uses several "ticker" models to decide where to display ticks on axes
(categorical, datetime, mercator, linear, or log scale). To configure the
placements of ticks, use the ``.ticker`` property of an axis.

If you use the |bokeh.plotting| interface, Bokeh chooses an appropriate ticker
placement model automatically.

In case you need to control which ticker placement model to use, you can also
explicitly define a list of tick locations. Assign
:class:`~bokeh.models.tickers.FixedTicker` with a list of tick locations to an
axis:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models.tickers import FixedTicker

    p = figure()

    # no additional tick locations will be displayed on the x-axis
    p.xaxis.ticker = FixedTicker(ticks=[10, 20, 37.4])

As a shortcut, you can also supply the list of ticks directly to an axis'
``ticker`` property:

.. bokeh-plot:: docs/user_guide/examples/styling_fixed_ticker.py
    :source-position: above

Tick lines
~~~~~~~~~~

To control the visual appearance of the major and minor ticks, set the
appropriate `Line Properties`_, prefixed with ``major_tick_`` and
``minor_tick_``, respectively.

For instance, to set the color of the major ticks, use
``major_tick_line_color``. To hide either set of ticks, set the color to
``None``.

Additionally, to control how far in and out of the plotting area the ticks
extend, use the properties ``major_tick_in``/``major_tick_out`` and
``minor_tick_in``/``minor_tick_out``. These values are in screen units.
Therefore, you can use negative values.

.. bokeh-plot:: docs/user_guide/examples/styling_tick_lines.py
    :source-position: above

.. _userguide_styling_axes_tick_label_formats:

Tick label formats
~~~~~~~~~~~~~~~~~~

To style the text of axis labels, use the ``TickFormatter`` object of the axis'
``formatter`` property. Bokeh uses a number of ticker formatters by default in
different situations:

* |BasicTickFormatter| --- Default formatter for linear axes.

* |CategoricalTickFormatter| --- Default formatter for categorical axes.

* |DatetimeTickFormatter| --- Default formatter for datetime axes.

* |LogTickFormatter| --- Default formatter for log axes.

These default tick formatters do not expose many configurable properties.
To control tick formatting at a finer-grained level, use one of the
|NumeralTickFormatter| or |PrintfTickFormatter| described below.

.. note::
    To replace a tick formatter on an axis, you must set the ``formatter``
    property on an actual ``Axis`` object, not on a splattable list. This is
    why the following examples use ``p.yaxis[0].formatter``, etc. (with the
    subscript ``[0]``).

``NumeralTickFormatter``
''''''''''''''''''''''''

The |NumeralTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks.

.. bokeh-plot:: docs/user_guide/examples/styling_numerical_tick_formatter.py
    :source-position: above

Many additional formats are available. See the full |NumeralTickFormatter|
documentation in the :ref:`refguide`.

``PrintfTickFormatter``
'''''''''''''''''''''''

The |PrintfTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks using ``printf`` style
format strings.

.. bokeh-plot:: docs/user_guide/examples/styling_printf_tick_formatter.py
    :source-position: above

For full details about formats, see the full |PrintfTickFormatter|
documentation in the :ref:`refguide`.

``FuncTickFormatter``
'''''''''''''''''''''

To fully customize the format of axis ticks, use the |FuncTickFormatter| in
combination with a JavaScript snippet as its ``code`` property.

The variable ``tick`` contains the unformatted tick value. It is accessible in
the snippet or function namespace at render time:

.. bokeh-plot:: docs/user_guide/examples/styling_func_tick_formatter.py
    :source-position: above

.. _userguide_styling_axes_tick_label_orientation:

Tick label orientation
~~~~~~~~~~~~~~~~~~~~~~

To control the orientation of major tick labels, use the
``major_label_orientation`` property. This property accepts the
values ``"horizontal"`` or ``"vertical"`` or a floating-point number
that gives the angle (in radians) to rotate from the horizontal:

.. bokeh-plot:: docs/user_guide/examples/styling_tick_label_orientation.py
    :source-position: above

.. note::
    There are more properties that you can use to configure Bokeh axes. For a
    complete list of all the various attributes that you can set on different
    types of Bokeh axes, see the :ref:`bokeh.models.axes` section of the
    :ref:`refguide`.

.. _userguide_styling_grids:

Styling grids
-------------

In this section, you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

To obtain a plot's Grid objects, use the |xgrid|, |ygrid|, and |grid| methods on
|Plot|. This works similar to the convenience methods for axes:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists. You can set an attribute
on the list as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (meaning vertically oriented objects). Correspondingly, ``ygrid``
    provides the grid objects that intersect the y-axis (meaning horizontally
    oriented objects).

.. _userguide_styling_grid_lines:

Lines
~~~~~

To configure the visual appearance of grid lines, use a collection of
`Line Properties`_, prefixed with ``grid_``.

For instance, to set the color of grid lines, use ``grid_line_color``. To hide
grid lines, set their line color to ``None``:

.. bokeh-plot:: docs/user_guide/examples/styling_grid_lines.py
    :source-position: above

Minor lines
~~~~~~~~~~~

To configure the visual appearance of minor grid lines, use a collection of
`Line Properties`_, prefixed with ``minor_grid_``.

For instance, to set the color of grid lines, use ``minor_grid_line_color``. By
default, minor grid lines are hidden (which means that their line color is set
to ``None``):

.. bokeh-plot:: docs/user_guide/examples/styling_minor_grid_lines.py
    :source-position: above

.. _userguide_styling_grid_bands:

Bands
~~~~~

Use "bands" to display filled, shaded bands between adjacent grid lines. To
control the visual appearance of these bands, use a collection of
`Fill Properties`_ and `Hatch Properties`_ that are prefixed with ``band_``.

For instance, to set the color of grid bands, use ``band_fill_color``. To hide
grid bands, set their fill color to ``None`` (this is the default).

This example defines bands filled with a solid color:

.. bokeh-plot:: docs/user_guide/examples/styling_grid_band_fill.py
    :source-position: above

This example uses bands filled with a hatch pattern:

.. bokeh-plot:: docs/user_guide/examples/styling_grid_band_hatch.py
    :source-position: above

.. _userguide_styling_grid_bounds:

Bounds
~~~~~~

To set explicit bounds that limit where grids are drawn, use a 2-tuple of
*(start, end)*. This is identical to setting
:ref:`bounds for axes <userguide_styling_axes_bounds>`:

.. bokeh-plot:: docs/user_guide/examples/styling_grid_bounds.py
    :source-position: above


.. note::
    There are other properties that Bokeh grids support configuring. For a
    complete listing of all the various attributes that can be set on Bokeh
    plot grids, consult the :ref:`bokeh.models.grids` section of the
    :ref:`refguide`.

.. _userguide_styling_legends:

Styling legends
---------------

Similar to the convenience methods for axes and grids, there is a
:func:`~bokeh.models.plots.Plot.legend` method on |Plot| that you can use to
obtain a plot's |Legend| objects:

bokeh.models.plots.Plot.legend

.. code-block:: python

    >>> p.legend
    [<bokeh.models.annotations.Legend at 0x106fa2278>]

This method also returns a splattable list. Therefore, you can set an attribute
on the list as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.legend.label_text_font = "times"

Location
~~~~~~~~

To control the location of the legend labels, use the ``location`` property.

Inside the plot area
''''''''''''''''''''

For legends in the central layout area, such as those created
automatically by ``bokeh.plotting``, set ``location`` to one of the following
values:

``"top_left"``

``"top_center"``

``"top_right"`` (the default)

``"center_right"``

``"bottom_right"``

``"bottom_center"``

``"bottom_left"``

``"center_left"``

``"center"``

or a ``(x, y)`` tuple indicating an absolute location in screen coordinates
(pixels from the bottom-left corner).

.. bokeh-plot:: docs/user_guide/examples/styling_legend_location.py
    :source-position: above

Outside the plot area
'''''''''''''''''''''

To position a legend outside the central area, use the ``add_layout`` method of
a plot. This requires creating the |Legend| object directly:

.. bokeh-plot:: docs/user_guide/examples/styling_legend_location_outside.py
    :source-position: above

In this use-case, you need to specify the legend's location in absolute terms.
Future releases will add additional options to customize legend positions.

Title
~~~~~

To add or change a legend's title, use its ``title`` property:

.. code:: python

    plot.legend.title = "Division"

To control the visual appearance of the legend title, use a collection of
`Text Properties`_, prefixed with ``title_``. For instance, to set the font
style of the legend, use ``title_text_font_style``.

To set the distance between the title and the rest of the legend (in pixels),
use the ``title_standoff`` property.

.. bokeh-plot:: docs/user_guide/examples/styling_legend_title.py
    :source-position: above

Orientation
~~~~~~~~~~~

To control the orientation of the legend, use the ``orientation`` property.
Valid values for this property are:

* ``"vertical"``
* ``"horizontal"``

The default orientation is ``"vertical"``.

.. bokeh-plot:: docs/user_guide/examples/styling_legend_orientation.py
    :source-position: above

Label text
~~~~~~~~~~

To control the visual appearance of the legend labels, use a collection of
`Text Properties`_, prefixed with ``label_``. For instance, to set the font
style of the labels, use ``label_text_font_style``.

.. bokeh-plot:: docs/user_guide/examples/styling_legend_label_text.py
    :source-position: above

Border
~~~~~~

To control the visual appearance of the legend border, use a collection of
`Line Properties`_, prefixed with ``border_``. For instance, to set the color
of the border, use ``border_line_color``. To make the border invisible, set
the border line color to ``None``.

.. bokeh-plot:: docs/user_guide/examples/styling_legend_border.py
    :source-position: above

Background
~~~~~~~~~~

To control the visual appearance of the legend background, use a collection
of `Fill Properties`_, prefixed with ``background_``. For instance, to set the
color of the background, use ``background_fill_color``. To make the background
transparent, set the ``background_fill_alpha`` to ``0``.

.. bokeh-plot:: docs/user_guide/examples/styling_legend_background.py
    :source-position: above

Dimensions
~~~~~~~~~~

To control dimensions such as the layout or spacing of label components, use
the following properties:

There are several properties that can be used to control the layout,
spacing, etc. of the legend components:

.. bokeh-prop:: Legend.label_standoff
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.label_width
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.label_height
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.glyph_width
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.glyph_height
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.padding
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.spacing
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.margin
    :module: bokeh.models.annotations


.. bokeh-plot:: docs/user_guide/examples/styling_legend_dimensions.py
    :source-position: above

.. _userguide_styling_render_level:

Setting render levels
---------------------

To specify the order in which things are drawn, use one of the following render
levels:

:image:
    "lowest" render level, drawn before anything else
:underlay:
    default render level for grids
:glyph:
    default render level for all glyphs (which means they are drawn above grids)
:annotation:
    default render level for annotation renderers
:overlay:
    "highest" render level, for tool overlays

Within a given level, renderers are drawn in the order that they were added.

To specify a render level explicitly, use the ``level`` parameter on the
renderer.

For example, to make sure an image is rendered *under* the grid lines, assign
the render level ``"image"`` to the ``level`` argument when calling your
``image`` renderer:

.. code-block:: python

    p.image(..., level="image")

You can see a complete example with output in the section
:ref:`userguide_plotting_images_colormapped`.

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
.. |select| replace:: :func:`~bokeh.models.plots.Plot.select`
.. |Title| replace:: :class:`~bokeh.models.annotations.Title`
.. |Legend| replace:: :class:`~bokeh.models.annotations.Legend`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Range1d| replace:: :class:`~bokeh.models.ranges.Range1d`

.. |bokeh.models.formatters| replace:: :ref:`bokeh.models.formatters <bokeh.models.formatters>`
.. |BasicTickFormatter| replace:: :class:`~bokeh.models.formatters.BasicTickFormatter`
.. |CategoricalTickFormatter| replace:: :class:`~bokeh.models.formatters.CategoricalTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |FuncTickFormatter| replace:: :class:`~bokeh.models.formatters.FuncTickFormatter`
.. |LogTickFormatter| replace:: :class:`~bokeh.models.formatters.LogTickFormatter`
.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`
