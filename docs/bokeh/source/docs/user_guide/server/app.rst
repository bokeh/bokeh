.. _ug_server_apps:

Building applications
---------------------

By far the most flexible way to create interactive data visualizations with
the Bokeh server is to create Bokeh applications and serve them with the
``bokeh serve`` command. The Bokeh server then uses the application code to
create sessions and documents for all connecting browsers.

.. figure:: /_images/bokeh_serve.svg
    :align: center
    :width: 65%

    The Bokeh server (left) uses the application code to create Bokeh
    documents. Every new connection from a browser (right) results in
    the server creating a new document just for that session.

The Bokeh server executes the application code with every new connection and
creates a new Bokeh document, syncing it to the browser. The application code
also sets up the callbacks that should run whenever properties, such as widget
values, change.

You can provide the application code in several ways.

Single module format
~~~~~~~~~~~~~~~~~~~~

Consider the following complete example.

.. code-block:: python

    # myapp.py

    from random import random

    from bokeh.layouts import column
    from bokeh.models import Button
    from bokeh.palettes import RdYlBu3
    from bokeh.plotting import figure, curdoc

    # create a plot and style its properties
    p = figure(x_range=(0, 100), y_range=(0, 100), toolbar_location=None)
    p.border_fill_color = 'black'
    p.background_fill_color = 'black'
    p.outline_line_color = None
    p.grid.grid_line_color = None

    # add a text renderer to the plot (no data yet)
    r = p.text(x=[], y=[], text=[], text_color=[], text_font_size="26px",
               text_baseline="middle", text_align="center")

    i = 0

    ds = r.data_source

    # create a callback that adds a number in a random location
    def callback():
        global i

        # BEST PRACTICE --- update .data in one step with a new dict
        new_data = dict()
        new_data['x'] = ds.data['x'] + [random()*70 + 15]
        new_data['y'] = ds.data['y'] + [random()*70 + 15]
        new_data['text_color'] = ds.data['text_color'] + [RdYlBu3[i%3]]
        new_data['text'] = ds.data['text'] + [str(i)]
        ds.data = new_data

        i = i + 1

    # add a button widget and configure with the call back
    button = Button(label="Press Me")
    button.on_event('button_click', callback)

    # put the button and plot in a layout and add to the document
    curdoc().add_root(column(button, p))

The code above doesn't specify any output or connection method. It is a simple
script that creates and updates objects. The ``bokeh`` command line tool lets
you specify output options after processing your data. You could, for example,
run ``bokeh json myapp.py`` to get a JSON-serialized version of the app.
However, to run the app on a Bokeh server, use the following command:

.. code-block:: sh

    bokeh serve --show myapp.py

The ``--show`` option will cause your default browser to open a new tab at the
address of the running application, which in this case is:

.. code-block:: none

    http://localhost:5006/myapp

If you have only one application, the server root will redirect to it.
Otherwise, you will see an index of all applications running on the server
root:

.. code-block:: none

    http://localhost:5006/

You can disable this index with the ``--disable-index`` option. Likewise, you
can disable redirecting with the ``--disable-index-redirect`` option.

In addition to creating Bokeh applications from single Python files, you can
also create applications from directories.

.. _ug_server_apps_directory:

Directory format
~~~~~~~~~~~~~~~~

You can create Bokeh apps by creating and populating a filesystem directory
with application files. To start an application in a directory named ``myapp``,
you could execute ``bokeh serve`` as follows:

.. code-block:: sh

    bokeh serve --show myapp

This directory must contain a ``main.py`` file that constructs a document for
the Bokeh server to serve:

.. code-block:: none

    myapp
       |
       +---main.py

The following is the directory app structure that the Bokeh server is familiar
with:

.. code-block:: none

    myapp
       |
       +---__init__.py
       +---app_hooks.py
       +---main.py
       +---request_handler.py
       +---static
       +---theme.yaml
       +---templates
            +---index.html

Some of the files and subdirectories above are optional.

* An ``__init__.py`` file that marks this directory as a package. You can make
  imports relative to the package, such as ``from . import mymod`` and
  ``from .mymod import func``.

* A ``request_handler.py`` file that lets you declare an optional function to
  process HTTP requests and return a dictionary of items that the session token
  includes as described in :ref:`ug_server_request_handler`.

