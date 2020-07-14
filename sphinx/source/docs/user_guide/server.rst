.. _userguide_server:

Running a Bokeh Server
======================

.. _userguide_server_purpose:

Purpose
-------

The purpose of the Bokeh server is to make it easy for Python users to create
interactive web applications that can connect front-end UI events to real,
running Python code.

The architecture of Bokeh is such that high-level "model objects"
(representing things like plots, ranges, axes, glyphs, etc.) are created
in Python and then converted to a JSON format that is consumed by the
client library, BokehJS. (See :ref:`userguide_concepts` for a more detailed
discussion.) By itself, this flexible and decoupled design offers advantages.
For instance, it is easy to have other languages (R, Scala, Lua, ...) drive
the exact same Bokeh plots and visualizations in the browser.

However, if it were possible to keep the "model objects" in Python and in
the browser in sync with one another, more additional and powerful
possibilities immediately open up:

* respond to UI and tool events generated in a browser with computations or
  queries using the full power of Python
* automatically push server-side updates to the UI (i.e. widgets or plots in a browser)
* use periodic, timeout, and asynchronous callbacks to drive streaming updates

**This capability to synchronize between Python and the browser is the main
purpose of the Bokeh Server.**

----

The simple example below, embedded from `demo.bokeh.org`_, illustrates
this.

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

When the controls are manipulated, their new values are automatically
synced in the Bokeh server. Callbacks are triggered that also update the
data for the plot in the server. These changes are automatically synced back
to the browser, and the plot updates.

.. _userguide_server_use_case:

Use Case Scenarios
------------------

Now that we know what the Bokeh server is for, and what it is capable of
doing, it's worth considering a few different scenarios when you might
want to use a Bokeh Server.

.. _userguide_server_use_case_individual:

Local or Individual Use
~~~~~~~~~~~~~~~~~~~~~~~

One way that you might want to use the Bokeh server is during exploratory
data analysis, possibly in a Jupyter notebook. Alternatively, you might
want to create a small app that you can run locally, or that you can send
to colleagues to run locally. The Bokeh server is very useful and easy to
use in this scenario. Both of the methods here below can be used effectively:

* :ref:`userguide_server_bokeh_client`
* :ref:`userguide_server_applications`

For the most flexible approach which could transition most directly to a
deployable application, it is suggested to follow the techniques in
:ref:`userguide_server_applications`.

.. _userguide_server_use_case_deployed:

Creating Deployable Applications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Another way that you might want to use the Bokeh server is to publish
interactive data visualizations and applications that can be viewed and
used by a wider audience (perhaps on the internet, or perhaps on an
internal company network). The Bokeh Server is also well-suited to this
usage, and you will want to first consult the sections:

* :ref:`userguide_server_applications` - how to create Bokeh Applications, and then refer to the section
* :ref:`userguide_server_deployment` - how to deploy the Bokeh server with your application.


.. _userguide_server_use_case_shared:

Shared Publishing
~~~~~~~~~~~~~~~~~

Both of the scenarios above involve a *single creator* making applications
on the server, either for their own local use or for consumption by a
larger audience. Another scenario is the case where a group of *several
creators* all want to publish different applications to the same server. **This
is not a good use-case for a single Bokeh server.** Because it is possible to
create applications that execute arbitrary Python code, process isolation and
security concerns make this kind of shared tenancy prohibitive.

In order to support this kind of multi-creator, multi-application environment,
one approach is to build up infrastructure that can run as many Bokeh servers
as-needed, either on a per-app, or at least a per-user basis. It is possible
that we may create a public service to enable just this kind of usage in the
future, and it would also certainly be possible for third parties to build
their own private infrastructure to do so as well, but that is beyond the
scope of this User's Guide.

Another possibility is to have a single centrally created app (perhaps by an
organization), that can access data or other artifacts published by many
different people (possibly with access controls). This sort of scenario *is*
possible with the Bokeh server, but often involves integrating a Bokeh
server with other web application frameworks.

.. _userguide_server_applications:

Building Bokeh Applications
---------------------------

By far the most flexible way to create interactive data visualizations using
the Bokeh server is to create Bokeh Applications, and serve them with the
``bokeh serve`` command. In this scenario, a Bokeh server uses the application
code to create sessions and documents for all browsers that connect:

.. figure:: /_images/bokeh_serve.svg
    :align: center
    :width: 65%

    A Bokeh server (left) uses Application code to create Bokeh Documents.
    Every new connection from a browser (right) results in the Bokeh server
    creating a new document, just for that session.

The application code is executed in the Bokeh server every time a new
connection is made, to create the new Bokeh ``Document`` that will be synced
to the browser. The application code also sets up any callbacks that should be
run whenever properties such as widget values are changes.

There are a few different ways to provide the application code.

.. _userguide_server_applications_single_module:

Single Module Format
~~~~~~~~~~~~~~~~~~~~

Let's look again at a complete example and then examine some specific parts
in more detail:

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

    # add a text renderer to our plot (no data yet)
    r = p.text(x=[], y=[], text=[], text_color=[], text_font_size="26px",
               text_baseline="middle", text_align="center")

    i = 0

    ds = r.data_source

    # create a callback that will add a number in a random location
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
    button.on_click(callback)

    # put the button and plot in a layout and add to the document
    curdoc().add_root(column(button, p))

