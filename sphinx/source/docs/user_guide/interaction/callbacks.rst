.. _userguide_interaction_jscallbacks:

JavaScript Callbacks
--------------------

While the main goal of Bokeh is to provide a path to create rich interactive
visualizations in the browser purely from Python, there will always be
specialized use-cases that are outside the capabilities of the core library.
For this reason, Bokeh provides different ways for users to supply custom
JavaScript when necessary, so that users may add custom or specialized
behaviors in response to property changes and other events.

One mechanism is the ability to add entire new custom extension models,
as described in :ref:`userguide_extensions`. However, it is also possible
to supply small snippets of JavaScript as callbacks to use, e.g when property
values change or when UI or other events occur. This kind of callback can be
used to add interesting interactions to Bokeh documents without requiring
a Bokeh server (but can also be used in conjunction with a Bokeh server).

.. warning::
    The explicit purpose of these callbacks is to embed *raw JavaScript
    code* for a browser to execute. If any part of the code is derived from
    untrusted user inputs, then you must take appropriate care to sanitize
    the user input prior to passing it to Bokeh.

.. _userguide_interaction_jscallbacks_customjs:

CustomJS Callbacks
~~~~~~~~~~~~~~~~~~

To supply a snippet of JavaScript code that should be executed (in the
browser) when some event occurs, use the ``CustomJS`` model:

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS(args=dict(xr=plot.x_range), code="""

    // JavaScript code goes here

    var a = 10;

    // the model that triggered the callback is cb_obj:
    var b = cb_obj.value;

    // models passed as args are automagically available
    xr.start = a;
    xr.end = b;

    """)

Note that in addition to the ``code`` property, ``CustomJS`` also accepts
an ``args`` property that maps string names to Bokeh models. Any Bokeh
models that are configured in ``args`` (on the "Python side") will
automatically be available to the JavaScript code by the corresponding name.
Additionally, the model that triggers the callback (i.e. the model that
the callback is attached to) will be available as ``cb_obj``.

.. _userguide_interaction_jscallbacks_customjs_properties:

CustomJS for Model Property Events
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

These ``CustomJS`` callbacks can be attached to property change events on
any Bokeh model, using the ``js_on_change`` method of Bokeh models:

.. code:: python

    p = figure()

    # execute a callback whenever p.x_range.start changes
    p.x_range.js_on_change('start', callback)

It should be mentioned that the first parameter to ``js_on_change`` is
actually the name of a BokehJS event. The full format for a property
change event is, e.g., ``"change:start"``, but Bokeh will automatically
convert any property name into one of these BokehJS change events for you.
Additionally, some Bokeh models have additional specialized events. For
example, the ``ColumnDataSource`` also supports ``"patch"`` and ``"stream"``
events, for executing ``CustomJS`` callbacks whenever the data source is
patched or streamed to.

Below is an example that shows how to attach a ``CustomJS`` callback to a
``Slider`` widget, so that whenever the slider value updates, the callback
is executed to update some data:

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_js_on_change.py
    :source-position: above

.. _userguide_interaction_jscallbacks_customjs_interactions:

CustomJS for User Interaction Events
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to responding to property change events using js_on_change, Bokeh
allows CustomJS callbacks to be triggered by specific interaction events with
the plot canvas, on button click events, and on LOD events.

These event callbacks are defined on models using the js_on_event method,
with the callback receiving the event object as a locally defined cb_obj
variable:

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS(code="""
    // the event that triggered the callback is cb_obj:
    // The event type determines the relevant attributes
    console.log('Tap event occurred at x-position: ' + cb_obj.x)
    """)

    p = figure()
    # execute a callback whenever the plot canvas is tapped
    p.js_on_event('tap', callback)

The event can be specified as a string such as ``'tap'`` above, or an event
class import from the ``bokeh.events`` module
(i.e. ``from bokeh.events import Tap``).

The following code imports ``bokeh.events`` and registers all of the
available event classes using the ``display_event`` function in order to
generate the ``CustomJS`` objects. This function is used to update the ``Div``
with the event name (always accessible from the ``event_name``
attribute) as well as all the other applicable event attributes. The
result is a plot that displays the corresponding event on the right when the
user interacts with it:

.. bokeh-plot:: docs/user_guide/examples/js_events.py
    :source-position: above

Examples
~~~~~~~~

CustomJS for Widgets
''''''''''''''''''''

A common use case for property callbacks is responding to changes to widgets.
The code below shows an example of ``CustomJS`` set on a slider Widget that
changes the source of a plot when the slider is used.

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_widgets.py
    :source-position: above

CustomJS for Selections
'''''''''''''''''''''''

Another common scenario is wanting to specify the same kind of callback to be
executed whenever a selection changes. As a simple demonstration, the example
below simply copies selected points on the first plot to the second. However,
more sophisticated actions and computations are easily constructed in a
similar way.

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_selections.py
    :source-position: above

Another more sophisticated example is shown below. It computes the average `y`
value of any selected points (including multiple disjoint selections) and draws
a line through that value.

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_selections_lasso_mean.py
    :source-position: above

CustomJS for Ranges
'''''''''''''''''''

The properties of range objects may also be connected to ``CustomJS`` callbacks
in order to perform specialized work whenever a range changes:

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_range_update.py
    :source-position: above

CustomJS for Tools
''''''''''''''''''

Selection tools emit events that can drive useful callbacks. Below, a
callback for ``SelectionGeometry`` uses the ``BoxSelectTool`` geometry (accessed
via the geometry field of the ``cb_data`` callback object), in order to update a
``Rect`` glyph.

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_tools.py
    :source-position: above


CustomJS for Specialized Events
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to the generic mechanisms described above for adding ``CustomJS``
callbacks to Bokeh models, there are also some Bokeh models that have a
``.callback`` property specifically for executing ``CustomJS`` in response
to specific events or situations.

.. warning::
    The callbacks described below were added early to Bokeh in an ad-hoc
    fashion. Many of them can be accomplished with the generic mechanism
    described above, and as such, may be deprecated in favor of the generic
    mechanism in the future.

CustomJS for Hover
''''''''''''''''''

The ``HoverTool`` has a callback which comes with two pieces of built-in data: the
``index`` and the ``geometry``. The ``index`` is the indices of any points that the
hover tool is over.

.. bokeh-plot:: docs/user_guide/examples/interaction_callbacks_for_hover.py
    :source-position: above

OpenURL
'''''''

Opening an URL when users click on a glyph (for instance a circle marker) is
a very popular feature. Bokeh lets users enable this feature by exposing an
OpenURL callback object that can be passed to a Tap tool in order to have that
action called whenever the user clicks on the glyph.

The following code shows how to use the OpenURL action combined with a TapTool
to open an URL whenever the user clicks on a circle.

.. bokeh-plot:: docs/user_guide/examples/interaction_open_url.py
    :source-position: above

Please note that ``OpenURL`` callbacks specifically and only work with
``TapTool``, and are only invoked when a glyph is hit. That is, they do not
execute on every tap. If you would like to execute a callback on every
mouse tap, please see :ref:`userguide_interaction_jscallbacks_customjs_interactions`.
