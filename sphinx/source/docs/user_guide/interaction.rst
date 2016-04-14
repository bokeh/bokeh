.. _userguide_interaction:

Adding Interactions
===================

.. _userguide_interaction_linking:

Linking Plots
-------------

It's often useful to link plots to add connected interactivity between plots.
This section shows an easy way to do it using the |bokeh.plotting| interface.

.. _userguide_interaction_linked_panning:

Linked Panning
~~~~~~~~~~~~~~

It's often desired to link pan or zooming actions across many plots. All that is
needed to enable this feature is to share range objects between |figure|
calls.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_linked_panning.py
    :source-position: above

Now you have learned how to link panning between multiple plots with the
|bokeh.plotting| interface.

.. _userguide_interaction_linked_brushing:

Linked Brushing
~~~~~~~~~~~~~~~

Linked brushing in Bokeh is expressed by sharing data sources between glyph
renderers. This is all Bokeh needs to understand that selections acted on one
glyph must pass to all other glyphs that share that same source.

The following code shows an example of linked brushing between circle glyphs on
two different |figure| calls.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_linked_brushing.py
    :source-position: above

Now you have learned how to link brushing between plots.

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

    * Use the ``CustomJS`` callback (see :ref:`userguide_interaction_actions_widget_callbacks`). This will work in standalone HTML documents.
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

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_button.py
    :source-position: below

Checkbox Button Group
~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_checkbox_button_group.py
    :source-position: below

Checkbox Group
~~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_checkbox_group.py
    :source-position: below

Data Table
~~~~~~~~~~

Bokeh provides a sophisticated data table widget based on SlickGrid. Note
that since the table is configured with a data source object, any plots that
share this data source will automatically have selections linked between the
plot and the table (even in static HTML documents).

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_data_table.py
    :source-position: below

Dropdown Menu
~~~~~~~~~~~~~

It is also possible to include Dropdown menus:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_dropdown_menu.py
    :source-position: below

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_multiselect.py
    :source-position: below

Radio Button Group
~~~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at at time:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_radio_button_group.py
    :source-position: below

Radio Group
~~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_radio_group.py
    :source-position: below

Select
~~~~~~

A single selection widget:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_select.py
    :source-position: below

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value`` and a ``title``:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_slider.py
    :source-position: below

Tab Panes
~~~~~~~~~

Tab panes allow multiple plots or layouts to be show in selectable tabs:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_tab_panes.py
    :source-position: below

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_textinput.py
    :source-position: below

Toggle Button
~~~~~~~~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_toggle_button.py
    :source-position: below

.. _userguide_interaction_actions:

Div
~~~~~~~~~

A widget for displaying text that can support HTML:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_div.py
    :source-position: below

JavaScript Callbacks
--------------------

Bokeh exposes various callbacks that can be specified from Python that trigger
actions inside the browser's JavaScript runtime. This kind of JavaScript
callback can be used to add interesting interactions to Bokeh documents without
the need to use a Bokeh server (but can also be used in conjuction with a
Bokeh server).

.. _userguide_interaction_actions_openurl:

OpenURL
~~~~~~~

Opening an URL when users click on a glyph (for instance a circle marker) is
a very popular feature. Bokeh lets users enable this feature by exposing an
OpenURL callback object that can be passed to a Tap tool in order to have that
action called whenever the users clicks on the glyph.

The following code shows how to use the OpenURL action combined with a TapTool
to open an URL whenever the user clicks on a circle.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_open_url.py
    :source-position: above

Now you have learned how to open an URL when the user clicks on a glyph.

.. _userguide_interaction_actions_widget_callbacks:

CustomJS for Widgets
~~~~~~~~~~~~~~~~~~~~

Bokeh lets you express even more advanced callbacks that must be called on
the Javascript side in order to add custom logic and interactivity when a
widget is used. For instance, we may want to change the data of a plot when
a user clicks on a button or changes a slider Widget.

Custom callbacks like these can be set using a CustomJS object and passing it
as the ``callback`` argument to a Widget object.

The code below shows an example of CustomJS set on a slider Widget that
changes the source of a plot when the slider is used.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_widgets.py
    :source-position: above

.. _userguide_interaction_actions_tool_callbacks:

CustomJS for Tools
~~~~~~~~~~~~~~~~~~

Bokeh allows for some tool events to trigger custom Javascript callbacks that
have access to the tool's attributes. Below, a callback on the BoxSelectTool
uses the selection box dimensions (accessed in the geometry field of the
cb_data object that is injected into the Callback code attribute), in order to
add a Rect glyph to the plot with identical dimensions.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_tools.py
    :source-position: above

.. _userguide_interaction_actions_selection_callbacks:

CustomJS for Selections
~~~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides the means to specify the same kind of callback to be
executed whenever a selection changes. As a simple demonstration, the example
below simply copies selected points on the first plot to the second. However,
more sophisticated actions and computations are easily constructed in a
similar way.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_selections.py
    :source-position: above

Another more sophisticated example is shown below. It computes the average `y`
value of any selected points (including multiple disjoint selections), and draws
a line through that value.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_selections_lasso_mean.py
    :source-position: above

.. _userguide_interaction_actions_hover_callbacks:

CustomJS for Hover
~~~~~~~~~~~~~~~~~~

The HoverTool has a callback which comes with two pieces of built-in data: the
`index`, and the `geometry`. The `index` is the indices of any points that the
hover tool is over.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_hover.py
    :source-position: above

.. _userguide_interaction_actions_range_update_callbacks:

CustomJS for Range Update
~~~~~~~~~~~~~~~~~~~~~~~~~

With Bokeh, ranges have a callback attribute that accept a Callback instance
and execute javascript code on range updates that are triggered by tool
interactions such as a box zoom, wheel scroll or pan.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_range_update.py
    :source-position: above

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. _userguide_interaction_actions_in_python:

CustomJS with a Python function
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A CustomJS callback can also be implemented as a Python function, which
is then translated to JavaScript using PyScript. This makes it easier
for users to define client-side interactions without having to learn
JavaScript. To use this functionality you need the Flexx library
(install with ``conda install -c bokeh flexx`` or ``pip install flexx``).

.. warning::
    It is critical to note that **no python code is ever executed when
    a CustomJS callback is used**. This is true even when the callback is
    supplied as python code to be translated to JavaScript as described in
    this section. A ``CustomJS`` callback is only executed inside a browser
    JavaScript interpreter, and can only directly interact JavaScript data
    and functions (e.g., BokehJS Backbone models).

For more information about the subset of Python that is supported in
callbacks, see the `<PyScript documentation_>`_.

We recommend using ``window.x`` for variables specific to JavaScript
to avoid confusion and help static code analysis tools. You can add
``window`` as an argument to the callback function to help readability
(and pyflakes), as in the example below.

.. code-block:: python

    from bokeh.io import vform
    from bokeh.models import CustomJS, ColumnDataSource, Slider
    from bokeh.plotting import Figure, output_file, show

    output_file("callback.html")

    x = [x*0.005 for x in range(0, 200)]
    y = x

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = Figure(plot_width=400, plot_height=400)
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    def callback(source=source, window=None):
        data = source.get('data')
        f = cb_obj.get('value')
        x, y = data['x'], data['y']
        for i in range(len(x)):
            y[i] = window.Math.pow(x[i], f)
        source.trigger('change')

    slider = Slider(start=0.1, end=4, value=1, step=.1, title="power",
                    callback=CustomJS.from_py_func(callback))

    layout = vform(slider, plot)

    show(layout)

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_widgets.py
    :source-position: none

.. _PyScript documentation: http://flexx.readthedocs.org/en/stable/pyscript
