.. _userguide_interaction_callbacks:

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

    from bokeh.layouts import column
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

    layout = column(slider, plot)

    show(layout)

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_widgets.py
    :source-position: none

.. _PyScript documentation: http://flexx.readthedocs.org/en/stable/pyscript
