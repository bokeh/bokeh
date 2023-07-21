.. _ug_interaction_widgets:

Widgets and DOM elements
========================

Widgets are interactive control and display elements that can be added to Bokeh
documents to provide a front end user interface to a visualization. Widgets can
be added directly to the document root or be nested inside a layout.

Bokeh's widgets offer a range of
:ref:`interactive features <ug_interaction_widgets_callbacks>` that you
can use to drive new computations, update plots, and connect to other
programmatic functionality.

Bokeh provides a simple :ref:`default set of widgets
<ug_interaction_widgets_examples>`. You can create your own
custom widgets, or wrap different third party widget libraries by creating
custom extensions as described in :ref:`ug_advanced_extensions`.

.. _ug_interaction_widgets_callbacks:

Widget interactivity
--------------------

While some widgets are only meant to display data, others can be used to
interactively manipulate data and properties of objects in your visualization.

Bokeh uses callbacks to handle these interactions. There are two types of
callbacks:

* :ref:`ug_interaction_js_callbacks`
* :ref:`ug_interaction_python_callbacks`

Which one to use depends on whether you are using
:ref:`Bokeh server <ug_server>` or are generating standalone HTML output:

* If you want to use widgets to interact with Bokeh objects in a **standalone**
  HTML document, the browser needs to handle all interactivity. Therefore,
  you can only use :ref:`ug_interaction_js_callbacks`.
  You can write your own Javascript code, or use Bokeh's pre-defined Python
  conveniences such as the :ref:`js_link <ug_interaction_linked_properties>`
  function or a :class:`~bokeh.models.SetValue` object which generate the
  necessary JavaScript code for you.
* If you want to use widgets in connection with a **Bokeh server**, the server
  can handle some interactivity. This allows you to use :ref:`callbacks
  written in Python <ug_interaction_python_callbacks>`.
  Additionally, since the visualization itself is displayed in a browser, you
  still can use :ref:`ug_interaction_js_callbacks` as
  well!

.. _ug_interaction_widgets_tootltips:

Widget tooltips
---------------

You can attach tooltips to widgets. This can be helpful to provide additional
information about the widget's purpose or use, for example.

Hover over the question mark icon next to "Choose values" to see the tooltip.

.. bokeh-plot:: __REPO__/examples/interaction/tooltips/tooltip_description.py
    :source-position: none

See :ref:`ug_interaction_tooltips_supported` for more information about adding
tooltips to widgets.

.. _ug_interaction_widgets_examples:

Bokeh's built-in widgets
------------------------

The sections below are examples for all widgets available in Bokeh. Many of the
examples produce print output using the JavaScript `console.log` function. You
can see this output in your browser's JavaScript console log.

.. _ug_interaction_widgets_examples_autocompleteinput:

AutocompleteInput
~~~~~~~~~~~~~~~~~

The AutocompleteInput widget is a general-purpose text input widget that uses
a list of possible inputs to provide autocomplete while typing.

The default value for ``search_strategy`` property is ``"starts_with"``, which
will match against the start of the possible inputs. Changing ``search_strategy``
to ``"includes"`` means that matches against any substring of the possible inputs
will be shown:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/autocompleteinput.py
    :source-position: below

More information about buttons can be found in the reference guide entry for
|AutocompleteInput|.

.. _ug_interaction_widgets_examples_button:

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/button.py
    :source-position: below

Use the button's ``button_type`` property to change the style of the button. See
:attr:`~bokeh.models.Button.button_type` for possible values.

Optionally, you can add an icon to a button by passing one of Bokeh's icon
objects to the button's ``icon`` parameter:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/button_icon.py
    :source-position: below

Bokeh supports the following kinds of icons on buttons:

* :class:`~bokeh.models.BuiltinIcon`: A set of built-in icons provided by Bokeh (see :class:`~bokeh.models.BuiltinIcon` for a list of available icons)
* :class:`~bokeh.models.SVGIcon`: An arbitrary SVG icon
* :class:`~bokeh.models.TablerIcon`: An icon from the `Tabler icon set <https://tabler-icons.io/>`_ (requires an active internet connection)

More information about buttons can be found in the reference guide entry for |Button|.

CheckboxButtonGroup
~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/checkbox_button_group.py
    :source-position: below

More information can be found in the reference guide entry for |CheckboxButtonGroup|.

.. _ug_interaction_widgets_examples_checkboxgroup:

CheckboxGroup
~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/checkbox_group.py
    :source-position: below

More information can be found in the reference guide entry for |CheckboxGroup|.