Notice that we have not specified an output or connection method anywhere in
this code. It is a simple script that creates and updates objects. The
flexibility of the ``bokeh`` command line tool means that we can defer
output options until the end. We could, e.g., run ``bokeh json myapp.py`` to
get a JSON serialized version of the application. But in this case,
we would like to run the app on a Bokeh server, so we execute:

.. code-block:: sh

    bokeh serve --show myapp.py

The ``--show`` option will cause a browser to open up a new tab automatically
to the address of the running application, which in this case is:

.. code-block:: none

    http://localhost:5006/myapp

If you have only one application, the server root will redirect to it.
Otherwise, You can see an index of all running applications at the server root:

.. code-block:: none

    http://localhost:5006/

This index can be disabled with the ``--disable-index`` option, and the redirect
behavior can be disabled with the ``--disable-index-redirect`` option.

In addition to creating Bokeh applications from single python files, it is
also possible to create applications from directories.


.. _userguide_server_applications_directory:

Directory Format
~~~~~~~~~~~~~~~~

Bokeh applications may also be created by creating and populating a filesystem
directory with the appropriate files. To start a directory application in a
directory ``myapp``, execute ``bokeh serve`` with the name of the directory, for
instance:

.. code-block:: sh

    bokeh serve --show myapp

At a minimum, the directory must contain a ``main.py`` that constructs a
Document for the Bokeh Server to serve:

.. code-block:: none

    myapp
       |
       +---main.py

The full set of files that Bokeh server knows about is:

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

The optional components are

* An ``__init__.py`` file that marks this directory as a package. Package relative imports, e.g. ``from . import mymod`` and ``from .mymod import func`` will be possible.

* A ``request_handler.py`` file that allows declaring an optional function which processes the HTTP request and returns a dictionary of items to be included in the session token, as described in :ref:`userguide_server_request_handler`.

* A ``app_hooks.py`` file that allows optional callbacks to be triggered at different stages of application execution, as described in :ref:`userguide_server_applications_hooks` and :ref:`userguide_server_request_handler`.

* A ``static`` subdirectory that can be used to serve static resources associated with this application.

* A ``theme.yaml`` file that declaratively defines default attributes to be applied to Bokeh model types.

* A ``templates`` subdirectory with ``index.html`` Jinja template file. The directory may contain additional Jinja templates for ``index.html`` to refer to. The template should have the same parameters as the :class:`~bokeh.core.templates.FILE` template. See :ref:`userguide_server_template` for more details.

When executing your ``main.py``, Bokeh server ensures that the standard
``__file__`` module attribute works as you would expect. So it is possible
to include data files or custom user-defined models in your directory
however you like.

Additionally, the application directory is also added to ``sys.path`` so that
Python modules in the application directory may be easily imported. However, if
an ``__init__.py`` is present in the directory, the app is usable as a
package, and standard package-relative imports will also work.

An example might be:

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

In this case you might have code similar to:

.. code-block:: python

    from os.path import dirname, join
    from .helpers import load_data

    load_data(join(dirname(__file__), 'data', 'things.csv'))

And similar code to load the JavaScript implementation for a custom model
from ``models/custom.js``

.. _userguide_server_template:

Customizing the Application's Jinja Template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As described above in :ref:`userguide_server_applications_directory`, you can override
the default Jinja template used by the Bokeh server to generate the HTML code served to
the user's browser.

This opens up the possibility of managing the layout of the application in the client's
browser using CSS, as well as making use of other Javascript libraries alongside BokehJS.

See the `Jinja Project Documentation`_ for more details on how Jinja templating works.

