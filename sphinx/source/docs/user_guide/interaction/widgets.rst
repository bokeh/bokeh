.. _userguide_interaction_widgets:

Adding widgets
==============

Widgets are interactive control and display elements that can be added to Bokeh
documents to provide a front end user interface to a visualization. Widgets can
be added directly to the document root or nested inside a layout.

You can use widgets to drive new computations, update plots, and connect to
other programmatic functionality. When used with the :ref:`Bokeh server
<userguide_server>`, widgets can run arbitrary Python code, enabling complex
applications. Widgets can also be used without the Bokeh server in standalone
HTML documents through the browser's JavaScript runtime.

Bokeh provides a simple :ref:`default set of widgets
<userguide_interaction_widgets_examples>`. You can create your own
custom widgets, or wrap different third party widget libraries by creating
custom extensions as described in :ref:`userguide_extensions`.

.. _userguide_interaction_widgets_callbacks:

Widget interactivity
--------------------

While some widgets are only meant to display data, others can be used to
interactively manipulate data and properties of objects in your visualization.

Bokeh uses callbacks to handle these interactions. There are two types of
callbacks:

* :ref:`userguide_interaction_widgets_callbacks_javascript`
* :ref:`userguide_interaction_widgets_callbacks_python`

Which one to use depends on whether you are using Bokeh server or are generating
standalone HTML output:

* If you want to use widgets to interact with Bokeh objects in a **standalone**
  HTML document, the browser needs to handle all interactivity. Therefore,
  you can only use :ref:`userguide_interaction_widgets_callbacks_javascript`.
  You can write your own Javascript code, or use Bokeh's pre-defined Python
  conveniences such as the :ref:`js_link <userguide_interaction_linked_properties>` function or a SetValue object
  which generate the necessary JavaScript code for you.
* If you want to use widgets in connection with a **Bokeh server**, the server
  can handle some interactivity. This allows you to use :ref:`callbacks
  written in Python <userguide_interaction_widgets_callbacks_python>`.
  Additionally, since the visualization itself is displayed in a browser, you
  still can use :ref:`userguide_interaction_widgets_callbacks_javascript` as
  well!

.. _userguide_interaction_widgets_callbacks_javascript:

JavaScript callbacks
~~~~~~~~~~~~~~~~~~~~

The simplest version of interactive callbacks are JavaScript callbacks that run
directly in the browser.

Every widget has a ``.js_on_change`` property. The callback assigned to this
property will be called whenever the state of the widget changes.

Some widget also have a``.js_on_event`` property. The callback assigned to this
property will be called whenever an event occurs in the browser. [TBD: do any widgets other than button/dropdownbutton use this?]

There are three options for generating a JavaScript callback:


* Using the ``js_link`` Python convenience method:

* using the SetValue Python object
    var

* writing custom JavaScript code with the CustomJS object





For more information about the attributes to watch using ``.js_on_change``, see the
respective entry for a widget under |bokeh.models| in the |reference guide|.


https://docs.bokeh.org/en/latest/docs/gallery/color_sliders.html

.. Warning::
    The explicit purpose of the ``CustomJS`` Model is to embed raw JavaScript
    code for a browser to execute. If any part of the code is derived from
    untrusted user inputs, then you must take appropriate care to sanitize the
    user input prior to passing it to Bokeh.


.. _userguide_interaction_widgets_callbacks_python:

Python callbacks
~~~~~~~~~~~~~~~~

Python callbacks (sometimes also called *event handlers*) are Python functions
that you can attach to widgets. These callbacks are only available in connection
with the :ref:`Bokeh server <userguide_server>`

These
functions are called when certain attributes on the widget are changed.
The function signature of event handlers is determined by how they are attached
to widgets (whether by ``.on_change`` or ``.on_event``, for example).

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
an ``.on_event`` method that takes an event handler as its only parameter. For
a plain ``Button``, this handler is called without parameters. For the other
widgets with ``.on_event``, the handler is passed the new attribute value.

.. code-block:: python

    def my_radio_handler(new):
        print('Radio button option ' + str(new) + ' selected.')

    radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
    radio_group.on_event('button_click', my_radio_handler)

https://github.com/bokeh/bokeh/tree/master/examples/app/weather

.. raw:: html

    <div>
    <iframe
        src="https://demo.bokeh.org/sliders"
        frameborder="0"
        style="overflow:hidden;height:400px;width: 90%;

        -moz-transform-origin: top left;
        -webkit-transform-origin: top left;
        -o-transform-origin: top left;
        -ms-transform-origin: top left;
        transform-origin: top left;"
        height="460"
    ></iframe>
    </div>




For more information about the attributes to watch using ``.on_change``, see the
respective entry for a widget under |bokeh.models| in the |reference guide|.

.. _userguide_interaction_widgets_tootltips:

Widget tooltips
---------------

[TBD]

.. _userguide_interaction_widgets_examples:

Bokeh's built-in widgets
------------------------

The sections below are examples for all widgets available in Bokeh. Many of the
examples print output that can be observed by looking at your browser's
JavaScript console log.

.. _userguide_interaction_widgets_examples_button:

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot:: docs/user_guide/examples/interaction_button.py
    :source-position: below

Use the button's ``button_type`` property to change the style of the button. See
:class:`~bokeh.core.enums.ButtonType` for possible values.`

Optionally, you can add an icon to a button by passing an :class:`~bokeh.models.ui.Icon`
Icon object to the
button's ``icon`` parameter:

.. bokeh-plot:: docs/user_guide/examples/interaction_button_icon.py
    :source-position: below

Bokeh supports the following kinds of icons on buttons:

* :class:`~bokeh.models.BuiltinIcon`: A set of built-in icons provided by Bokeh (see :class:`~bokeh.models.BuiltinIcon` for a list of available icons)
* :class:`~bokeh.models.SVGIcon`: An arbitrary SVG icon
* :class:`~bokeh.models.TablerIcon`: An icon from the `Tabler icon set <https://tabler-icons.io/>`_ (requires an active internet connection)

More information about buttons can be found in the Reference for |Button|.

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

.. _userguide_interaction_widgets_examples_datatable:

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
values, a ``step`` size in units of days, an initial ``value``, and a ``title``:

.. bokeh-plot:: docs/user_guide/examples/interaction_daterangeslider.py
    :source-position: below

More information can be found in the Reference for |DateRangeSlider|.

DatetimeRangeSlider
~~~~~~~~~~~~~~~~~~~

The Bokeh datetime range slider is the same as the date range slider except
that it uses datetimes that include hours, minutes and seconds:

.. bokeh-plot:: docs/user_guide/examples/interaction_datetimerangeslider.py
    :source-position: below

More information can be found in the Reference for |DatetimeRangeSlider|.

.. _userguide_interaction_widgets_div:

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

Similar to the :ref:`userguide_interaction_widgets_examples_button` widget, the
dropdown button can also use an :class:`~bokeh.models.icons.Icon`.

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

.. _userguide_interaction_widgets_paragraph:

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

.. _userguide_interaction_widgets_range_slider:

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

.. _userguide_interaction_widgets_slider:

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
.. |DatetimeRangeSlider|    replace:: :class:`~bokeh.models.widgets.sliders.DatetimeRangeSlider`
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
