.. _userguide_interaction_tooltips:

Adding tooltips
===============

Bokeh supports tooltips on a wide range of UI elements, such as plots
or widgets. You can use tooltips to attach additional information to almost all
parts of your visualization.

A special case of a tooltip are the tooltips displayed by the
:ref:`userguide_tools_hover_tool`. Use the hover tool in case you want to
display tooltips on hover over certain areas of a plot. This tool uses Bokeh's
generic tooltip object behind the scenes, but contains many additional,
specialized features. For more information on configuring a tooltip on a plot
with the HoverTool, see the :ref:`userguide_hover_custom_tooltip` section for
more information.

The Tooltip object
------------------

Bokeh uses the :class:`~bokeh.models.Tooltip` model to manage tooltips.

The ``Tooltip`` object has several properties to customize the behavior and
appearance of tooltips.

See :class:`~bokeh.models.Tooltip` in the |reference guide| for more
information.

Tooltip contents
----------------

The content of a tooltip is defined with the tooltip's ``content`` property.

This content either be a plaintext string or a HTML object:

.. bokeh-plot::
    :source-position: above

    from bokeh.models import Tooltip, TextInput
    from bokeh.models.dom import HTML
    from bokeh.layouts import column
    from bokeh.io import show

    plaintext_tooltip = Tooltip(content="plain text tooltip", position="right")
    html_tooltip = Tooltip(content=HTML("<p>HTML tooltip</p>"), position="right")

    input_with_plaintext_tooltip = TextInput(value="default", title="Label:", description=plaintext_tooltip)
    input_with_html_tooltip = TextInput(value="default", title="Label2:", description=html_tooltip)

    show(column(input_with_plaintext_tooltip, input_with_html_tooltip))


UI elements supporting tooltips
-------------------------------

input widgets
~~~~~~~~~~~~~
ALMOST all children of InputWidget:
Tooltip, AutocompleteInput, ColorPicker, DatePicker, MultiChoice, MultiSelect, NumericInput, PasswordInput, Select, Spinner, TextAreaInput, TextInput

Symbol displayed next to the title - only works if title has a value, otherwise silently ignored! [TBD: do we want to throw an error or a warning if a description is defined, but not a title?]

.. note::
    a single instance of ``Tooltip`` should only be used once. If two widgets
    reference the same instance of a Tooltip, only the first will be displayed:

    .. bokeh-plot::
        :source-position: above

        from bokeh.models import Tooltip, AutocompleteInput, ColorPicker
        from bokeh.layouts import column
        from bokeh.io import show

        tooltip=Tooltip(content="A tooltip", position="right")
        input_widgets = [
            AutocompleteInput(value="AutocompleteInput", title="Choose value:", description=tooltip),  # tooltip displayed here
            ColorPicker(color="red", title="Choose color:", description=tooltip),  # no tooltip displayed here
        ]
        show(column(input_widgets))

    Instead, make sure to use a different Tooltip instance for each widget.

HelpButton
~~~~~~~~~~
Quick way to add additional information to any widget or other UI element, even
those that don't directly support tooltips with a `description` property.
(show an example of a widget and a helpbutton in a row layout)

(potentially: show an example of plut and a helpbutton in a row layout)

Adding tooltip to arbitrary UI elements
---------------------------------------

using the element id!

target property of tooltip

then use
doc.add_root

The inspector tooltip
---------------------
