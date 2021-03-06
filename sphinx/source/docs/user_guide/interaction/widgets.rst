.. _userguide_interaction_widgets:

Adding widgets
==============

Widgets are interactive controls that can be added to Bokeh applications to
provide a front end user interface to a visualization. They can drive new
computations, update plots, and connect to other programmatic functionality.
When used with the Bokeh server, widgets can run arbitrary Python code, enabling
complex applications. Widgets can also be used without the Bokeh server in
standalone HTML documents through the browser's JavaScript runtime.

.. _userguide_interaction_widgets_callbacks:

Callbacks
---------

To use widgets, you must add them to your document and define their callbacks.
Widgets can be added directly to the document root or nested inside a layout.
There are two ways to use a widget's functionality:

    * A ``CustomJS`` callback (see :ref:`userguide_interaction_jscallbacks`).
      This approach will work in standalone HTML documents or Bokeh server apps.
    * Use ``bokeh serve`` to start a Bokeh server and set up event handlers with
      ``.on_change`` (or for some widgets, ``.on_click``).

Event handlers are Python functions that users can attach to widgets. These
functions are then called when certain attributes on the widget are changed.
The function signature of event handlers is determined by how they are attached
to widgets (whether by ``.on_change`` or ``.on_click``, for example).

All widgets have an ``.on_change`` method that takes an attribute name and one
or more event handlers as parameters. These handlers are expected to have the
function signature, ``(attr, old, new)``, where ``attr`` refers to the changed
attribute's name, and ``old`` and ``new`` refer to the previous and updated
values of the attribute.

.. code-block:: python

    def my_text_input_handler(attr, old, new):
        print("Previous label: " + old)
        print("Updated label: " + new)

    text_input = TextInput(value="default", title="Label:")
    text_input.on_change("value", my_text_input_handler)

Additionally, some widgets, including the button, dropdown, and checkbox, have
an ``.on_click`` method that takes an event handler as its only parameter. For
a plain ``Button``, this handler is called without parameters. For the other
widgets with ``.on_click``, the handler is passed the new attribute value.

.. code-block:: python

    def my_radio_handler(new):
        print 'Radio button option ' + str(new) + ' selected.'

    radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
    radio_group.on_click(my_radio_handler)

Bokeh provides a simple default set of widgets. Users can create their own
custom widgets, or wrap different third party widget libraries by creating
custom extensions as described in :ref:`userguide_extensions`.

For more information about the attributes to watch using ``.on_change``, see the
:ref:`refguide`. (Information about widgets is found under :ref:`bokeh.models`.)

.. _userguide_interaction_widgets_examples:

Examples
--------

The sections below collect short but complete examples of using all the built-in
widgets. Many of the examples print output that can be observed by looking at
your browser JavaScript console log.

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot:: docs/user_guide/examples/interaction_button.py
    :source-position: below

More information can be found in the Reference for |Button|.

CheckboxButtonGroup
~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot:: docs/user_guide/examples/interaction_checkbox_button_group.py
    :source-position: below

More information can be found in the Reference for |CheckboxButtonGroup|.

CheckboxGroup
~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot:: docs/user_guide/examples/interaction_checkbox_group.py
    :source-position: below

More information can be found in the Reference for |CheckboxGroup|.

ColorPicker
~~~~~~~~~~~

A widget to allow the user to specify an RGB color value.

.. bokeh-plot:: docs/user_guide/examples/interaction_colorpicker.py
    :source-position: below

More information can be found in the Reference for |ColorPicker|.

DataTable
~~~~~~~~~

Bokeh provides a sophisticated data table widget based on SlickGrid. Note
that since the table is configured with a data source object, any plots that
share this data source will automatically have selections linked between the
plot and the table (even in static HTML documents).

.. bokeh-plot:: docs/user_guide/examples/interaction_data_table.py
    :source-position: below

More information can be found in the Reference for |DataTable|.

DatePicker
~~~~~~~~~~~

A widget to allow the user to specify a date value.

.. bokeh-plot:: docs/user_guide/examples/interaction_datepicker.py
    :source-position: below

More information can be found in the Reference for |DatePicker|.

DateRangeSlider
~~~~~~~~~~~~~~~

The Bokeh date range-slider can be configured with ``start`` and ``end`` date
values, a ``step`` size, an initial ``value``, and a ``title``:

.. bokeh-plot:: docs/user_guide/examples/interaction_daterangeslider.py
    :source-position: below

More information can be found in the Reference for |DateRangeSlider|.

Div
~~~

A widget for displaying text that can support HTML in a <div> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_div.py
    :source-position: below

More information can be found in the Reference for |Div|.

Dropdown
~~~~~~~~

A *button* that displays a drop-down list of mutually exclusive items when
clicked.

.. bokeh-plot:: docs/user_guide/examples/interaction_dropdown.py
    :source-position: below

More information can be found in the Reference for |Dropdown|.

FileInput
~~~~~~~~~

A widget allowing users to choose a file and store its contents.

.. bokeh-plot:: docs/user_guide/examples/interaction_fileinput.py
    :source-position: below

More information can be found in the Reference for |FileInput|.

MultiChoice
~~~~~~~~~~~

A multi-select widget to present multiple available options in a compact
horizontal layout:

.. bokeh-plot:: docs/user_guide/examples/interaction_multichoice.py
    :source-position: below