.. _ug_interaction_widgets_examples_colorpicker:

ColorPicker
~~~~~~~~~~~

A widget to allow the user to specify an RGB color value.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/colorpicker.py
    :source-position: below

More information can be found in the reference guide entry for |ColorPicker|.

.. _ug_interaction_widgets_examples_datacube:

DataCube
~~~~~~~~

Bokeh provides a data cube widget based capable of aggregating hierarchical
data. Note that since the data cube is configured with a data source object,
any plots that share this data source will automatically have selections linked
between the plot and the table (even in static HTML documents).

.. bokeh-plot:: __REPO__/examples/interaction/widgets/data_cube.py
    :source-position: below

More information can be found in the reference guide entry for |DataTable|.

.. _ug_interaction_widgets_examples_datatable:

DataTable
~~~~~~~~~

Bokeh provides a sophisticated data table widget. Note that since the table
is configured with a data source object, any plots that share this data source
will automatically have selections linked between the plot and the table (even
in static HTML documents).

.. bokeh-plot:: __REPO__/examples/interaction/widgets/data_table.py
    :source-position: below

More information can be found in the reference guide entry for |DataTable|.

.. _ug_interaction_widgets_examples_date_picker:

DatePicker
~~~~~~~~~~

A widget to allow the user to specify a date value.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/date_picker.py
    :source-position: below

More information can be found in the reference guide entry for |DatePicker|.

.. _ug_interaction_widgets_examples_date_range_picker:

DateRangePicker
~~~~~~~~~~~~~~~

A widget to allow the user to specify a range between two date values.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/date_range_picker.py
    :source-position: below

More information can be found in the reference guide entry for |DateRangePicker|.

.. _ug_interaction_widgets_examples_multiple_date_picker:

MultipleDatePicker
~~~~~~~~~~~~~~~~~~

A widget to allow the user to specify multiple date values.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/multiple_date_picker.py
    :source-position: below

More information can be found in the reference guide entry for |MultipleDatePicker|.

.. _ug_interaction_widgets_examples_datetime_picker:

DatetimePicker
~~~~~~~~~~~~~~

A widget to allow the user to specify a date and time value.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/datetime_picker.py
    :source-position: below

More information can be found in the reference guide entry for |DatetimePicker|.

.. _ug_interaction_widgets_examples_datetime_range_picker:

DatetimeRangePicker
~~~~~~~~~~~~~~~~~~~

A widget to allow the user to specify a range between two date and time values.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/datetime_range_picker.py
    :source-position: below

More information can be found in the reference guide entry for |DatetimeRangePicker|.

.. _ug_interaction_widgets_examples_multiple_datetime_picker:

MultipleDatetimePicker
~~~~~~~~~~~~~~~~~~~~~~

A widget to allow the user to specify multiple date and time values.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/multiple_datetime_picker.py
    :source-position: below

More information can be found in the reference guide entry for |MultipleDatetimePicker|.

.. _ug_interaction_widgets_examples_timepicker:

TimePicker
~~~~~~~~~~

A widget to allow the user to specify a time value.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/time_picker.py
    :source-position: below

More information can be found in the reference guide entry for |TimePicker|.

DateRangeSlider
~~~~~~~~~~~~~~~

The Bokeh date range-slider can be configured with ``start`` and ``end`` date
values, a ``step`` size in units of days, an initial ``value``, and a ``title``:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/daterangeslider.py
    :source-position: below

More information can be found in the reference guide entry for |DateRangeSlider|.

DateSlider
~~~~~~~~~~

The Bokeh date slider can be configured with ``start`` and ``end`` date
values, a ``step`` size in units of days, an initial ``value``, and a ``title``:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/dateslider.py
    :source-position: below

More information can be found in the reference guide entry for |DateSlider|.

DatetimeRangeSlider
~~~~~~~~~~~~~~~~~~~

The Bokeh datetime range slider is the same as the date range slider except
that it uses datetimes that include hours, minutes and seconds:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/datetimerangeslider.py
    :source-position: below

More information can be found in the reference guide entry for |DatetimeRangeSlider|.

.. _ug_interaction_widgets_div:

Div
~~~

A widget for displaying text that can support HTML in a <div> tag:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/div.py
    :source-position: below

More information can be found in the reference guide entry for |Div|.

.. _ug_interaction_widgets_examples_dropdown:

Dropdown
~~~~~~~~

A *button* that displays a drop-down list of mutually exclusive items when
clicked.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/dropdown.py
    :source-position: below