Embedding Figures in the Template
'''''''''''''''''''''''''''''''''

In the main thread of the Bokeh application, i.e. ``main.py``, any Bokeh figures
that are going to be referenced in the templated code need to have their ``name``
attribute set and be added to the current document root.

.. code-block:: python

    from bokeh.plotting import curdoc

    # templates can refer to a configured name value
    plot = figure(name="bokeh_jinja_figure")

    curdoc().add_root(plot)

Then, in the corresponding Jinja template code, the figure may be referenced via the
``roots`` template parameter, using the figure's ``name``, i.e.

.. code-block:: html

    {% extends base %}

    {% block contents %}
    <div>
        {{ embed(roots.bokeh_jinja_figure) }}
    </div>
    {% endblock %}

Defining Custom Variables
'''''''''''''''''''''''''

Custom variables can be passed to the template via the ``curdoc().template_variables``
dictionary in place:

.. code-block:: python

    # set a new single key/value
    curdoc().template_variables["user_id"] = user_id

    # or update multiple at once
    curdoc().template_variables.update(first_name="Mary", last_name="Jones")

Then, in the corresponding Jinja template code, the variables may be referenced directly:

.. code-block:: html

    {% extends base %}

    {% block contents %}
    <div>
        <p> Hello {{ user_id }}, AKA '{{ last_name }}, {{ first_name }}'! </p>
    </div>
    {% endblock %}

.. _userguide_server_session_request:

Accessing the HTTP Request
~~~~~~~~~~~~~~~~~~~~~~~~~~

When a session is created for a Bokeh application, the session context is made
available as ``curdoc().session_context``. The most useful function of the
session context is to make the Tornado HTTP request object available to the
application as ``session_context.request``. Due to an incompatibility issue with
the usage of ``--num-procs``, the HTTP request is not made available directly.
Instead, only the ``arguments`` attribute is available in full, and only the
subset of ``cookies`` and ``headers`` which are allowed by the ``--include-headers``,
``--exclude-headers``, ``--include-cookies`` and ``--exclude-cookies`` are
made available. Attempting to access any other attribute on ``request`` will
result in an error.

Any additional attributes on the request can be made accessible as described in
:ref:`userguide_server_request_handler`.

As an example, the following code will access the request ``arguments`` to set
a value for a variable ``N`` (perhaps controlling the number of points in a
plot):

.. code-block:: python

  # request.arguments is a dict that maps argument names to lists of strings,
  # e.g, the query string ?N=10 will result in {'N': [b'10']}

  args = curdoc().session_context.request.arguments

  try:
    N = int(args.get('N')[0])
  except:
    N = 200

.. warning::
  The request object is provided so that values such as ``arguments`` may be
  easily inspected. Calling any of the Tornado methods such as ``finish()`` or
  writing directly to ``request.connection`` is unsupported and will result in
  undefined behavior.


.. _userguide_server_request_handler:

Request Handler Hooks
~~~~~~~~~~~~~~~~~~~~~

Since the full Tornado HTTP request is not guaranteed to be available on the
process serving the session, a custom handler can be defined to make additional
information available.

To define such a hook, you must create your application in
:ref:`userguide_server_applications_directory`, and include a designated file
called ``request_handler.py`` in the directory. In this file you must include
a conventionally named ``process_request`` function:

.. code-block:: python

    def process_request(request):
        ''' If present this function is called when the HTTP request arrives. '''
        return {}

The handler is given the Tornado HTTP request and can process the request
and return a dictionary, which will be made available on
``curdoc().session_context.token_payload``. In this way, additional information
can be made available to work around some of the issues when ``--num-procs``
is used.

.. _userguide_server_applications_callbacks:

Callbacks and Events
~~~~~~~~~~~~~~~~~~~~

Before jumping into callbacks and events specifically in the context of the
Bokeh Server, it's worth discussing different use-cases for callbacks in
general.

JavaScript Callbacks in the Browser
'''''''''''''''''''''''''''''''''''

Regardless of whether there is a Bokeh Server involved, it is possible to
create callbacks that execute in the browser, using ``CustomJS`` and other
methods. See :ref:`userguide_interaction_jscallbacks` for more detailed
information and examples.

It is critical to note that **no Python code is ever executed when a CustomJS
callback is used**. This is true even when the call back is supplied as Python
code to be translated to JavaScript. A ``CustomJS`` callback is only executed
inside the browser's JavaScript interpreter, and thus can only directly interact
with JavaScript data and functions (e.g., BokehJS models).

Python Callbacks with Jupyter Interactors
'''''''''''''''''''''''''''''''''''''''''

If you are working in the Jupyter notebook, it is possible to use Jupyter
interactors to quickly create simple GUI forms automatically. Updates to the
widgets in the GUI can trigger python callback functions that execute in
the Jupyter Python kernel. It is often useful to have these callbacks call
:func:`~bokeh.io.push_notebook` to push updates to displayed plots. For more
detailed information, see :ref:`userguide_jupyter_notebook_jupyter_interactors`.

.. note::
    It is currently possible to push updates from Python to BokehJS (i.e.
    to update plots, etc.), using :func:`~bokeh.io.push_notebook`. To add
    two-way communication (e.g. to have a range or selection update trigger
    a Python callback), embed a Bokeh Server in the notebook.
    See :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`

Updating from Threads
'''''''''''''''''''''

If the app needs to perform blocking computation, it is possible to perform
that work in a separate thread. However, updates to the Document must be
scheduled via a next-tick callback. The callback
will execute as soon as possible on the next iteration of the
Tornado event loop, and will automatically acquire necessary locks to update the
document state safely.

.. warning::
    The ONLY safe operations to perform on a document from a different thread
    is :func:`~bokeh.document.Document.add_next_tick_callback` and
    :func:`~bokeh.document.Document.remove_next_tick_callback`

It is important to emphasize that the document update must be scheduled in a "next tick callback".
Any usage that directly updates the document state from another thread, either by calling other document
methods or by setting properties on Bokeh models, risks data and protocol
corruption.

It is also important to save a local copy of ``curdoc()`` so that all
threads have access to the same document. This is illustrated in the example
below:

.. code-block:: python

    from functools import partial
    from random import random
    from threading import Thread
    import time

    from bokeh.models import ColumnDataSource
    from bokeh.plotting import curdoc, figure

    from tornado import gen

    # this must only be modified from a Bokeh session callback
    source = ColumnDataSource(data=dict(x=[0], y=[0]))

    # This is important! Save curdoc() to make sure all threads
    # see the same document.
    doc = curdoc()

    @gen.coroutine
    def update(x, y):
        source.stream(dict(x=[x], y=[y]))

    def blocking_task():
        while True:
            # do some blocking computation
            time.sleep(0.1)
            x, y = random(), random()

            # but update the document from callback
            doc.add_next_tick_callback(partial(update, x=x, y=y))

    p = figure(x_range=[0, 1], y_range=[0,1])
    l = p.circle(x='x', y='y', source=source)

    doc.add_root(p)

    thread = Thread(target=blocking_task)
    thread.start()

To see this example in action, save it to a python file, e.g. ``testapp.py`` and
then execute

.. code-block:: sh

    bokeh serve --show testapp.py

