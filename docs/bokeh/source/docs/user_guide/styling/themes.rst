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

* ``--bokeh-base-font`` to allow setting a custom font
* ``--bokeh-mono-font`` to allow setting a custom mono font
* ``--bokeh-font-size`` to allow setting a custom font size value
* ``--bokeh-font-weight`` to allow setting a custom font weight value
* ``--bokeh-line-height`` to allow setting a custom line height value

For colors related customization, which can be defined using the ``light-dark`` CSS function
to follow the document configuration ``color_scheme``, Bokeh has:

* ``--bokeh-color`` to allow setting a custom text color
* ``--bokeh-background-color`` to allow setting a custom background color
* ``--bokeh-hover-color`` as the color/background color used in the majority of components elements
  when they are on hover
* ``--bokeh-disabled-color`` to allow setting a custom color for disabled components elements
* ``--bokeh-border-color`` to allow setting a custom color for components borders
* ``--bokeh-divider-color`` to allow setting a custom color for components such as menus,
  dropdowns, dialogs and the hover tool which use a divider element
* ``--bokeh-shortcut-color`` to allow setting a custom color for components such as dialogs and menus
  to show shortcut related information
* ``--bokeh-highlight-color`` to allow setting a custom color to outline active/focused components elements
  such as tabs, menu entries, tool buttons, sliders handles, etc
* ``--bokeh-active-bg`` to allow setting a custom color for the background color of active components such
  as switches, progress bars, and sliders
* ``--bokeh-active-border`` to allow setting a custom color for the active border (TODO not being used anywhere? maybe
  remanent of accessibility changes?)
* ``--bokeh-active-fg`` to allow setting a custom color for components such as progress
  bar and switch related elements that show current/selected value
* ``--bokeh-inactive-bg`` as the color used for the background of elements of components such
  as switch and progress bars when they are disabled (background for bar like elements)
* ``--inactive-fg`` as the color value used for the background of elements of components such
  as switch and progress bars when they are disabled (background for value bar and knob like
  elements)
* ``--bokeh-icon-color`` to allow setting a custom icon color
* ``--bokeh-icon-color-disabled`` to allow setting a custom disabled icon color
* ``--bokeh-error`` to allow setting a custom color for the tabs close icon when hovered
* ``--bokeh-inverted-color`` as the color for when the background is dark regardless of color scheme
  selected
* ``--bokeh-placeholder-color`` to allow setting a custom color for input like components placeholder element
* ``--bokeh-surface-background-color`` used for input like components as well as sliders and dropdowns
  elements background color
* ``--bokeh-disabled-background-color`` to allow setting a custom color for the majority of disabled components
  background
* ``--bokeh-input-focus-border-color``
* ``--bokeh-input-focus-halo-color``

For border related customization Bokeh has:

* ``--bokeh-border-radius``
* ``--bokeh-border-style``
* ``--bokeh-border-width``
* ``--bokeh-border`` to allow setting a custom value for an otherwise predefined border that uses
  ``--bokeh-border-color``, ``--bokeh-border-style`` and ``--bokeh-border-width``

For the box-shadow property customization (mainly used for button and menu like widgets and panes), Bokeh has:

* ``--bokeh-box-shadow-color`` to allow setting a custom color for the box-shadow related property mainly
  used by menus and drawers
* ``--bokeh-box-shadow-inset`` to allow setting a custom value for an otherwise predefined inset box shadow definition
  that uses ``--bokeh-box-shadow-color`` as color
* ``--bokeh-box-shadow-x-symmetric`` to allow setting a custom value for an otherwise predefined x-axis symetric
  box shadow definition that uses ``--bokeh-box-shadow-color`` as color
* ``--bokeh-box-shadow`` to allow setting a custom box shadow definition which otherwise uses ``--box-shadow-color``
  as color

For outline property customization Bokeh has:

* ``--bokeh-outline-color``
* ``--bokeh-outline-style``
* ``--bokeh-outline-width``
* ``--bokeh-outline-offset``
* ``--bokeh-outline`` to allow setting a custom outline which otherwise uses ``--outline-color``, ``--outline-style``
  and ``--outline-width``

For tools (tool buttons and toolbar) Bokeh has:

* ``--bokeh-active-tool-border-color``
* ``--bokeh-active-tool-background``
* ``--bokeh-tool-button-width``
* ``--bokeh-tool-button-height``
* ``--bokeh-toolbar-divider-color``
* ``--bokeh-disabled-tool-color``

For buttons colors (following the different buttons types and their properties and states) Bokeh has:

* ``--bokeh-default-color``
* ``--bokeh-default-border-color``
* ``--bokeh-default-hover-color``
* ``--bokeh-default-active-color``
* ``--bokeh-default-disabled-color``
* ``--bokeh-default-disabled-border-color``
* ``--bokeh-primary-color``
* ``--bokeh-primary-hover-color``
* ``--bokeh-primary-disabled-color``
* ``--bokeh-success-color``
* ``--bokeh-success-hover-color``
* ``--bokeh-success-disabled-color``
* ``--bokeh-warning-color``
* ``--bokeh-warning-hover-color``
* ``--bokeh-warning-disabled-color``
* ``--bokeh-danger-color``
* ``--bokeh-danger-hover-color``
* ``--bokeh-danger-disabled-color``

For tooltip Bokeh has:

* ``--bokeh-tooltip-border-color``

For menus Bokeh has:

* ``--bokeh-menu-item-hover-text-decoration``

Other variables:

* ``--bokeh-top-level`` as the base value for the ``z-index`` property of several components
  like menus, dropdowns, etc.
* ``--bokeh-padding-vertical``
* ``--bokeh-padding-horizontal``
* ``--bokeh-divider-width``
* ``--bokeh-divider`` to allow setting a custom style for borders used as divider which otherwise
  uses the ``--bokeh-divider-color``

Via the definition of a custom stylesheet a component then can modify this values to
customize its appearance. Examples of this type of customization are available under
``examples/styling/accessible-style``, ``examples/styling/office-style`` and
``examples/styling/xkcd-style``