* A ``app_hooks.py`` file that lets you trigger optional callbacks at different
  stages of application execution as described in
  :ref:`ug_server_apps_hooks` and
  :ref:`ug_server_request_handler`.

* A ``static`` subdirectory that you can use to serve static resources
  associated with this application.

* A ``theme.yaml`` file where you can declare default attributes for Bokeh to
  apply to model types.

* A ``templates`` subdirectory with an ``index.html`` Jinja template file. The
  directory may contain additional Jinja templates for ``index.html`` to refer
  to. The template should have the same parameters as the
  :class:`~bokeh.core.templates.FILE` template. For more information, see
  :ref:`ug_server_apps_template`.

When executing your ``main.py``, the Bokeh server ensures that the standard
``__file__`` module attribute works as you would expect. So you can include
data files or custom user-defined models in your directory however you like.

Bokeh also adds the application directory ``sys.path`` to facilitate importing
of Python modules in the application directory. However, if an ``__init__.py``
is in the directory, you can use the app as a package as well as make standard
package-relative imports.

Here's an example of a more developed directory tree:

.. code-block:: none

    myapp
       |
       +---__init__.py
       |
       +---app_hooks.py
       +---data
       |    +---things.csv
       |
       +---helpers.py
       +---main.py
       |---models
       |    +---custom.js
       |
       +---request_handler.py
       +---static
       |    +---css
       |    |    +---special.css
       |    |
       |    +---images
       |    |    +---foo.png
       |    |    +---bar.png
       |    |
       |    +---js
       |        +---special.js
       |
       |---templates
       |    +---index.html
       |
       +---theme.yaml

In this case, your code might be similar to the following:

.. code-block:: python

    from os.path import dirname, join
    from .helpers import load_data

    load_data(join(dirname(__file__), 'data', 'things.csv'))

The code to load a JavaScript implementation for a custom model from
``models/custom.js`` is also similar.

.. _ug_server_apps_template:

Customizing the application's Jinja template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The :ref:`ug_server_apps_directory` section mentions that you
can override the default Jinja template, which the Bokeh server uses to
generate user-facing HTML.

This lets you use CSS and JavaScript to tweak the way the application appears
in the browser.

For more details on how Jinja templating works, see the
`Jinja project documentation`_.

Embedding figures in the template
'''''''''''''''''''''''''''''''''

To reference a Bokeh figure in the templated code, you need to set its ``name``
attribute and add the figure to the current document root in the main thread of
your Bokeh app, that is ``main.py``.

.. code-block:: python

    from bokeh.plotting import curdoc

    # templates can refer to a configured name value
    plot = figure(name="bokeh_jinja_figure")

    curdoc().add_root(plot)

You can then use that name in the corresponding Jinja template to reference the
figure via the ``roots`` template parameter as follows:

.. code-block:: html

    {% extends base %}

    {% block contents %}
    <div>
        {{ embed(roots.bokeh_jinja_figure) }}
    </div>
    {% endblock %}

Defining custom variables
'''''''''''''''''''''''''

You can pass custom variables to the template with the
``curdoc().template_variables`` dictionary as follows:

.. code-block:: python

    # set a new single key/value pair
    curdoc().template_variables["user_id"] = user_id

    # or update multiple pairs at once
    curdoc().template_variables.update(first_name="Mary", last_name="Jones")

You can then reference the variables in the corresponding Jinja template.

.. code-block:: html

    {% extends base %}

    {% block contents %}
    <div>
        <p> Hello {{ user_id }}, AKA '{{ last_name }}, {{ first_name }}'! </p>
    </div>
    {% endblock %}

.. _ug_server_session_request:

Accessing HTTP requests
~~~~~~~~~~~~~~~~~~~~~~~

When creating a session for an application, Bokeh makes the session context
available as ``curdoc().session_context``. The most useful function of the
session context is to make the Tornado HTTP request object available to the
application as ``session_context.request``. HTTP requests are not available
directly because of an incompatibility with ``--num-procs``. Instead, only the
``arguments`` attribute is available in full and only a subset of ``cookies``
and ``headers`` allowed by the ``--include-headers``, ``--exclude-headers``,
``--include-cookies``, and ``--exclude-cookies`` parameters is available.
Attempting to access any other attribute on a ``request`` results in an error.

You can enable additional request attributes as described in
:ref:`ug_server_request_handler`.

The following code accesses the request ``arguments`` to provide a value for
the variable ``N`` that could, for example, control the number of plot points.

.. code-block:: python

  # request.arguments is a dict that maps argument names to lists of strings,
  # for example, the query string ?N=10 results in {'N': [b'10']}

  args = curdoc().session_context.request.arguments

  try:
    N = int(args.get('N')[0])
  except:
    N = 200

.. warning::
  The request object makes inspecting values, such as ``arguments``, easy.
  However, calling any of the Tornado methods, such as ``finish()``,  or
  writing directly to ``request.connection`` is unsupported and results in
  undefined behavior.


.. _ug_server_request_handler:

Request handler hooks
~~~~~~~~~~~~~~~~~~~~~

To provide additional information where full Tornado HTTP requests may not be
available, you can define a custom handler hook.

To do so, create an app in :ref:`directory format<ug_server_apps_directory>` and
include a file called ``request_handler.py`` in the directory. This file must
include a ``process_request`` function.

.. code-block:: python

    def process_request(request):
        '''If present, this function executes when an HTTP request arrives.'''
        return {}

The process then passes Tornado HTTP requests to the handler, which returns a
dictionary for ``curdoc().session_context.token_payload``. This lets you work
around some of the ``--num-procs`` issues and provide additional information.

.. _ug_server_apps_callbacks:

Callbacks and events
~~~~~~~~~~~~~~~~~~~~

Before jumping into callbacks and events specifically in the context of the
Bokeh server, it's worth discussing different use cases for callbacks in
general.

JavaScript callbacks in the browser
'''''''''''''''''''''''''''''''''''

