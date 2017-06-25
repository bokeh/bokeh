.. _userguide_interaction_widgets:

Adding Widgets
--------------

Widgets are interactive controls that can be added to Bokeh applications to
provide a front end user interface to a visualization. They can drive new computations,
update plots, and connect to other programmatic functionality. When used with the
Bokeh server, widgets can run arbitrary Python code, enabling complex applications.
Widgets can also be used without the Bokeh server in standalone HTML documents through the
browser's Javascript runtime.

To use widgets, you must add them to your document and define their functionality.
Widgets can be added directly to the document root or nested inside a layout. There
are two ways to program a widget's functionality:

    * Use the ``CustomJS`` callback (see :ref:`userguide_interaction_jscallbacks`). This will work in standalone HTML documents.
    * Use ``bokeh serve`` to start the Bokeh server and set up event handlers with ``.on_change`` (or for some widgets, ``.on_click``).

Event handlers are user-defined Python functions that can be attached to widgets. These functions are
then called when certain attributes on the widget are changed. The necessary function
signature of event handlers is determined by how they are attached to widgets (whether they
are passed through ``.on_change`` or ``.on_click``).

All widgets have an ``.on_change`` method that takes an attribute name and one or more event handlers as
parameters. These handlers are expected to have the function signature, ``(attr, old, new)``,
where ``attr`` refers to the changed attribute's name, and ``old`` and ``new`` refer to the previous and
updated values of the attribute. ``.on_change`` must be used when you need the previous value of an attribute.

.. code-block:: python

    def my_text_input_handler(attr, old, new):
        print("Previous label: " + old)
        print("Updated label: " + new)

    text_input = TextInput(value="default", title="Label:")
    text_input.on_change("value", my_text_input_handler)

Additionally, some widgets, including the button, dropdown, and checkbox, have an ``.on_click`` method that
takes an event handler as its only parameter. For the Button, this handler is called without parameters.
For the other widgets with ``.on_click``, the handler is passed the new attribute value.

.. code-block:: python

    def my_radio_handler(new):
        print 'Radio button option ' + str(new) + ' selected.'

    radio_group = RadioGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)
    radio_group.on_click(my_radio_handler)

Bokeh provides a simple default set of widgets, largely based off the Bootstrap
JavaScript library. In the future, it will be possible for users to wrap and use
other widget libraries, or their own custom widgets.

For more information about the attributes to watch using ``.on_change`` or whether ``.on_click`` is
available, go to the :ref:`refguide`. Widgets can be found under :ref:`bokeh.models`.

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot:: docs/user_guide/examples/interaction_button.py
    :source-position: below

Checkbox Button Group
~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot:: docs/user_guide/examples/interaction_checkbox_button_group.py
    :source-position: below

Checkbox Group
~~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot:: docs/user_guide/examples/interaction_checkbox_group.py
    :source-position: below

Data Table
~~~~~~~~~~

Bokeh provides a sophisticated data table widget based on SlickGrid. Note
that since the table is configured with a data source object, any plots that
share this data source will automatically have selections linked between the
plot and the table (even in static HTML documents).

.. bokeh-plot:: docs/user_guide/examples/interaction_data_table.py
    :source-position: below

Dropdown Menu
~~~~~~~~~~~~~

It is also possible to include Dropdown menus:

.. bokeh-plot:: docs/user_guide/examples/interaction_dropdown_menu.py
    :source-position: below

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options:

.. bokeh-plot:: docs/user_guide/examples/interaction_multiselect.py
    :source-position: below

Radio Button Group
~~~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at at time:

.. bokeh-plot:: docs/user_guide/examples/interaction_radio_button_group.py
    :source-position: below

Radio Group
~~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot:: docs/user_guide/examples/interaction_radio_group.py
    :source-position: below

Select
~~~~~~

A single selection widget:

.. bokeh-plot:: docs/user_guide/examples/interaction_select.py
    :source-position: below

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value`` and a ``title``:

.. bokeh-plot:: docs/user_guide/examples/interaction_slider.py
    :source-position: below

RangeSlider
~~~~~~~~~~~

The Bokeh range-slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value`` and a ``title``:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_range_slider.py
    :source-position: below

Tab Panes
~~~~~~~~~

Tab panes allow multiple plots or layouts to be show in selectable tabs:

.. bokeh-plot:: docs/user_guide/examples/interaction_tab_panes.py
    :source-position: below

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot:: docs/user_guide/examples/interaction_textinput.py
    :source-position: below

Toggle Button
~~~~~~~~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot:: docs/user_guide/examples/interaction_toggle_button.py
    :source-position: below

Div
~~~

A widget for displaying text that can support HTML in a <div> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_div.py
    :source-position: below

Paragraph
~~~~~~~~~

A widget for displaying a block of text in an HTML <p> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_paragraph.py
    :source-position: below

PreText
~~~~~~~

A widget for displaying a block of pre-formatted text in an HTML <pre> tag:

.. bokeh-plot:: docs/user_guide/examples/interaction_pretext.py
    :source-position: below
