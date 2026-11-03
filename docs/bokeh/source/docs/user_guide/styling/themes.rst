.. _ug_styling_themes:

Themes
======

.. _ug_styling_using_themes:

Using themes, CSS variables and custom stylesheets
--------------------------------------------------

Bokeh's themes are a set of pre-defined design parameters that you can apply to
your plots. Themes can include settings for parameters such as colors, fonts,
or line styles.

Besides those, Bokeh defines a set of CSS variables that you can use to customize
widgets and in general DOM based components.

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
    from bokeh.plotting import figure, show

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    curdoc().theme = 'dark_minimal'

    p = figure(title='dark_minimal', width=300, height=300)
    p.line(x, y)

    show(p, filename="dark_minimal.html")

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

.. _ug_styling_using_css_variables_built_in:

Available Bokeh's built-in CSS variables
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh has a set of CSS variables related with theme/color scheme which include a series
of reusable color definitions as well as base style properties which the DOM based
components follow. There are variables available for properties like font, line height,
border/outline, padding, as well as specific widget related variables for tools, tooltip,
buttons and menus and definition of a set of colors to handle components different states
(active, disabled, on hover, focused, etc).

For font related customization Bokeh has:

* ``--bokeh-base-font`` to allow setting a custom font to use
* ``--bokeh-mono-font`` to allow setting a custom mono font to use
* ``--bokeh-font-size```to allow setting a custom font size value
* ``--base-font`` as the actual variable used for components that handles as fallback
  values for font ``Helvetica``, ``Arial`` and ``sans-serif`` in case ``--bokeh-base-font``
  has an invalid value
* ``--mono-font`` as the actual variable used for components that handles as fallback
  value for mono font ``monospace``in case ``--bokeh-mono-font`` has an invalid value
* ``--font-size`` as the actual variable used for components that handles as fallback
  mono font ``12px`` in case ``--bokeh-font-size`` has an invalid value
* ``--font-weight`` as the font weight value (defaults to ``normal``)
* ``--line-height`` as the line height constant value (defaults to ``calc(20 / 14)``)
* ``--line-height-computed`` as computed value for line height which products
  ``--font-size`` and ``--line-height``

For colors related customization, which in their majority offer light and dark values
following the document configuration ``color_scheme`` value as long as they are defined using
the ``light-dark`` CSS function, Bokeh has:

* ``--bokeh-icon-color`` to allow setting a custom icon color to use
* ``--bokeh-icon-color-disabled`` to allow setting a custom icon disabled color to use
* ``--color`` as the text color used in the majority of components
* ``--background-color`` as the color used in the majority of components
  for their background color
* ``--hover-color`` as the color used in the majority of components for on hover elements
  background color
* ``--disabled-color`` as the color used in the majority of disabled components elements for
  text and background color
* ``--border-color`` as the color used in the majority of components borders
* ``--divider-color`` as the divider color value used for components such as menus,
  dropdowns, dialogs and the hover tool
* ``--shortcut-color`` as the color value used for components such as dialogs and menus
  to show shortcut related information
* ``--highlight-color`` as the color value used to outline active/focused components elements
  such as tabs, menu entries, tool buttons, sliders handles, etc
* ``--active-bg`` and ``--active-background-color`` as the color value used for the background
  color of active components such as switch, progress bars, and sliders
* ``--active-border`` as the active border color value (TODO not being used anywhere? maybe
  remanent of accessibility changes?)
* ``--active-fg`` as the color value used for components such as progress
  bar and switch to show current/selected value
* ``--inactive-bg`` as the color used for the background of elements of components such
  as switch and progress bars when they are disabled (background for bar like elements)
* ``--inactive-fg`` as the color value used for the background of elements of components such
  as switch and progress bars when they are disabled (background for value bar and knob like
  elements)
* ``--icon-color`` as the actual variable used for icons that handles as fallback value
  ``#colors[icon]``
* ``--icon-color-disabled``: as the actual variable used for disabled icons color that
  handles as fallback value ``#colors[icon-disabled]``
* ``--error`` as the color used for the tabs close icon when hovered
* ``--inverted-color`` as the color for when the background is dark regardless of color scheme
  selected
* ``--placeholder-color`` as the input placeholder element color
* ``--surface-background-color`` used for input like components as well as sliders and dropdowns
  elements background color
* ``--disabled-background-color``
* ``--input-focus-border-color``
* ``--input-focus-halo-color``

For border related customization Bokeh has:

* ``--border-radius``
* ``--border-top-left-radius`` (equal to ``--border-radius``)
* ``--border-top-right-radius`` (equal to ``--border-radius``)
* ``--border-bottom-left-radius`` (equal to ``--border-radius``)
* ``--border-bottom-right-radius`` (equal to ``--border-radius``)
* ``--border-style``
* ``--border-width``
* ``--border`` as the value for the border property using ``--border-color``, ``--border-style`` and
  ``--border-width``

For the box-shadow property customization (mainly used for button and menu like widgets), Bokeh has:

* ``--box-shadow-color``
* ``--box-shadow-inset`` as predefined inset box shadow definition using ``--box-shadow-color`` as color
* ``--box-shadow-x-symmetric`` as a predefined x-axis symetric box shadow definition using
  ``--box-shadow-color`` as color
* ``--box-shadow`` as a box shadow definition using ``--box-shadow-color`` as color

For outline property customization Bokeh has:

* ``--outline-color``
* ``--outline-style``
* ``--outline-width``
* ``--outline-offset``
* ``--outline`` as a predifined outline using ``--outline-color``, ``--outline-style`` and ``--outline-width``

For tools (tool buttons and toolbar) Bokeh has:

* ``--bokeh-tool-button-width`` as a way to define tool buttons width
* ``--bokeh-tool-button-height`` as a way to define tool buttons height
* ``--bokeh-toolbar-divider-color`` as a way to define toolbar divider border color
* ``--active-tool-border-color``
* ``--active-tool-background``
* ``--button-width`` as the actual value for tool buttons width using ``--bokeh-tool-button-width``
  if it is defined
* ``--button-height`` as the actual value for tool buttons height using ``--bokeh-tool-button-height``
  if it is defined
* ``--button-color`` as the actual value for toolbar divider border color using ``--bokeh-toolbar-divider-color``
  if it is defined
* ``--disabled-tool-color``

For buttons colors (following the different buttons types and their properties and states) Bokeh has:

* ``--default-color``
* ``--default-border-color``
* ``--default-hover-color``
* ``--default-active-color``
* ``--default-disabled-color``
* ``--default-disabled-border-color``
* ``--primary-color``
* ``--primary-hover-color``
* ``--primary-disabled-color``
* ``--success-color``
* ``--success-hover-color``
* ``--success-disabled-color``
* ``--warning-color``
* ``--warning-hover-color``
* ``--warning-disabled-color``
* ``--danger-color``
* ``--danger-hover-color``
* ``--danger-disabled-color``

For tooltip Bokeh has:

* ``--tooltip-border-color``

For menus Bokeh has:

* ``--menu-item-hover-text-decoration``

Other variables:

* ``--bokeh-top-level`` as the base value for the ``z-index`` property of several components
  like menus, dropdowns, etc.
* ``--padding-vertical``
* ``--padding-horizontal``
* ``--divider-width``
* ``--divider`` as a predefined border style that uses the ``--divider-color``

Via the definition of a custom stylesheet a component then can modify this values to
customize its appearance. Examples of this type of customization are available under
``examples/styling/accessible-style``, ``examples/styling/office-style`` and
``examples/styling/xkcd-style``
