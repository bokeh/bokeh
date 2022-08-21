.. _userguide_interaction_tooltips:

Adding tooltips
===============

Bokeh supports tooltips on a wide range of UI elements, such as plots or
widgets. You can use tooltips to attach additional information to almost any
part of your visualization.

.. note::
    A special case of a tooltip are the tooltips displayed by the
    :ref:`userguide_tools_hover_tool`. Use the hover tool in case you want to
    display tooltips on hover over certain areas of a plot. This tool uses
    Bokeh's generic tooltip object behind the scenes, but contains many
    additional, specialized features. For more information about configuring a
    tooltip on a plot with the HoverTool, see the
    :ref:`userguide_tools_basic_tooltips` section for more information.

The Tooltip object
------------------

Bokeh uses the :class:`~bokeh.models.Tooltip` model to manage tooltips. The
``Tooltip`` object has several properties to customize the behavior and
appearance of tooltips. See :class:`~bokeh.models.Tooltip` in the
|reference guide| for additional information.

Tooltip contents
----------------

The content of a ``Tooltip`` is defined with its ``content`` property.

This content either can be either a plaintext string or an HTML object:

.. bokeh-plot::
    :source-position: above

    from bokeh.models import Tooltip, TextInput
    from bokeh.models.dom import HTML
    from bokeh.layouts import column
    from bokeh.io import show

    plaintext_tooltip = Tooltip(content="plain text tooltip", position="right")
    html_tooltip = Tooltip(content=HTML("<b>HTML</b> tooltip"), position="right")

    input_with_plaintext_tooltip = TextInput(value="default", title="Label:", description=plaintext_tooltip)
    input_with_html_tooltip = TextInput(value="default", title="Label2:", description=html_tooltip)

    show(column(input_with_plaintext_tooltip, input_with_html_tooltip))

Hover over or tap the "?" Symbol next to the inputs' titles to see the
tooltips in action.

.. note::
    Currently, the ``Tooltip`` object requires at minimum the ``content`` and
    ``position`` properties to be set. The tooltip will not be rendered if
    either of those two properties does not have a value assigned to it.

.. _userguide_interaction_tooltips_supported:

UI elements supporting tooltips
-------------------------------

Several of Bokeh's objects have built-in support for tooltips.

Input widgets
~~~~~~~~~~~~~

All descendants of the :class:`~bokeh.models.InputWidget` base class have
built-in support for tooltips. These inputs have a ``description`` property
that takes a :class:`~bokeh.models.Tooltip` object as its value. The tooltips
defined by the ``description`` property are displayed when a user hovers or
taps the "?" symbol next to the input widget's title:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import show
    from bokeh.models import MultiChoice, Tooltip

    OPTIONS = ["foo", "bar", "baz", "quux"]

    tooltip = Tooltip(content="Choose any number of the predefined items", position="right")

    multi_choice = MultiChoice(value=OPTIONS[:2], options=OPTIONS, title="Choose values:", description=tooltip)

    show(multi_choice)

.. note::
    Since the ``description`` tooltip is tied to the input widget's title, this only
    works if the widget's ``title`` parameter has a value. If the widget has no
    title, the tooltip defined with the ``description`` parameter will not be
    displayed.

Currently, the following input widgets support tooltips directly:

* :ref:`userguide_interaction_widgets_examples_autocompleteinput`
* :ref:`userguide_interaction_widgets_examples_colorpicker`
* :ref:`userguide_interaction_widgets_examples_datepicker`
* :ref:`userguide_interaction_widgets_examples_fileinput`
* :ref:`userguide_interaction_widgets_examples_multichoice`
* :ref:`userguide_interaction_widgets_examples_multiselect`
* :ref:`userguide_interaction_widgets_examples_numericinput`
* :ref:`userguide_interaction_widgets_examples_passwordinput`
* :ref:`userguide_interaction_widgets_examples_select`
* :ref:`userguide_interaction_widgets_examples_spinner`
* :ref:`userguide_interaction_widgets_examples_textareainput`
* :ref:`userguide_interaction_widgets_examples_textinput`

.. tip::
    A single instance of ``Tooltip`` should only be used once. If two widgets
    reference the same instance of a Tooltip, only the first one will be
    displayed:

    .. bokeh-plot::
        :source-position: above

        from bokeh.models import Tooltip, AutocompleteInput, ColorPicker
        from bokeh.layouts import column
        from bokeh.io import show

        tooltip=Tooltip(content="Enter a value", position="right")
        input_widgets = [
            AutocompleteInput(value="AutocompleteInput", title="Choose value:", description=tooltip),  # tooltip displayed here
            ColorPicker(color="red", title="Choose color:", description=tooltip),  # no tooltip displayed here
        ]
        show(column(input_widgets))

    Instead, make sure to use a different instance of ``Tooltip`` for each
    widget.

HelpButton
~~~~~~~~~~

If you want to add a tooltip with additional information to an UI element that
doesn't have built-in support for tooltips, you can use the
:ref:`userguide_interaction_widgets_examples_helpbutton`. This widget adds a
button with a "?" symbol. When the button is clicked or hovered over, the
``Tooltip`` object passed to the HelpButton's ``tooltip`` property is displayed.

.. bokeh-plot::
    :source-position: above

    from bokeh.models import HelpButton, RadioButtonGroup, Tooltip
    from bokeh.io import show
    from bokeh.layouts import row

    LABELS = ["Option 1", "Option 2", "Option 3"]

    radio_button_group = RadioButtonGroup(labels=LABELS, active=0)
    tooltip = Tooltip(content=f"Select one of the following options: {', '.join(LABELS)}", position="right")
    help_button = HelpButton(tooltip=tooltip)

    show(row(radio_button_group, help_button))

See :ref:`userguide_interaction_widgets_examples_helpbutton` for more
information.

Adding tooltip to arbitrary UI elements
---------------------------------------

In addition to adding tooltips to :ref:`elements that specifically support it
<userguide_interaction_tooltips_supported>`, you can also add tooltips to
arbitrary UI element.

Use the ``target`` property of a ``Tooltip`` object to link this tooltip to an
UI element. The target property accepts to ways to identify which UI element
you want to attach the tooltip to:

* an instance of any Bokeh model
* an instance of one of the :class:`~bokeh.models.selectors` models representing
  a CSS selector for the element you want to attach the tooltip to

After defining your Tooltip object and specifying the target, you need to add
the tooltip to the :class:`~bokeh.document`.

The following example uses both a Bokeh model (for ``text_input``) and a
:class:`~bokeh.models.selectors` object (for ``div``) to attach a tooltip:

TBD: create new document, add objects, and generate output

The inspector tooltip
---------------------

helpful for development.
user this tooltip to get an overview of the current state of the Bokeh document
and its contents.