Whether you are using the Bokeh server or not, you can create callbacks that
execute in the browser with ``CustomJS`` and other methods. For more
information and examples, see :ref:`ug_interaction_js_callbacks`.

``CustomJS`` callbacks **never** execute Python code, not even if you convert a
Python callback into JavaScript. ``CustomJS`` callbacks only execute inside the
browser's JavaScript interpreter, which means that they can only interact with
JavaScript data and functions, such as BokehJS models.

Python callbacks with Jupyter interactors
'''''''''''''''''''''''''''''''''''''''''

When working with Jupyter notebooks, you can use Jupyter interactors to quickly
create simple GUI forms. Updates to GUI widgets trigger Python callbacks that
execute in the Python kernel of Jupyter. It is often useful to have these
callbacks call :func:`~bokeh.io.push_notebook` to push updates to displayed
plots. For more information, see
:ref:`ug_output_jupyter_notebook_jupyter_interactors`.

.. note::
    You can push plot updates from Python to BokehJS with
    :func:`~bokeh.io.push_notebook`. For two-way communication, embed a Bokeh
    server in the notebook. For example, this lets range and selection updates
    trigger Python callbacks. For further details, see
    :bokeh-tree:`examples/server/api/notebook_embed.ipynb`

Updating from threads
'''''''''''''''''''''

You can make blocking computations in separate threads. However, you **must**
schedule document updates via a next tick callback. This callback executes
as soon as possible with the next iteration of the Tornado event loop and
automatically acquires necessary locks to safely update the document state.

.. warning::
    The ONLY safe operations to perform on a document from a different thread
    are :func:`~bokeh.document.Document.add_next_tick_callback` and
    :func:`~bokeh.document.Document.remove_next_tick_callback`

Remember, direct updates to the document state issuing from another thread,
whether through other document methods or setting of Bokeh model properties,
risk data and protocol corruption.

To allow all threads access to the same document, save a local copy of
``curdoc()``. The example below illustrates this process.

.. code-block:: python

    import time
    from functools import partial
    from random import random
    from threading import Thread

    from bokeh.models import ColumnDataSource
    from bokeh.plotting import curdoc, figure

    # only modify from a Bokeh session callback
    source = ColumnDataSource(data=dict(x=[0], y=[0]))

    # This is important! Save curdoc() to make sure all threads
    # see the same document.
    doc = curdoc()

    async def update(x, y):
        source.stream(dict(x=[x], y=[y]))

    def blocking_task():
        while True:
            # do some blocking computation
            time.sleep(0.1)
            x, y = random(), random()

            # but update the document from a callback
            doc.add_next_tick_callback(partial(update, x=x, y=y))

    p = figure(x_range=[0, 1], y_range=[0,1])
    l = p.circle(x='x', y='y', source=source)

    doc.add_root(p)

    thread = Thread(target=blocking_task)
    thread.start()