Similar to the :ref:`ug_interaction_widgets_examples_button` widget, the
dropdown button can also use an :class:`~bokeh.models.Icon` (such as
:class:`~bokeh.models.BuiltinIcon`, :class:`~bokeh.models.SVGIcon`, or
:class:`~bokeh.models.TablerIcon`).

More information can be found in the reference guide entry for |Dropdown|.

.. _ug_interaction_widgets_examples_fileinput:

FileInput
~~~~~~~~~

A widget allowing users to choose a file and store its contents.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/fileinput.py
    :source-position: below

More information can be found in the reference guide entry for |FileInput|.

.. _ug_interaction_widgets_examples_helpbutton:

HelpButton
~~~~~~~~~~

A widget that provides a help symbol that displays additional text in a
:class:`~bokeh.models.Tooltip` when hovered over or clicked.

The default behavior of the help button's tooltip is as follows:

* If the mouse is hovered over the help button, the tooltip is closed
  automatically once the mouse is moved away.
* If the help button is clicked, the tooltip will be persistent. The user needs
  to click the "x" symbol in the top right corner of the tooltip to close it.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/helpbutton.py
    :source-position: below

More information can be found in the reference guide entry for |HelpButton|.

.. _ug_interaction_widgets_examples_multichoice:

MultiChoice
~~~~~~~~~~~

A multi-select widget to present multiple available options in a compact
horizontal layout:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/multichoice.py
    :source-position: below

More information can be found in the reference guide entry for |MultiChoice|.

.. _ug_interaction_widgets_examples_multiselect:

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options in vertical list:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/multiselect.py
    :source-position: below

More information can be found in the reference guide entry for |MultiSelect|.

.. _ug_interaction_widgets_examples_numericinput:

NumericInput
~~~~~~~~~~~~

A widget to allow the user to enter a numeric value.

.. bokeh-plot:: __REPO__/examples/interaction/widgets/numericinput.py
    :source-position: below

More information can be found in the reference guide entry for |NumericInput|.

.. _ug_interaction_widgets_paragraph:

Paragraph
~~~~~~~~~

A widget for displaying a block of text in an HTML <p> tag:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/paragraph.py
    :source-position: below

More information can be found in the reference guide entry for |Paragraph|.

.. _ug_interaction_widgets_examples_passwordinput:

PasswordInput
~~~~~~~~~~~~~

A text input that obscures the entered text:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/passwordinput.py
    :source-position: below

More information can be found in the reference guide entry for |PasswordInput|.

PreText
~~~~~~~

A widget for displaying a block of pre-formatted text in an HTML <pre> tag:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/pretext.py
    :source-position: below

More information can be found in the reference guide entry for |PreText|.

RadioButtonGroup
~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at a time:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/radio_button_group.py
    :source-position: below

More information can be found in the reference guide entry for |RadioButtonGroup|.

RadioGroup
~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/radio_group.py
    :source-position: below

More information can be found in the reference guide entry for |RadioGroup|.

.. _ug_interaction_widgets_range_slider:

RangeSlider
~~~~~~~~~~~

The Bokeh range-slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value``, and a ``title``:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/range_slider.py
    :source-position: below

More information can be found in the reference guide entry for |RangeSlider|.

.. _ug_interaction_widgets_examples_select:

Select
~~~~~~

A single selection widget:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/select_widget.py
    :source-position: below

More information can be found in the reference guide entry for |Select|.

.. _ug_interaction_widgets_slider:

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value``, and a ``title``:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/slider.py
    :source-position: below

More information can be found in the reference guide entry for |Slider|.

.. _ug_interaction_widgets_examples_spinner:

Spinner
~~~~~~~

A numeric spinner widget:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/spinner.py
    :source-position: below

More information can be found in the reference guide entry for |Spinner|.

.. _ug_interaction_widgets_examples_switch:

Switch
~~~~~~

An on/off toggle switch:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/switch.py
    :source-position: below

More information can be found in the reference guide entry for |Switch|.

Tabs
~~~~

Tab panes allow multiple plots or layouts to be shown in selectable tabs:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/tab_panes.py
    :source-position: below

More information can be found in the reference guide entry for |Tabs|.

.. _ug_interaction_widgets_examples_textareainput:

TextAreaInput
~~~~~~~~~~~~~

A widget for collecting multiple lines of text from a user:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/textareainput.py
    :source-position: below

More information can be found in the reference guide entry for |TextAreaInput|.

.. _ug_interaction_widgets_examples_textinput:

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/textinput.py
    :source-position: below

More information can be found in the reference guide entry for |TextInput|.

