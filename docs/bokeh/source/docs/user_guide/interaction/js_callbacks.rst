.. _ug_interaction_js_callbacks:

JavaScript callbacks
--------------------

The main goal of Bokeh is to provide a path to create rich interactive
visualizations in the browser purely from Python. However, there will always be
use-cases that go beyond the capabilities of the pre-defined core library.

For this reason, Bokeh provides different ways for users to supply custom
JavaScript when necessary. This way, you can add custom or topics
behaviors in response to property changes and other events in the browser.

.. note::
    As the name implies, JavaScript callbacks are snippets of JavaScript code
    that are executed in the browser. If you are looking for interactive
    callbacks that are based solely on Python and can be run with Bokeh Server,
    see :ref:`ug_interaction_python_callbacks`.

There are mainly three **options for generating a JavaScript callback**:

* Use the ``js_link`` Python convenience method. This method helps you link
  properties of different models together. With this method, Bokeh creates
  the necessary JavaScript code for you automatically. See
  :ref:`ug_interaction_linked` for details.
* Use the ``SetValue`` Python object to dynamically set the property of one
  object depending on a specific event of another object. See
  :ref:`ug_interaction_js_callbacks_setvalue` for more information.
* Write custom JavaScript code with the ``CustomJS`` object. See
  :ref:`ug_interaction_js_callbacks_customjs` for more information.

A JavaScript callback is triggered when certain events occur in the browser.
There are two main **types of JavaScript callback triggers**:

* Most Bokeh objects have a ``.js_on_change`` property (all
  :ref:`widgets <ug_interaction_widgets>`, for example). The callback
  assigned to this property will be called whenever the state of the object
  changes. See :ref:`ug_interaction_js_callbacks_js_on_change` for more
  information.
* Some :ref:`widgets <ug_interaction_widgets>` also have a
  ``.js_on_event`` property. The callback assigned to this property will be
  called whenever a specific event occurs in the browser.

.. Warning::
    The explicit purpose of the ``CustomJS`` Model is to embed raw JavaScript
    code for a browser to execute. If any part of the code is derived from
    untrusted user inputs, then you **must take appropriate care to sanitize the
    user input** prior to passing it to Bokeh.

Additionally, you can add entire new custom extension models by writing your
own :ref:`Bokeh extension <ug_advanced_extensions>`.

.. _ug_interaction_js_callbacks_setvalue:

SetValue callbacks
~~~~~~~~~~~~~~~~~~

Use the :class:`~bokeh.models.SetValue` model to dynamically set specific
properties of an object when an event occurs in the browser.

The ``SetValue`` model has the following properties:

* ``obj``: The object to set the value on.
* ``attr``: The property of the object to modify.
* ``value``: The value to set for the object's property.

Based on these parameters, Bokeh creates the necessary JavaScript code
automatically:

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/setvalue.py
    :source-position: below

.. _ug_interaction_js_callbacks_customjs:

CustomJS callbacks
~~~~~~~~~~~~~~~~~~

Use the :class:`~bokeh.models.CustomJS` model to supply a custom snippet of
JavaScript code to run in the browser when an event occurs.

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS(args=dict(xr=plot.x_range, yr=plot.y_range, slider=slider), code="""
    // imports
    import {some_function, SOME_VALUE} from "https://cdn.jsdelivr.net/npm/package@version/file"

    // constants, definitions and state
    const MY_VALUE = 3.14

    function my_function(value) {
        return MY_VALUE*value
    }

    class MyClass {
        constructor(value) {
            this.value = value
        }
    }

    let count = 0

    // the callback function
    export default (args, obj, data, context) => {
        count += 1
        console.log(`CustomJS was called ${count} times`)

        const a = args.slider.value
        const b = obj.value

        const {xr, yr} = args
        xr.start = my_function(a)
        xr.end = b
    }
    """)

The code snippet must contain a default export, which must be a function defined
either using arrow function syntax ``() => {}`` or a classical function syntax
``function() {}``. Depending on the context, this function may be an async
function, a generator function or an async generator function. Also depending
on the context, this function may or may not need to return a value.

The callback function uses four positional arguments:

* ``args``
    this maps to ``CustomJS.args`` property, allowing for mapping names to
    serializable values, typically providing access to Bokeh models from the
    code snippet.
* ``obj``
    this refers to the model that emitted the callback (this is the model that
    the callback is attached to).
* ``data``
    this is a mapping between names and values provided by the emitter of this
    callback. This depends on the caller, the event and possibly the context
    in which the event occurred. For example, a select tool will use ``data``
    to provide selection geometry, among other things.
* ``context``
    this is an additional broader context provided by bokehjs, which is a
    mapping between names and values, similarly to ``data``. Currently only
    ``index`` is provided, which allows the user to access bokehjs' view index.

It may be convenient to the user to use object destructuring syntax to gain
immediate access to passed values, for example:

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS(args=dict(xr=plot.x_range, yr=plot.y_range, slider=slider), code="""
    export default ({xr, yr, slider}, obj, {geometry}, {index}) => {
        // use xr, yr, slider, geometry and index
    }
    """)

Code snippet is compiled once and the callback function (the default export) can
be evaluated multiple times. This way the user can robustly and efficiently import
external libraries, define complex classes and data structures and maintain state
between calls of the callback function. The code snippet is recompiled only when
properties of ``CustomJS`` instance change.