To see this example in action, save the above code to a Python file, for
example, ``testapp.py``, and then execute the following command:

.. code-block:: sh

    bokeh serve --show testapp.py

.. warning::
    There is currently no locking around adding next tick callbacks to
    documents. Bokeh should have a more fine-grained locking for callback
    methods in the future, but for now it is best to have each thread add no
    more than one callback to the document.

Updating from unlocked callbacks
''''''''''''''''''''''''''''''''

Normally Bokeh session callbacks recursively lock the document until all
future work they initiate is completed. However, you may want to drive
blocking computations from callbacks using Tornado's ``ThreadPoolExecutor``
in an asynchronous callback. This requires that you use the
:func:`~bokeh.document.without_document_lock` decorator to suppress the normal
locking behavior.

As with the thread example above, **all actions that update document state
must go through a next tick callback**.

The following example demonstrates an application that drives a blocking
computation from one unlocked Bokeh session callback. It yields to a blocking
function that runs on the thread pool executor and then updates with a next
tick callback. The example also updates the state simply from a standard locked
session callback with a different update rate.

.. code-block:: python

    import asyncio
    import time
    from concurrent.futures import ThreadPoolExecutor
    from functools import partial

    from bokeh.document import without_document_lock
    from bokeh.models import ColumnDataSource
    from bokeh.plotting import curdoc, figure

    source = ColumnDataSource(data=dict(x=[0], y=[0], color=["blue"]))

    i = 0

    doc = curdoc()

    executor = ThreadPoolExecutor(max_workers=2)

    def blocking_task(i):
        time.sleep(1)
        return i

    # the unlocked callback uses this locked callback to safely update
    async def locked_update(i):
        source.stream(dict(x=[source.data['x'][-1]+1], y=[i], color=["blue"]))

    # this unlocked callback will not prevent other session callbacks from
    # executing while it is running
    @without_document_lock
    async def unlocked_task():
        global i
        i += 1
        res = await asyncio.wrap_future(executor.submit(blocking_task, i), loop=None)
        doc.add_next_tick_callback(partial(locked_update, i=res))

    async def update():
        source.stream(dict(x=[source.data['x'][-1]+1], y=[i], color=["red"]))

    p = figure(x_range=[0, 100], y_range=[0, 20])
    l = p.circle(x='x', y='y', color='color', source=source)

    doc.add_periodic_callback(unlocked_task, 1000)
    doc.add_periodic_callback(update, 200)
    doc.add_root(p)


As before, you can run this example by saving to a Python file and running
``bokeh serve`` on it.

.. _ug_server_apps_hooks:

Lifecycle hooks
~~~~~~~~~~~~~~~

You may want to execute code at specific points of server or session runtime.
Bokeh enables this through a set of *lifecycle hooks*. To use these hooks,
create your application in
:ref:`directory format<ug_server_apps_directory>` and include a
designated file called ``app_hooks.py`` in the directory. In this file you can
include any or all of the following conventionally named functions:

.. code-block:: python

    def on_server_loaded(server_context):
        # If present, this function executes when the server starts.
        pass

    def on_server_unloaded(server_context):
        # If present, this function executes when the server shuts down.
        pass

    def on_session_created(session_context):
        # If present, this function executes when the server creates a session.
        pass

    def on_session_destroyed(session_context):
        # If present, this function executes when the server closes a session.
        pass

You can also define ``on_session_destroyed`` lifecycle hooks directly on the
``Document`` being served. This makes it easy to clean up after a user closes
a session by performing such actions as database connection shutdown without
the need to bundle a separate file. To declare such a callback, define a
function and register it with the ``Document.on_session_destroyed`` method:

.. code-block:: python

    doc = Document()

    def cleanup_session(session_context):
        # This function executes when the user closes the session.
        pass

    doc.on_session_destroyed(cleanup_session)

Besides the lifecycle hooks above, you may also define request hooks to
access the HTTP requests your users make. For further information, see
:ref:`ug_server_request_handler`.

.. _Jinja project documentation: https://jinja.palletsprojects.com