Toggle
~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot:: __REPO__/examples/interaction/widgets/toggle_button.py
    :source-position: below

Like with a standard :ref:`ug_interaction_widgets_examples_button`
widget, the toggle button can also use an :class:`~bokeh.models.Icon` (such as
:class:`~bokeh.models.BuiltinIcon`, :class:`~bokeh.models.SVGIcon`, or
:class:`~bokeh.models.TablerIcon`).

More information can be found in the reference guide entry for |Toggle|.

.. |AutocompleteInput|      replace:: :class:`~bokeh.models.widgets.inputs.AutocompleteInput`
.. |Button|                 replace:: :class:`~bokeh.models.widgets.buttons.Button`
.. |CheckboxButtonGroup|    replace:: :class:`~bokeh.models.widgets.groups.CheckboxButtonGroup`
.. |CheckboxGroup|          replace:: :class:`~bokeh.models.widgets.groups.CheckboxGroup`
.. |ColorPicker|            replace:: :class:`~bokeh.models.widgets.inputs.ColorPicker`
.. |DataCube|               replace:: :class:`~bokeh.models.widgets.tables.DataCube`
.. |DataTable|              replace:: :class:`~bokeh.models.widgets.tables.DataTable`
.. |DatePicker|             replace:: :class:`~bokeh.models.widgets.inputs.DatePicker`
.. |DateRangePicker|        replace:: :class:`~bokeh.models.widgets.inputs.DateRangePicker`
.. |MultipleDatePicker|     replace:: :class:`~bokeh.models.widgets.inputs.MultipleDatePicker`
.. |DatetimePicker|         replace:: :class:`~bokeh.models.widgets.inputs.DatetimePicker`
.. |DatetimeRangePicker|    replace:: :class:`~bokeh.models.widgets.inputs.DatetimeRangePicker`
.. |MultipleDatetimePicker| replace:: :class:`~bokeh.models.widgets.inputs.MultipleDatetimePicker`
.. |TimePicker|             replace:: :class:`~bokeh.models.widgets.inputs.TimePicker`
.. |DateRangeSlider|        replace:: :class:`~bokeh.models.widgets.sliders.DateRangeSlider`
.. |DateSlider|             replace:: :class:`~bokeh.models.widgets.sliders.DateSlider`
.. |DatetimeRangeSlider|    replace:: :class:`~bokeh.models.widgets.sliders.DatetimeRangeSlider`
.. |Div|                    replace:: :class:`~bokeh.models.widgets.markups.Div`
.. |Dropdown|               replace:: :class:`~bokeh.models.widgets.buttons.Dropdown`
.. |FileInput|              replace:: :class:`~bokeh.models.widgets.inputs.FileInput`
.. |HelpButton|             replace:: :class:`~bokeh.models.widgets.buttons.HelpButton`
.. |MultiChoice|            replace:: :class:`~bokeh.models.widgets.inputs.MultiChoice`
.. |MultiSelect|            replace:: :class:`~bokeh.models.widgets.inputs.MultiSelect`
.. |NumericInput|           replace:: :class:`~bokeh.models.widgets.inputs.NumericInput`
.. |Paragraph|              replace:: :class:`~bokeh.models.widgets.markups.Paragraph`
.. |PasswordInput|          replace:: :class:`~bokeh.models.widgets.inputs.PasswordInput`
.. |PreText|                replace:: :class:`~bokeh.models.widgets.markups.PreText`
.. |RadioButtonGroup|       replace:: :class:`~bokeh.models.widgets.groups.RadioButtonGroup`
.. |RadioGroup|             replace:: :class:`~bokeh.models.widgets.groups.RadioGroup`
.. |RangeSlider|            replace:: :class:`~bokeh.models.widgets.sliders.RangeSlider`
.. |Select|                 replace:: :class:`~bokeh.models.widgets.inputs.Select`
.. |Slider|                 replace:: :class:`~bokeh.models.widgets.sliders.Slider`
.. |Spinner|                replace:: :class:`~bokeh.models.widgets.inputs.Spinner`
.. |Switch|                 replace:: :class:`~bokeh.models.widgets.inputs.Switch`
.. |Tabs|                   replace:: :class:`~bokeh.models.layouts.Tabs`
.. |TextAreaInput|          replace:: :class:`~bokeh.models.widgets.inputs.TextAreaInput`
.. |TextInput|              replace:: :class:`~bokeh.models.widgets.inputs.TextInput`
.. |Toggle|                 replace:: :class:`~bokeh.models.widgets.buttons.Toggle`