More information can be found in the Reference for |MultiChoice|.

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options in vertical list:

.. bokeh-plot:: docs/user_guide/examples/interaction_multiselect.py
    :source-position: below

More information can be found in the Reference for |MultiSelect|.

Paragraph
~~~~~~~~~

A widget for displaying a block of text in an HTML <p> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_paragraph.py
    :source-position: below

More information can be found in the Reference for |Paragraph|.

PasswordInput
~~~~~~~~~~~~~

A text input that obscures the entered text:

.. bokeh-plot:: docs/user_guide/examples/interaction_passwordinput.py
    :source-position: below

More information can be found in the Reference for |PasswordInput|.

PreText
~~~~~~~

A widget for displaying a block of pre-formatted text in an HTML <pre> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_pretext.py
    :source-position: below

More information can be found in the Reference for |PreText|.

RadioButtonGroup
~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at a time:

.. bokeh-plot:: docs/user_guide/examples/interaction_radio_button_group.py
    :source-position: below

More information can be found in the Reference for |RadioButtonGroup|.

RadioGroup
~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot:: docs/user_guide/examples/interaction_radio_group.py
    :source-position: below

More information can be found in the Reference for |RadioGroup|.

RangeSlider
~~~~~~~~~~~

The Bokeh range-slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value``, and a ``title``:

.. bokeh-plot:: docs/user_guide/examples/interaction_range_slider.py
    :source-position: below

More information can be found in the Reference for |RangeSlider|.

Select
~~~~~~

A single selection widget:

.. bokeh-plot:: docs/user_guide/examples/interaction_select.py
    :source-position: below

More information can be found in the Reference for |Select|.

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value``, and a ``title``:

.. bokeh-plot:: docs/user_guide/examples/interaction_slider.py
    :source-position: below

More information can be found in the Reference for |Slider|.

Spinner
~~~~~~~

A numeric spinner widget:

.. bokeh-plot:: docs/user_guide/examples/interaction_spinner.py
    :source-position: below

More information can be found in the Reference for |Spinner|.

Tabs
~~~~

Tab panes allow multiple plots or layouts to be shown in selectable tabs:

.. bokeh-plot:: docs/user_guide/examples/interaction_tab_panes.py
    :source-position: below

More information can be found in the Reference for |Tabs|.

TextAreaInput
~~~~~~~~~~~~~

A widget for collecting multiple lines of text from a user:

.. bokeh-plot:: docs/user_guide/examples/interaction_textareainput.py
    :source-position: below

More information can be found in the Reference for |TextAreaInput|.

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot:: docs/user_guide/examples/interaction_textinput.py
    :source-position: below

More information can be found in the Reference for |TextInput|.

Toggle
~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot:: docs/user_guide/examples/interaction_toggle_button.py
    :source-position: below

More information can be found in the Reference for |Toggle|.

.. |Button|                 replace:: :class:`~bokeh.models.widgets.buttons.Button`
.. |CheckboxButtonGroup|    replace:: :class:`~bokeh.models.widgets.groups.CheckboxButtonGroup`
.. |CheckboxGroup|          replace:: :class:`~bokeh.models.widgets.groups.CheckboxGroup`
.. |ColorPicker|            replace:: :class:`~bokeh.models.widgets.inputs.ColorPicker`
.. |DataTable|              replace:: :class:`~bokeh.models.widgets.tables.DataTable`
.. |DatePicker|             replace:: :class:`~bokeh.models.widgets.inputs.DatePicker`
.. |DateRangeSlider|        replace:: :class:`~bokeh.models.widgets.sliders.DateRangeSlider`
.. |Div|                    replace:: :class:`~bokeh.models.widgets.markups.Div`
.. |Dropdown|               replace:: :class:`~bokeh.models.widgets.buttons.Dropdown`
.. |FileInput|              replace:: :class:`~bokeh.models.widgets.inputs.FileInput`
.. |MultiChoice|            replace:: :class:`~bokeh.models.widgets.inputs.MultiChoice`
.. |MultiSelect|            replace:: :class:`~bokeh.models.widgets.inputs.MultiSelect`
.. |Paragraph|              replace:: :class:`~bokeh.models.widgets.markups.Paragraph`
.. |PasswordInput|          replace:: :class:`~bokeh.models.widgets.inputs.PasswordInput`
.. |PreText|                replace:: :class:`~bokeh.models.widgets.markups.PreText`
.. |RadioButtonGroup|       replace:: :class:`~bokeh.models.widgets.groups.RadioButtonGroup`
.. |RadioGroup|             replace:: :class:`~bokeh.models.widgets.groups.RadioGroup`
.. |RangeSlider|            replace:: :class:`~bokeh.models.widgets.sliders.RangeSlider`
.. |Select|                 replace:: :class:`~bokeh.models.widgets.inputs.Select`
.. |Slider|                 replace:: :class:`~bokeh.models.widgets.sliders.Slider`
.. |Spinner|                replace:: :class:`~bokeh.models.widgets.inputs.Spinner`
.. |Tabs|                   replace:: :class:`~bokeh.models.layouts.Tabs`
.. |TextAreaInput|          replace:: :class:`~bokeh.models.widgets.inputs.TextAreaInput`
.. |TextInput|              replace:: :class:`~bokeh.models.widgets.inputs.TextInput`
.. |Toggle|                 replace:: :class:`~bokeh.models.widgets.buttons.Toggle`