.. warning::
    There is currently no locking around adding next tick callbacks to
    documents. It is recommended that at most one thread adds callbacks to
    the document. It is planned to add more fine-grained locking to
    callback methods in the future.

Updating from Unlocked Callbacks
''''''''''''''''''''''''''''''''

Normally Bokeh session callbacks recursively lock the document until all
future work they initiate is completed. However, you may want to drive
blocking computations from callbacks using Tornado's
``ThreadPoolExecutor`` in an asynchronous callback. This can work, but requires
the Bokeh provided :func:`~bokeh.document.without_document_lock` decorator
to suppress the normal locking behavior.

As with the thread example above, **all actions that update document state
must go through a next-tick callback**.

The following example demonstrates an application that drives a blocking
computation from one unlocked Bokeh session callback, by yielding to a
blocking function that runs on the thread pool executor and updates by using
a next-tick callback. The example also updates the state simply from a standard
locked session callback on a different update rate.

.. code-block:: python

    from functools import partial
    import time

    from concurrent.futures import ThreadPoolExecutor
    from tornado import gen

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
    @gen.coroutine
    def locked_update(i):
        source.stream(dict(x=[source.data['x'][-1]+1], y=[i], color=["blue"]))

    # this unlocked callback will not prevent other session callbacks from
    # executing while it is in flight
    @gen.coroutine
    @without_document_lock
    def unlocked_task():
        global i
        i += 1
        res = yield executor.submit(blocking_task, i)
        doc.add_next_tick_callback(partial(locked_update, i=res))

    @gen.coroutine
    def update():
        source.stream(dict(x=[source.data['x'][-1]+1], y=[i], color=["red"]))

    p = figure(x_range=[0, 100], y_range=[0,20])
    l = p.circle(x='x', y='y', color='color', source=source)

    doc.add_periodic_callback(unlocked_task, 1000)
    doc.add_periodic_callback(update, 200)
    doc.add_root(p)

As before, you can run this example by saving to a python file and running
``bokeh serve`` on it.

.. _userguide_server_applications_hooks:

Lifecycle Hooks
~~~~~~~~~~~~~~~

Sometimes it is desirable to have code execute at specific times in a server
or session lifetime. For instance, if you are using a Bokeh Server alongside
a Django server, you would need to call ``django.setup()`` once, as each
Bokeh server starts, to initialize Django properly for use by Bokeh
application code.

Bokeh provides this capability through a set of *Lifecycle Hooks*. To use
these hooks, you must create your application in
:ref:`userguide_server_applications_directory`, and include a designated file
called ``app_hooks.py`` in the directory. In this file you can include
any or all of the following conventionally named functions:

.. code-block:: python

    def on_server_loaded(server_context):
        ''' If present, this function is called when the server first starts. '''
        pass

    def on_server_unloaded(server_context):
        ''' If present, this function is called when the server shuts down. '''
        pass

    def on_session_created(session_context):
        ''' If present, this function is called when a session is created. '''
        pass

    def on_session_destroyed(session_context):
        ''' If present, this function is called when a session is closed. '''
        pass

Additionally, ``on_session_destroyed`` lifecycle hooks may also be defined
directly on the ``Document`` being served. Since the task of cleaning up after
a user closes a session is common, e.g. to shut down a database connection,
this provides an easy route to performing such actions without bundling
a separate file. To declare such a callback define a function and register
it with the ``Document.on_session_destroyed`` method:

.. code-block:: python

    doc = Document()

    def cleanup_session(session_context):
        ''' This function is called when a session is closed. '''
        pass

    doc.on_session_destroyed(cleanup_session)

Besides the "lifecycle" hooks above, you may also define a "request hooks" for
accessing the HTTP request users made. See :ref:`userguide_server_request_handler`
for full details.


.. _userguide_server_embedding:

Embedding Bokeh Server as a Library
-----------------------------------

It can be useful to embed the Bokeh Server in a larger Tornado application, or the
Jupyter notebook, and use the already existing Tornado ``IOloop``. Here is the
basis of how to integrate Bokeh in such a scenario:

.. code-block:: python

   from bokeh.server.server import Server

   server = Server(
       bokeh_applications,  # list of Bokeh applications
       io_loop=loop,        # Tornado IOLoop
       **server_kwargs      # port, num_procs, etc.
   )

   # start timers and services and immediately return
   server.start()

It is also possible to create and control an ``IOLoop`` directly. This can
be useful to create standalone "normal" Python scripts that serve Bokeh apps,
or to embed a Bokeh application into a framework like Flask or Django without
having to run a separate Bokeh server process. Some examples of this technique
can be found in the examples directory:

