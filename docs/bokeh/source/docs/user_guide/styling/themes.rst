.. _ug_styling_themes:

Themes
======

.. _ug_styling_using_themes:

Using themes
------------

Bokeh's themes are a set of pre-defined design parameters that you can apply to
your plots. Themes can include settings for parameters such as colors, fonts,
or line styles.

.. _ug_styling_using_themes_built_in:

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

    p = figure(title='dark_minimal', width=300, height=300)
    p.line(x, y)

    show(p)

For more examples and detailed information, see :class:`bokeh.themes`.

.. _ug_styling_using_themes_custom:

Creating custom themes
~~~~~~~~~~~~~~~~~~~~~~

Themes in Bokeh are defined in YAML or JSON files. To create your own theme
files, follow the format defined in :class:`bokeh.themes.Theme`.

Using YAML, for example:

.. code-block:: yaml

    attrs:
        figure:
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