Alternatively the user can use the legacy variant of ``CustomJS``, where the code
snippet is the body of the implicit callback function:

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS(args=dict(xr=plot.x_range), code="""
    // JavaScript code goes here
    const a = 10

    // the model that triggered the callback is cb_obj:
    const b = cb_obj.value

    // models passed as args are auto-magically available
    xr.start = a
    xr.end = b
    """)

Bokeh distinguishes both approaches by detecting presence or absence of
``import`` and ``export`` syntax in the code snippet.

In this approach, arguments to the callback function are implicitly defined.
Names provided by ``CustomJS.args`` are immediately available as positional
arguments, whereas ``obj``, ``data`` and ``context`` are all available with
``cb_`` prefix, i.e. ``cb_obj``, ``cb_data`` and ``cb_context``.

Finally the user can create ``CustomJS`` from files, which use useful when
dealing with large and/or complex code snippets:

.. code:: python

    from bokeh.models.callbacks import CustomJS

    callback = CustomJS.from_file("./my_module.mjs", xr=plot.x_range)

The allowed extensions are:

* ``.mjs`` for the new ``export default () => {}`` variant
* ``.js`` for legacy ``CustomJS``

.. _ug_interaction_js_callbacks_js_on_change:

``js_on_change`` callback triggers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``CustomJS`` and ``SetValue`` callbacks can be attached to property change
events on any Bokeh model, using the ``js_on_change`` method of Bokeh models:

.. code:: python

    p = figure()

    # execute a callback whenever p.x_range.start changes
    p.x_range.js_on_change('start', callback)

The following example attaches a ``CustomJS`` callback to a ``Slider`` widget.
Whenever the slider value updates, the callback updates the plot data with a
custom formula:

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/js_on_change.py
    :source-position: above

.. _ug_interaction_js_callbacks_customjs_js_on_event:

``js_on_event`` callback triggers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to responding to property change events using ``js_on_change``,
Bokeh allows ``CustomJS`` and ``SetValue`` callbacks to be triggered by specific
interaction events with the plot canvas, on button click events, on LOD
(Level-of-Detail) events, and document events.

These event callbacks are defined on models using the ``js_on_event`` method,
with the callback receiving the event object as a locally defined ``cb_obj``
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

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/js_on_event.py
    :source-position: above

JS callbacks for document events can be registered with ``Document.js_on_event()``
method. In the case of the standalone embedding mode, one will use the current
document via ``curdoc()`` to set up such callbacks. For example:

.. code:: python

    from bokeh.models import Div
    from bokeh.models.callbacks import CustomJS
    from bokeh.io import curdoc, show

    div = Div()
    # execute a callback when the document is fully rendered
    callback = CustomJS(args=dict(div=div, code="""div.text = "READY!"""")
    curdoc().js_on_event("document_ready", callback)
    show(div)

Similarly to model-level JS events, one can also use event classes in place of
event names, to register document event callbacks:

.. code:: python

    from bokeh.events import DocumentReady
    curdoc().js_on_event(DocumentReady, callback)

Examples
~~~~~~~~

CustomJS for widgets
''''''''''''''''''''

A common use case for property callbacks is responding to changes to widgets.
The code below shows an example of ``CustomJS`` set on a slider Widget that
changes the source of a plot when the slider is used.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_for_widgets.py
    :source-position: above

CustomJS for selections
'''''''''''''''''''''''

Another common scenario is wanting to specify the same kind of callback to be
executed whenever a selection changes. As a simple demonstration, the example
below simply copies selected points on the first plot to the second. However,
more sophisticated actions and computations are easily constructed in a
similar way.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_for_selection.py
    :source-position: above

Another more sophisticated example is shown below. It computes the average `y`
value of any selected points (including multiple disjoint selections) and draws
a line through that value.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_lasso_mean.py
    :source-position: above

CustomJS for ranges
'''''''''''''''''''

The properties of range objects may also be connected to ``CustomJS`` callbacks
in order to perform topics work whenever a range changes:

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_for_range_update.py
    :source-position: above

CustomJS for tools
''''''''''''''''''

Selection tools emit events that can drive useful callbacks. Below, a
callback for ``SelectionGeometry`` uses the ``BoxSelectTool`` geometry (accessed
via the geometry field of the ``cb_data`` callback object), in order to update a
``Rect`` glyph.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_for_tools.py
    :source-position: above


CustomJS for topics events
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

CustomJS for hover tool
'''''''''''''''''''''''

The ``HoverTool`` has a callback which comes with two pieces of built-in data:
the ``index`` and the ``geometry``. The ``index`` is the indices of any points
that the hover tool is over.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/customjs_for_hover.py
    :source-position: above

OpenURL
'''''''

Opening an URL when users click on a glyph (for instance a circle marker) is
a very popular feature. Bokeh lets users enable this feature by exposing an
OpenURL callback object that can be passed to a Tap tool in order to have that
action called whenever the user clicks on the glyph.

The following code shows how to use the OpenURL action combined with a TapTool
to open an URL whenever the user clicks on a circle.

.. bokeh-plot:: __REPO__/examples/interaction/js_callbacks/open_url.py
    :source-position: above

Please note that ``OpenURL`` callbacks specifically and only work with
``TapTool``, and are only invoked when a glyph is hit. That is, they do not
execute on every tap. If you would like to execute a callback on every
mouse tap, please see :ref:`ug_interaction_js_callbacks_customjs_js_on_event`.