* :bokeh-tree:`examples/howto/server_embed/flask_embed.py`
* :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`
* :bokeh-tree:`examples/howto/server_embed/standalone_embed.py`
* :bokeh-tree:`examples/howto/server_embed/tornado_embed.py`

Also note that most every command line argument for ``bokeh serve`` has a
corresponding keyword argument to ``Server``. For instance, setting the
`--allow-websocket-origin` command line argument is equivalent to passing
``allow_websocket_origin`` as a parameter.

.. _userguide_server_bokeh_client:

Connecting with ``bokeh.client``
--------------------------------

There is also a client API for interacting directly with a Bokeh Server. The
client API can be used to make modifications to Bokeh documents in existing
sessions in a Bokeh server.

.. figure:: /_images/bokeh_serve_client.svg
    :align: center
    :width: 65%

    Typically, web browsers make connections to a Bokeh server, but it is
    possible to connect from Python by using the ``bokeh.client`` module.

This can be useful, for example, to make user-specific customizations to a
Bokeh app that is embedded by another web framework such as Flask or Django.
An example of this is shown below. In this scenario, the "sliders" example is
running separately, e.g. via ``bokeh serve sliders.py``. A Flask endpoint
embeds the sliders app, but changes the plot title *before* passing to the user:

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import server_session

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        with pull_session(url="http://localhost:5006/sliders") as session:

            # update or customize that session
            session.document.roots[0].children[1].title.text = "Special Sliders For A Specific User!"

            # generate a script to load the customized session
            script = server_session(session_id=session.id, url='http://localhost:5006/sliders')

            # use the script in the rendered page
            return render_template("embed.html", script=script, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)

.. warning::
    It is possible to use ``bokeh.client`` to build up apps "from scratch",
    outside a Bokeh server, including running and servicing callbacks by making
    a blocking call to ``session.loop_until_closed`` in the external Python
    process using ``bokeh.client``. This usage has a number of inherent
    technical disadvantages and should be considered unsupported.

.. _userguide_server_deployment:

Deployment Scenarios
--------------------

With an application we are developing, we can run it locally any time we want to interact
with it. To share it with other people who are able to install the required
Python stack, we can share the application and let them run it locally
in the same manner. However, we might also want to deploy the application
in a way that other people can access it as a service:

* without having to install all of the prerequisites
* without needing to have the source code
* like any other webpage

This section describes some of the considerations that arise when deploying
Bokeh server applications as a service for others to use.

.. _userguide_server_deployment_standalone:

Standalone Bokeh Server
~~~~~~~~~~~~~~~~~~~~~~~

First, it is possible to simply run the Bokeh server on a network for users
to interact with directly. Depending on the computational burden of your
application code, the number of users, the power of the machine used to run
on, etc., this could be a simple and immediate option for deployment an
internal network.

However, it is often the case that there are needs around authentication,
scaling, and uptime. In these cases, more sophisticated deployment
configurations are needed. In the following sections, we discuss some of
these considerations.

SSH Tunnels
'''''''''''

It may be convenient or necessary to run a standalone instance of the Bokeh
server on a host to which direct access cannot be allowed. In such cases, SSH
can be used to "tunnel" to the server.

In the simplest scenario, the Bokeh server will run on one host and will be
accessed from another location, e.g., a laptop, with no intermediary machines.

Run the server as usual on the **remote host**:

.. code-block:: sh

    bokeh server

Next, issue the following command on the **local machine** to establish an SSH
tunnel to the remote host:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006 user@remote.host

Replace *user* with your username on the remote host and *remote.host* with
the hostname/IP address of the system hosting the Bokeh server. You may be
prompted for login credentials for the remote system. After the connection
is set up, you will be able to navigate to ``localhost:5006`` as though the
Bokeh server were running on the local machine.

The second, slightly more complicated case occurs when there is a gateway
between the server and the local machine. In that situation, a reverse tunnel
must be established from the server to the gateway. Additionally, the tunnel
from the local machine will also point to the gateway.

Issue the following commands on the **remote host** where the Bokeh server
will run:

.. code-block:: sh

    nohup bokeh server &
    ssh -NfR 5006:localhost:5006 user@gateway.host

Replace *user* with your username on the gateway and *gateway.host* with the
hostname/IP address of the gateway. You may be prompted for login credentials
for the gateway.

Now set up the other half of the tunnel, from the local machine to the
gateway. On the **local machine**:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006 user@gateway.host

Again, replace *user* with your username on the gateway and *gateway.host*
with the hostname/IP address of the gateway. You should now be able to access
the Bokeh server from the local machine as if the Bokeh server were running
on the local machine by navigating to ``localhost:5006`` on the local machine.
You can even set up client connections from a Jupyter notebook running on the
local machine.

.. note::
    We intend to expand this section with more guidance for other tools and
    configurations. If you have experience with other web deployment scenarios
    and wish to contribute your knowledge here, please
    contact us on https://discourse.bokeh.org

.. _userguide_server_deployment_ssl:

SSL Termination
~~~~~~~~~~~~~~~

A Bokeh server can be configured to terminate SSL connections (i.e. to service
secure HTTPS and WSS sessions) directly. At a minimum, the ``--ssl-certfile``
argument must be supplied. The value must be the path to a single file in PEM
format containing the certificate as well as any number of CA certificates
needed to establish the certificate's authenticity:

.. code-block:: sh

    bokeh serve --ssl-certfile /path/to/cert.pem

The path to the certificate file may also be supplied by setting the environment
variable ``BOKEH_SSL_CERTFILE``.

If the private key is stored separately, its location may be supplied by
setting the ``--ssl-keyfile`` command line argument, or by setting the
``BOKEH_SSL_KEYFILE`` environment variable. If a password is required for the
private key, it should be supplied by setting the ``BOKEH_SSL_PASSWORD``
environment variable.

Alternatively, you may wish to run a Bokeh server behind a proxy and have the
proxy terminate SSL. That scenario is described in the next section.

.. _userguide_server_deployment_proxy:

Basic Reverse Proxy Setup
~~~~~~~~~~~~~~~~~~~~~~~~~

If the goal is to serve a web application to the general internet, it is
often desirable to host the application on an internal network, and proxy
connections to it through some dedicated HTTP server. This sections provides
guidance for basic configuration behind some common reverse proxies.

.. _userguide_server_deployment_nginx_proxy:

Nginx
'''''

One very common HTTP and reverse-proxying server is Nginx. A sample
server configuration block is shown below:

.. code-block:: nginx

    server {
        listen 80 default_server;
        server_name _;

        access_log  /tmp/bokeh.access.log;
        error_log   /tmp/bokeh.error.log debug;

        location / {
            proxy_pass http://127.0.0.1:5100;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host:$server_port;
            proxy_buffering off;
        }

    }

The above ``server`` block sets up Nginx to proxy incoming connections
to ``127.0.0.1`` on port 80 to ``127.0.0.1:5100`` internally. To work in this
configuration, we will need to use some of the command line options to
configure the Bokeh Server. In particular, we need to use ``--port`` to specify
that the Bokeh Server should listen itself on port 5100.

.. code-block:: sh

    bokeh serve myapp.py --port 5100

Note that in the basic server block above, we have not configured any special
handling for static resources, e.g., the Bokeh JS and CSS files. This means
that these files are served directly by the Bokeh server itself. While this
works, it places an unnecessary additional load on the Bokeh server, since
Nginx has a fast static asset handler. To utilize Nginx to serve Bokeh's
static assets, you can add a new stanza inside the `server` block above,
similar to this:

.. code-block:: nginx

    location /static {
        alias /path/to/bokeh/server/static;
    }

Be careful that the file permissions of the Bokeh resources are accessible to
whatever user account is running the Nginx server process. Alternatively, you
can copy the resources to a global static directory during your deployment
process.

In order to communicate cookies and headers across processes Bokeh may include
this information in a JWT token, which is sent across the Websocket. In certain
cases this token can grow very large and nginx may drop the request. Therefore
you may have to override the default for the nginx `large_client_header_buffers`
setting:

.. code-block:: nginx

    large_client_header_buffers 4 24k;

Apache
''''''

Another common HTTP server and proxy is Apache. Here is a sample configuration
for running a Bokeh server behind Apache:

.. code-block:: apache

    <VirtualHost *:80>
        ServerName localhost

        CustomLog "/path/to/logs/access_log" combined
        ErrorLog "/path/to/logs/error_log"

        ProxyPreserveHost On
        ProxyPass /myapp/ws ws://127.0.0.1:5100/myapp/ws
        ProxyPassReverse /myapp/ws ws://127.0.0.1:5100/myapp/ws

        ProxyPass /myapp http://127.0.0.1:5100/myapp/
        ProxyPassReverse /myapp http://127.0.0.1:5100/myapp/

        <Directory />
            Require all granted
            Options -Indexes
        </Directory>

        Alias /static /path/to/bokeh/server/static
        <Directory /path/to/bokeh/server/static>
            # directives to effect the static directory
            Options +Indexes
        </Directory>

    </VirtualHost>

The above configuration aliases `/static` to the location of the Bokeh
static resources directory. However, it is also possible (and probably
preferable) to copy the Bokeh static resources to whatever standard
static files location is configured for Apache as part of the deployment.

Note that you may also need to enable some modules for the above
configuration:

.. code-block:: sh

    a2enmod proxy
    a2enmod proxy_http
    a2enmod proxy_wstunnel
    apache2ctl restart

These might need to be run with ``sudo``, depending on your system.

As before, you would run the Bokeh server with the command:

.. code-block:: sh

    bokeh serve myapp.py --port 5100

.. _userguide_server_deployment_nginx_proxy_ssl:

Reverse Proxying with Nginx and SSL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you would like to deploy a Bokeh Server behind an SSL-terminated Nginx
proxy, then a few additional customizations are needed. In particular, the
Bokeh server must be configured with the ``--use-xheaders`` flag:

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --use-xheaders

The ``--use-xheaders`` option causes Bokeh to override the remote IP and
URI scheme/protocol for all requests with ``X-Real-Ip``, ``X-Forwarded-For``,
``X-Scheme``, ``X-Forwarded-Proto`` headers when they are available.

You must also customize Nginx. In particular, you must configure Nginx to
send the ``X-Forwarded-Proto`` header, as well as configure Nginx for SSL
termination. Optionally, you may want to redirect all HTTP traffic to HTTPS.
The complete details of this configuration (e.g. how and where to install
SSL certificates and keys) will vary by platform, but a reference
``nginx.conf`` is provided below:

.. code-block:: nginx

    # redirect HTTP traffic to HTTPS (optional)
    server {
        listen      80;
        server_name foo.com;
        return      301 https://$server_name$request_uri;
    }

    server {
        listen      443 default_server;
        server_name foo.com;

        # add Strict-Transport-Security to prevent man in the middle attacks
        add_header Strict-Transport-Security "max-age=31536000";

        ssl on;

        # SSL installation details will vary by platform
        ssl_certificate /etc/ssl/certs/my-ssl-bundle.crt;
        ssl_certificate_key /etc/ssl/private/my_ssl.key;

        # enables all versions of TLS, but not SSLv2 or v3 which are deprecated.
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

        # disables all weak ciphers
        ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";

        ssl_prefer_server_ciphers on;

        location / {
            proxy_pass http://127.0.0.1:5100;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host:$server_port;
            proxy_buffering off;
        }

    }

This configuration will proxy all incoming HTTPS connections to ``foo.com``
to a Bokeh server running internally on ``http://127.0.0.1:5100``.

.. _userguide_server_deployment_nginx_load_balance:

Load Balancing with Nginx
~~~~~~~~~~~~~~~~~~~~~~~~~

The architecture of the Bokeh server is specifically designed to be
scalable---by and large, if you need more capacity, you simply run additional
servers. In this situation, it is often desired to run all the Bokeh server
instances behind a load balancer so that new connections are distributed
amongst the individual servers.

.. figure:: /_images/bokeh_serve_scale.svg
    :align: center
    :width: 65%

    The Bokeh server is horizontally scalable. To add more capacity, more
    servers can be run behind a load balancer.

Nginx offers a load balancing capability. We will describe some of the basics
of one possible configuration, but please also refer to the
`Nginx load balancer documentation`_. For instance, there are various different
strategies available for choosing what server to connect to next.

First we need to add an ``upstream`` stanza to our NGinx configuration,
typically above the ``server`` stanza. This section looks something like:

.. code-block:: nginx

    upstream myapp {
        least_conn;                 # Use Least Connections strategy
        server 127.0.0.1:5100;      # Bokeh Server 0
        server 127.0.0.1:5101;      # Bokeh Server 1
        server 127.0.0.1:5102;      # Bokeh Server 2
        server 127.0.0.1:5103;      # Bokeh Server 3
        server 127.0.0.1:5104;      # Bokeh Server 4
        server 127.0.0.1:5105;      # Bokeh Server 5
    }

We have labeled this ``upstream`` stanza as ``myapp``. We will use this
name below. Additionally, we have listed the internal connection information
for six different Bokeh server instances (each running on a different port)
inside the stanza. You can run and list as many Bokeh servers as you need.

You would run the Bokeh servers with commands similar to:

.. code-block:: sh

    serve myapp.py --port 5100
    serve myapp.py --port 5101
    ...

Next, in the ``location`` stanza for our Bokeh server, change the
``proxy_pass`` value to refer to the ``upstream`` stanza we created
above. In this case we use ``proxy_pass http://myapp;`` as shown
here:

.. code-block:: nginx

    server {

        location / {
            proxy_pass http://myapp;

            # all other settings unchanged
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_http_version 1.1;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host:$server_port;
            proxy_buffering off;
        }

    }

.. _userguide_server_deployment_auth:

Authentication
~~~~~~~~~~~~~~

The Bokeh server itself does not have any facilities for authentication or
authorization. However, the Bokeh server can be configured with an "Auth
Provider" that hooks into Tornado's underlying capabilities. For background
information, see the Tornado docs for `Authentication and security`_. The rest
of this section assumes some familiarity with that material.

Auth Module
'''''''''''

The Bokeh server can be configured to only allow connections in case there is
a properly authenticated user. This is accomplished by providing the path to
a module that implements the necessary functions on the command line:

.. code-block:: sh

    bokeh serve --auth-module=/path/to/auth.py

or by setting the ``BOKEH_AUTH_MODULE`` environment variable.

The module must contain *one* of the following two functions that will return
the current user (or None):

.. code-block:: python

    def get_user(request_handler):
        pass

    async def get_user_async(request_handler):
        pass

The function is passed the Tornado ``RequestHandler`` and can inspect cookies
or request headers to determine the authenticated user. If there is no valid
authenticated user, these functions should return None.

Additionally, the module must specify where to redirect unauthenticated users.
It must contain either:

* a module attribute ``login_url`` and (optionally) a ``LoginHandler`` class
* a function definition for ``get_login_url``

.. code-block:: python

    login_url = "..."

    class LoginHandler(RequestHandler):
        pass

    def get_login_url(request_handler):
        pass

When a relative ``login_url`` is given, an optional ``LoginHandler`` class may
also be provided, and it will be installed as a route on the Bokeh server
automatically.

The ``get_login_url`` function is useful in cases where the login URL must
vary based on the request, or cookies, etc. It is not possible to specify a
``LoginHandler`` when ``get_url_function`` is defined.

Analogous to the login options, optional ``logout_url`` and ``LogoutHandler``
values may be used to define an endpoint for logging users out.

If no auth module is provided, a default user will be assumed, and no
authentication will be required to access Bokeh server endpoints.

.. warning::
    The contents of the auth module will be executed!

Secure Cookies
''''''''''''''

If you want to use Tornado's `set_secure_cookie`_ and `get_secure_cookie`_
functions in your auth module, a cookie secret must be set. This can be
accomplished with the ``BOKEH_COOKIE_SECRET`` environment variable. e.g.

.. code-block:: sh

    export BOKEH_COOKIE_SECRET=<cookie secret value>

The value should be a long, random sequence of bytes

.. _userguide_server_deployment_security:

Security
~~~~~~~~

By default, a Bokeh server will accept any incoming connections on allowed
websocket origins. If a session ID is specified, and a session with that ID
already exists on the server, then a connection to that session is made.
Otherwise, a new session is automatically created and used.

If you are deploying an embedded Bokeh app within a large organization or
to the wider internet, you may want to limit who can initiate sessions, and
from where. Bokeh has options to restrict session creation.

Websocket Origin
''''''''''''''''

When an HTTP request is made to the Bokeh server, it immediately returns a
script that will initiate a websocket connection, and all subsequent
communication happens over the websocket. To reduce the risk of cross-site
misuse, the bokeh server will only initiate websocket connections from
origins that are explicitly allowlisted. Requests with Origin headers that
do not match the allowlist will generate HTTP 403 error responses.

By default, only ``localhost:5006`` is allowlisted. I.e the following two
invocations are identical:

.. code-block:: sh

    bokeh serve --show myapp.py

and

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin=localhost:5006 myapp.py

Both of these will open a browser to the default application URL
``localhost:5006``, and since ``localhost:5006`` is in the allowed websocket
origin allowlist, the Bokeh server will create and display a new session.

Now, consider when a Bokeh server is embedded inside another web page, using
|server_document| or |server_session|. In this instance, the "Origin" header
for the request to the Bokeh server is the URL of the page that has the Bokeh
content embedded it. For example, if a user navigates to our page at
``https://acme.com/products``, which has a Bokeh application embedded in it,
then the origin header reported by the browser will be ``acme.com``. In this
instance, we typically want to restrict the Bokeh server to honoring *only*
requests that originate from our ``acme.com`` page, so that other pages cannot
embed our Bokeh app without our knowledge.

This can be accomplished by setting the ``--allow-websocket-origin`` command
line argument:

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin=acme:com myapp.py

This will prevent other sites from embedding our Bokeh application in their
pages, because requests from users viewing those pages will report a different
origin than ``acme.com``, and the Bokeh server will reject them.

.. warning::
    Bear in mind that this only prevents *other web pages* from surreptitiously
    embedding our Bokeh app to an audience using standard web browsers. A
    determined and knowledgeable attacker can spoof Origin headers.

If multiple allowed origins are required, then multiple instances of
``--allow-websocket-origin`` can be passed on the command line.

It is also possible to configure a Bokeh server to allow any and all connections
regardless of origin:

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin='*' myapp.py

This is not recommended outside testing and experimentation.

Signed session IDs
''''''''''''''''''

By default, the Bokeh server will automatically create new sessions for all
new requests from allowed websocket origins, even if no session ID is provided.
When embedding a Bokeh app inside another web application (e.g. Flask, Django),
we would like to ensure that our web application, and *only* our web application,
is capable of generating proper requests to the Bokeh server. It is possible to
configure the Bokeh server to only create sessions when a cryptographically
signed session ID is provided.

To do this, you need to first create a secret to sign session ids with,
using the ``bokeh secret`` command, e.g.

.. code-block:: sh

    export BOKEH_SECRET_KEY=`bokeh secret`

Then set BOKEH_SIGN_SESSIONS when starting the Bokeh server (and typically
also set the allowed websocket origin):

.. code-block:: sh

    BOKEH_SIGN_SESSIONS=yes bokeh serve --allow-websocket-origin=acme.com myapp.py

Then in your web application, we explicitly provide (signed) session ids using
``generate_session_id``:

.. code-block:: python

    from bokeh.util.token import generate_session_id

    script = server_session(url='http://localhost:5006/bkapp',
                            session_id=generate_session_id())
    return render_template("embed.html", script=script, template="Flask")

Make sure that the ``BOKEH_SECRET_KEY`` environment variable is set (and
identical) for both the Bokeh server and web app processes (e.g. Flask or
Django or whatever tool is in use).

.. note::

    Signed session IDs are effectively access tokens. As with any token system,
    security is predicated on keeping the token a secret. It is also advised to
    run the Bokeh server behind a proxy that terminates SSL, so that the session
    ID is transmitted securely to the user's browser.

XSRF Cookies
''''''''''''

Bokeh can enable the use of Tornado's cross-site request forgery protection.
To turn this feature on, use the ``--enable-xsrf-cookies`` option,
or set the environment variable ``BOKEH_XSRF_COOKIES=yes``. If this setting is
enabled, any PUT, POST, or DELETE operations on custom or login handlers must be
instrumented properly in order to function. Typically, this means adding the
code:

.. code-block:: html

    {% module xsrf_form_html() %}

to all HTML form submission templates. For full details, see the Tornado
documentation on `XSRF Cookies`_.

.. _userguide_server_deployment_scaling:

Scaling the Server
~~~~~~~~~~~~~~~~~~

You can fork multiple server processes with the `num-procs` option. For
example, to fork 3 processes:

.. code-block:: sh

    bokeh serve --num-procs 3

Note that the forking operation happens in the underlying Tornado Server,
see notes in the `Tornado docs`_.

.. _Tornado docs: http://www.tornadoweb.org/en/stable/tcpserver.html#tornado.tcpserver.TCPServer.start

Further Reading
---------------
Now that you are familiar with the concepts of :ref:`userguide_server`, you
may be interested in learning more about the internals of the Bokeh server
in :ref:`devguide_server`.

.. _Authentication and security: https://www.tornadoweb.org/en/stable/guide/security.html
.. _demo.bokeh.org: https://demo.bokeh.org
.. _get_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.get_secure_cookie
.. _Nginx load balancer documentation: http://nginx.org/en/docs/http/load_balancing.html
.. _set_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.set_secure_cookie
.. _XSRF Cookies:  https://www.tornadoweb.org/en/stable/guide/security.html#cross-site-request-forgery-protection
.. _Jinja Project Documentation: https://jinja.palletsprojects.com/en/2.10.x/

.. |server_document|  replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`
