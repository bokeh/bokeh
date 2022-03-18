.. _userguide_server:

Running a Bokeh server
======================

.. _userguide_server_purpose:

Purpose
-------

.. note::
    To make this guide easier to follow, consider familiarizing
    yourself with some of the core concepts of Bokeh in the section
    :ref:`userguide_concepts`.

Bokeh server makes it easy to create interactive web applications that connect
front-end UI events to running Python code.

Bokeh creates high-level Python models, such as plots, ranges, axes, and
glyphs, and then converts these objects to JSON to pass them to its client
library, BokehJS. For more information on the latter, see
:ref:`contributor_guide_bokehjs`.

This flexible and decoupled design offers some advantages. For instance, it is
easy to have other languages, such as R or Scala, drive Bokeh plots and
visualizations in the browser.

However, keeping these models in sync between the Python environment and the
browser would provide further powerful capabilities:

* respond to UI and tool events in the browser with computations or queries
  using the full power of Python
* automatically push server-side updates to the UI elements such as widgets or
  plots in the browser
* use periodic, timeout, and asynchronous callbacks to drive streaming updates

This is where the Bokeh server comes into play:

**The primary purpose of the Bokeh server is to synchronize data between the
underlying Python environment and the BokehJS library running in the browser.**

----

Here's a simple example from `demo.bokeh.org`_ that illustrates this behavior.

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

Manipulating the UI controls communicates new values to the backend via Bokeh
server. This also triggers callbacks that update the plots with the input in
real time.

.. _userguide_server_use_case:

Use case scenarios
------------------

Consider a few different scenarios when you might want to use the Bokeh server.

.. _userguide_server_use_case_individual:

Local or individual use
~~~~~~~~~~~~~~~~~~~~~~~

You might want to use the Bokeh server for exploratory data analysis, possibly
in a Jupyter notebook, or for a small app that you and your colleagues can run
locally.

The Bokeh server is very convenient here, allowing for quick and simple
deployment through effective use of Bokeh server applications. For more
detail, see :ref:`userguide_server_applications`.

.. _userguide_server_use_case_deployed:

Creating deployable applications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You might also want to use the Bokeh server to publish interactive data
visualizations and applications to a wider audience, say, on the internet
or an internal company network. The Bokeh server also suits this usage well,
but you might want to first consult the following:

* For information on how to create Bokeh applications, see
  :ref:`userguide_server_applications`.
* For information on how to deploy a server with your application, see
  :ref:`userguide_server_deployment`.


.. _userguide_server_use_case_shared:

Shared publishing
~~~~~~~~~~~~~~~~~

Both of the scenarios above involve *one person* making applications on the
server, either for personal use or for consumption by a larger audience.

While it is possible for *several people* to publish different applications
to the same server, **this does not make for a good use case** because hosted
applications can execute arbitrary Python code. This raises process isolation
and security concerns and makes this kind of shared tenancy prohibitive.

One way to support this kind of multi-application environment with multiple
users is to build up infrastructure that can run a Bokeh server for each app or
at least for each user. The Bokeh project or a third party might create a
public service for this kind of usage in the future but such developments are
beyond the scope this documentation.

Another possibility is to have one app that can access data and other artifacts
published by many different people, possibly with access controls. This sort of
scenario *is* possible with the Bokeh server, but often involves integrating it
with other web application frameworks.

.. _userguide_server_applications:

Building Bokeh applications
---------------------------

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

.. _userguide_server_applications_single_module:

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


.. _userguide_server_applications_directory:

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
  includes as described in :ref:`userguide_server_request_handler`.

* A ``app_hooks.py`` file that lets you trigger optional callbacks at different
  stages of application execution as described in
  :ref:`userguide_server_applications_hooks` and
  :ref:`userguide_server_request_handler`.

* A ``static`` subdirectory that you can use to serve static resources
  associated with this application.

* A ``theme.yaml`` file where you can declare default attributes for Bokeh to
  apply to model types.

* A ``templates`` subdirectory with an ``index.html`` Jinja template file. The
  directory may contain additional Jinja templates for ``index.html`` to refer
  to. The template should have the same parameters as the
  :class:`~bokeh.core.templates.FILE` template. For more information, see
  :ref:`userguide_server_template`.

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

.. _userguide_server_template:

Customizing the application's Jinja template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The :ref:`userguide_server_applications_directory` section mentions that you
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

.. _userguide_server_session_request:

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
:ref:`userguide_server_request_handler`.

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


.. _userguide_server_request_handler:

Request handler hooks
~~~~~~~~~~~~~~~~~~~~~

To provide additional information where full Tornado HTTP requests may not be
available, you can define a custom handler hook.

To do so, create an app in :ref:`directory format<userguide_server_applications_directory>` and
include a file called ``request_handler.py`` in the directory. This file must
include a ``process_request`` function.

.. code-block:: python

    def process_request(request):
        '''If present, this function executes when an HTTP request arrives.'''
        return {}

The process then passes Tornado HTTP requests to the handler, which returns a
dictionary for ``curdoc().session_context.token_payload``. This lets you work
around some of the ``--num-procs`` issues and provide additional information.

.. _userguide_server_applications_callbacks:

Callbacks and events
~~~~~~~~~~~~~~~~~~~~

Before jumping into callbacks and events specifically in the context of the
Bokeh server, it's worth discussing different use cases for callbacks in
general.

JavaScript callbacks in the browser
'''''''''''''''''''''''''''''''''''

Whether you are using the Bokeh server or not, you can create callbacks that
execute in the browser with ``CustomJS`` and other methods. For more
information and examples, see :ref:`userguide_interaction_jscallbacks`.

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
:ref:`userguide_jupyter_notebook_jupyter_interactors`.

.. note::
    You can push plot updates from Python to BokehJS with
    :func:`~bokeh.io.push_notebook`. For two-way communication, embed a Bokeh
    server in the notebook. For example, this lets range and selection updates
    trigger Python callbacks. For further details, see
    :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`

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

.. _userguide_server_applications_hooks:

Lifecycle hooks
~~~~~~~~~~~~~~~

You may want to execute code at specific points of server or session runtime.
For instance, if you are using a Bokeh server with a Django server, you need to
call ``django.setup()`` for each Bokeh server to properly initialize Django for
use by Bokeh application code.

Bokeh enables this through a set of *lifecycle hooks*. To use these hooks,
create your application in
:ref:`directory format<userguide_server_applications_directory>` and include a
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
:ref:`userguide_server_request_handler`.


.. _userguide_server_embedding:

Embedding Bokeh server as a library
-----------------------------------

It can be useful to embed the Bokeh Server in a larger Tornado application, or a
Jupyter notebook, and use the already existing Tornado ``IOloop``. Here is the
basis for integration of Bokeh in such a scenario:

.. code-block:: python

   from bokeh.server.server import Server

   server = Server(
       bokeh_applications,  # list of Bokeh applications
       io_loop=loop,        # Tornado IOLoop
       **server_kwargs      # port, num_procs, etc.
   )

   # start timers and services and immediately return
   server.start()

You can also create and control an ``IOLoop`` directly. This can be useful when
creating standalone "normal" Python scripts that serve Bokeh apps or embedding
a Bokeh application in a framework like Flask or Django without having to run a
separate Bokeh server process. You can find some examples of this technique in
the examples directory:

* :bokeh-tree:`examples/howto/server_embed/flask_embed.py`
* :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`
* :bokeh-tree:`examples/howto/server_embed/standalone_embed.py`
* :bokeh-tree:`examples/howto/server_embed/tornado_embed.py`

Also note that every command line argument for ``bokeh serve`` has a
corresponding keyword argument for ``Server``. For instance, using the
``--allow-websocket-origin`` command line argument is equivalent to passing
``allow_websocket_origin`` as a parameter.

.. _userguide_server_bokeh_client:

Connecting with ``bokeh.client``
--------------------------------

You can directly interact with the Bokeh server via a client API, which you can
use to make modifications to Bokeh documents in existing sessions on a Bokeh
server.

.. figure:: /_images/bokeh_serve_client.svg
    :align: center
    :width: 65%

    Typically, web browsers connect to the Bokeh server, but you can make a
    connection from Python by using the ``bokeh.client`` module.

This can be useful, for example, to make user-specific customizations to a
Bokeh app that is embedded by another web framework, such as Flask or Django.
In the following example, a Flask endpoint embeds a "sliders" app already
running on the server but changes the plot title *before* passing the output
to the user.

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import server_session

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        with pull_session(url="http://localhost:5006/sliders") as session:

            # update or customize that session
            session.document.roots[0].children[1].title.text = "Special sliders for a specific user!"

            # generate a script to load the customized session
            script = server_session(session_id=session.id, url='http://localhost:5006/sliders')

            # use the script in the rendered page
            return render_template("embed.html", script=script, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)

.. _userguide_server_deployment:

Deployment scenarios
--------------------

To make your application into a user-friendly service, you'll have to deploy
your work. This subsection explores various aspects of deployment.

.. _userguide_server_deployment_standalone:

Standalone Bokeh server
~~~~~~~~~~~~~~~~~~~~~~~

You can have the Bokeh server running on a network for users to interact with
your app directly. This can be a simple solution for local network deployment,
provided the capabilities of the hardware running the server match your app
requirements and the expected number of users.

However, if you have authentication, scaling, or uptime requirements, you'll
have to consider more sophisticated deployment configurations.

SSH tunnels
'''''''''''

To run a standalone instance of the Bokeh server on a host with restricted
access, use SSH to "tunnel" to the server.

In the simplest scenario, the user accesses the Bokeh server from another
location, such as a laptop with no intermediary machines.

Run the server as usual on the **remote host**.

.. code-block:: sh

    bokeh serve

Next, issue the following command on the **local machine** to establish an SSH
tunnel to the remote host:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006 user@remote.host

Replace *user* with your username on the remote host and *remote.host* with
the hostname or IP address of the system hosting the Bokeh server. The remote
system may prompt you for login credentials. Once you are connected, you will
be able to navigate to ``localhost:5006`` as though the Bokeh server were
running on the local machine.

A slightly more complicated scenario involves a gateway between the server and
the local machine. In that situation, a reverse tunnel must be established from
the server to the gateway with another tunnel connecting the gateway with the
local machine.

Issue the following commands on the **remote host** where the Bokeh server
will be running:

.. code-block:: sh

    nohup bokeh server &
    ssh -NfR 5006:localhost:5006 user@gateway.host

Replace *user* with your username on the gateway and *gateway.host* with the
hostname or IP address of the gateway. The gateway may prompt you for login
credentials.

To setup the tunnel between the local machine and the gateway, run the
following command on the **local machine**:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006 user@gateway.host

Again, replace *user* with your username on the gateway and *gateway.host*
with the hostname or IP address of the gateway.

You should now be able to access the Bokeh server from the local machine by
navigating to ``localhost:5006``. You can even set up client connections from
a Jupyter notebook running on the local machine.

.. note::
    We intend to expand this section with more guidance for other tools and
    configurations. If you have experience with other web deployment scenarios
    and wish to contribute your knowledge here, please contact us on
    https://discourse.bokeh.org

.. _userguide_server_deployment_ssl:

SSL termination
~~~~~~~~~~~~~~~

You can configure the Bokeh server to terminate SSL connections and serve
secure HTTPS and WSS sessions directly. To do so, you'll have to supply the
``--ssl-certfile`` argument with the value of the path to a single PEM file
containing a certificate as well as any number of `CA certificates
<https://en.wikipedia.org/wiki/Certificate_authority>`_ needed to establish
the certificate's authenticity.

.. code-block:: sh

    bokeh serve --ssl-certfile /path/to/cert.pem

You can also supply a path to the certificate file by setting the environment
variable ``BOKEH_SSL_CERTFILE``.

If the private key is stored separately, you can supply its location by setting
the ``--ssl-keyfile`` command line argument or by setting the
``BOKEH_SSL_KEYFILE`` environment variable. If the private key requires a
password, supply it by setting the ``BOKEH_SSL_PASSWORD`` environment variable.

Alternatively, you may wish to run a Bokeh server behind a proxy and have the
proxy terminate SSL connections. See the next subsection for details.

.. _userguide_server_deployment_proxy:

Basic reverse proxy setup
~~~~~~~~~~~~~~~~~~~~~~~~~

To serve a web application to the general internet, you may wish to host your
app on an internal network and proxy connections to it through some dedicated
HTTP server. This subsection provides guidance on how to configure some common
reverse proxies.

.. _userguide_server_deployment_nginx_proxy:

Nginx
'''''

One very common HTTP and reverse-proxying server is Nginx. Here's an example
of a ``server`` configuration stanza:

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

The above ``server`` block sets up Nginx to proxy incoming connections to
``127.0.0.1`` on port 80 over to ``127.0.0.1`` on port 5100. To work in this
configuration, you need to use some of the command line options to configure
the Bokeh server. In particular, use ``--port`` to have the Bokeh server
listen on port 5100.

.. code-block:: sh

    bokeh serve myapp.py --port 5100

The basic server block above does not configure any special handling for static
resources, such as Bokeh JS and CSS files. This means that the Bokeh server
serves these files directly.

Although this is a viable option, it requires that the Bokeh server do extra
work that is better handled with Nginx. To serve static assets with Nginx, add
the following sub-block to the code above, substituting the path to your
static assets for ``/path/to/bokeh/server/static``:

.. code-block:: nginx

    location /static {
        alias /path/to/bokeh/server/static;
    }

Make sure that the account running Nginx has permissions to access Bokeh
resources. Alternatively, you can copy the resources to a global static
directory during the deployment.

To communicate cookies and headers across processes, Bokeh may include this
information in a JSON web token, sending it via a WebSocket. In certain cases
this token can grow very large causing Nginx to drop the request. You may have
to work around this by overriding the default Nginx setting
`large_client_header_buffers`:

.. code-block:: nginx

    large_client_header_buffers 4 24k;

Apache
''''''

Another common HTTP server and proxy is Apache. Here is an example
configuration for a Bokeh server running behind Apache:

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

The above configuration aliases `/static` to the location of the Bokeh static
resources directory. However, it is also possible (and probably preferable) to
copy the static resources to whatever standard location for static files you
configure for Apache as part of the deployment.

You may also need to enable some modules for the above configuration:

.. code-block:: sh

    a2enmod proxy
    a2enmod proxy_http
    a2enmod proxy_wstunnel
    apache2ctl restart

Depending on your system, you may have to use ``sudo`` to run the above.

As before, run the Bokeh server with the following command:

.. code-block:: sh

    bokeh serve myapp.py --port 5100

.. _userguide_server_deployment_nginx_proxy_ssl:

Reverse proxying with Nginx and SSL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To deploy a Bokeh server behind an SSL-terminated Nginx proxy, you'll need a
few additional customizations. In particular, you'll have to configure the
Bokeh server with the ``--use-xheaders`` flag.

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --use-xheaders

The ``--use-xheaders`` flag causes Bokeh to override the remote IP and
URI scheme/protocol for all requests with ``X-Real-Ip``, ``X-Forwarded-For``,
``X-Scheme``, and ``X-Forwarded-Proto`` headers when they are available.

You'll also have to customize Nginx. In particular, you have to configure Nginx
to send ``X-Forwarded-Proto`` headers and use SSL termination. Optionally, you
may want to redirect all HTTP traffic to HTTPS.

The complete details of this configuration, such as how and where to install
SSL certificates and keys, varies by platform and the following is only a
reference ``nginx.conf`` setup:

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

        # adds Strict-Transport-Security to prevent man-in-the-middle attacks
        add_header Strict-Transport-Security "max-age=31536000";

        ssl on;

        # SSL installation details vary by platform
        ssl_certificate /etc/ssl/certs/my-ssl-bundle.crt;
        ssl_certificate_key /etc/ssl/private/my_ssl.key;

        # enables all versions of TLS, but not the deprecated SSLv2 or v3
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
over to a Bokeh server running internally on ``http://127.0.0.1:5100``.

.. _userguide_server_deployment_nginx_load_balance:

Load balancing with Nginx
~~~~~~~~~~~~~~~~~~~~~~~~~

The Bokeh server is scalable by design. If you need more capacity, you can
simply run additional servers. In this case, you'll generally want to run all
the Bokeh server instances behind a load balancer so that new connections are
distributed among individual servers.

.. figure:: /_images/bokeh_serve_scale.svg
    :align: center
    :width: 65%

    The Bokeh server is horizontally scalable. To add more capacity, you
    can run more servers behind a load balancer.

Nginx can help with load balancing. This section describes some of the basics
of one possible configuration, but please also refer to the
`Nginx load balancer documentation`_. For instance, there are different
strategies available for choosing what server to connect to next.

First, you need to add an ``upstream`` stanza to the Nginx configuration.
This typically goes above the ``server`` stanza and looks something like the
following:

.. code-block:: nginx

    upstream myapp {
        least_conn;                 # Use the least-connected strategy
        server 127.0.0.1:5100;      # Bokeh Server 0
        server 127.0.0.1:5101;      # Bokeh Server 1
        server 127.0.0.1:5102;      # Bokeh Server 2
        server 127.0.0.1:5103;      # Bokeh Server 3
        server 127.0.0.1:5104;      # Bokeh Server 4
        server 127.0.0.1:5105;      # Bokeh Server 5
    }

The rest of the configuration uses the name ``myapp`` to refer to the above
``upstream`` stanza, which lists the internal connection information for six
different Bokeh server instances (each running on a different port). You can
run and list as many Bokeh servers as you need.

To run a Bokeh server instance, use commands similar to the following:

.. code-block:: sh

    serve myapp.py --port 5100
    serve myapp.py --port 5101
    ...

Next, in the ``location`` stanza for the Bokeh server, change the
``proxy_pass`` value to refer to the ``upstream`` stanza above. The
code below uses ``proxy_pass http://myapp;``.

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
authorization. However, you can configure the Bokeh server with an "auth
provider" that hooks into Tornado's underlying capabilities. For background
information, see the Tornado docs for `Authentication and security`_. The rest
of this section assumes some familiarity with that material.

Auth module
'''''''''''

You can configure the Bokeh server to only allow authenticated users to
connect. To do so, provide a path to the module that implements the necessary
functions on the command line.

.. code-block:: sh

    bokeh serve --auth-module=/path/to/auth.py

Alternatively, you can set the ``BOKEH_AUTH_MODULE`` environment variable to
this path.

The module must contain *one* of the following two functions that return the
current user (or ``None``):

.. code-block:: python

    def get_user(request_handler):
        pass

    async def get_user_async(request_handler):
        pass

The module passes the function to the Tornado ``RequestHandler`` that can
inspect cookies or request headers to determine the authenticated user. If
there is no authenticated user, these functions should return ``None``.

Additionally, the module must specify where to redirect unauthenticated users
by including either:

* a module attribute ``login_url`` and (optionally) a ``LoginHandler`` class
* a function definition for ``get_login_url``

.. code-block:: python

    login_url = "..."

    class LoginHandler(RequestHandler):
        pass

    def get_login_url(request_handler):
        pass

If the module provides a relative ``login_url``, it can also provide an
optional ``LoginHandler`` class, which the Bokeh server will incorporate
automatically.

The ``get_login_url`` function is useful in cases where the login URL must
vary based on the request, cookies, or other factors. You can also specify a
``LoginHandler`` when defining the ``get_url_function``.

To define an endpoint for logging users out, you can also use optional
``logout_url`` and ``LogoutHandler`` parameters, similar to the login options.

If you don't provide an authentication module, the configuration will not
require any authentication to access Bokeh server endpoints.

.. warning::
    The configuration executes the contents of the authentication module.

Secure cookies
''''''''''''''

If you want to use Tornado's `set_secure_cookie`_ and `get_secure_cookie`_
functions in your auth module, you'll have to set a cookie secret. To do so,
use the ``BOKEH_COOKIE_SECRET`` environment variable.

.. code-block:: sh

    export BOKEH_COOKIE_SECRET=<cookie secret value>

The value should be a long, random sequence of bytes.

.. _userguide_server_deployment_security:

Security
~~~~~~~~

By default, the Bokeh server will accept any incoming connections with an
allowed WebSocket origin. If you specify a session ID, and a session with
that ID already exists on the server, the server will connect to that session.
Otherwise, the server will automatically create and use a new session.

If you are deploying an embedded Bokeh app within a large organization or
to the wider internet, you may want to limit who can initiate sessions, and
from where. Bokeh lets you manage session creation privileges.

WebSocket origin
''''''''''''''''

When a Bokeh server receives an HTTP request, it immediately returns a script
that initiates a WebSocket connection. All subsequent communication happens
over the WebSocket.

To reduce the risk of cross-site misuse, the Bokeh server will only initiate
WebSocket connections from the origins that are explicitly allowed. Requests
with ``Origin`` headers that are not on the allowed list will generate HTTP 403
error responses.

By default, only ``localhost:5006`` is allowed, making the following two
invocations identical:

.. code-block:: sh

    bokeh serve --show myapp.py

and

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin=localhost:5006 myapp.py

Both of these open your default browser to the default application URL
``localhost:5006`` and, since ``localhost:5006`` is on the list of allowed
WebSocket origins, the Bokeh server creates and displays a new session.

When you embed a Bokeh server in another web page with |server_document| or
|server_session|, the ``Origin`` header for the request to the Bokeh server
is the URL of the page that hosts your Bokeh content.

For example, if a user navigates to your page at ``https://acme.com/products``,
the origin header reported by the browser will be ``acme.com``. In this case,
you'd typically restrict the Bokeh server to honoring *only* the requests that
originate from the ``acme.com`` page, preventing other pages from embedding
your Bokeh app without your knowledge.

You can do so by setting the ``--allow-websocket-origin`` command line argument
as follows:

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin=acme.com myapp.py

This will prevent other sites from embedding your Bokeh application in their
pages because requests from users viewing those pages will report a different
origin than ``acme.com``, causing the Bokeh server to reject them.

.. warning::
    Bear in mind that this only prevents *other web pages* from embedding your
    Bokeh app without your knowledge.

If you require multiple allowed origins, you can pass multiple instances of
``--allow-websocket-origin`` on the command line.

You can also configure the Bokeh server to allow all connections regardless of
origin:

.. code-block:: sh

    bokeh serve --show --allow-websocket-origin='*' myapp.py

This option is only suitable for testing, experimentation, and local notebook
usage.

Signed session IDs
''''''''''''''''''

By default, the Bokeh server will automatically create new sessions for all
new requests from allowed WebSocket origins, even if you provide no session ID.

When embedding a Bokeh app inside another web application, such as Flask or
Django, make sure that *only* your web application is capable of generating
viable requests to the Bokeh server, which you can configure to only create
sessions with a cryptographically signed session ID.

First, use the ``bokeh secret`` command to create a secret to sign session IDs.

.. code-block:: sh

    export BOKEH_SECRET_KEY=`bokeh secret`

Then set ``BOKEH_SIGN_SESSIONS`` to ``yes`` when starting the Bokeh server.
You'll typically also want to set the allowed WebSocket origin at this point.

.. code-block:: sh

    BOKEH_SIGN_SESSIONS=yes bokeh serve --allow-websocket-origin=acme.com myapp.py

Then, in your web application, explicitly provide signed session IDs with
``generate_session_id``:

.. code-block:: python

    from bokeh.util.token import generate_session_id

    script = server_session(url='http://localhost:5006/bkapp',
                            session_id=generate_session_id())
    return render_template("embed.html", script=script, template="Flask")

Make sure to set identical ``BOKEH_SECRET_KEY`` environment variables both for
the Bokeh server and for the web app processes, such as Flask, Django, or any
other tool you are using.

.. note::

    Signed session IDs serve as access tokens. As with any token system,
    security is predicated on keeping the token secret. You should also run
    the Bokeh server behind a proxy that terminates SSL connections, or
    configure the Bokeh server to terminate SSL directly. This lets you
    securely transmit session IDs to the client browsers.

XSRF cookies
''''''''''''

Bokeh server can use Tornado's cross-site request forgery protection. To turn
this feature on, use the ``--enable-xsrf-cookies`` option or set the
environment variable ``BOKEH_XSRF_COOKIES`` to ``yes``.

With this setting, you'll have to properly instrument all PUT, POST, and DELETE
operations on custom and login handlers in order for them to function.
Typically, this means adding the following code to all HTML form submission
templates:

.. code-block:: html

    {% module xsrf_form_html() %}

For full details, see the Tornado documentation on `XSRF Cookies`_.

.. _userguide_server_deployment_scaling:

Scaling the server
~~~~~~~~~~~~~~~~~~

You can fork multiple server processes with the `num-procs` option. For
example, run the following command to fork 3 processes:

.. code-block:: sh

    bokeh serve --num-procs 3

Note that the forking operation happens in the underlying Tornado server. For
further information, see the `Tornado docs`_.

.. _Tornado docs: http://www.tornadoweb.org/en/stable/tcpserver.html#tornado.tcpserver.TCPServer.start

Further reading
---------------
Now that you are familiar with the concepts of
:ref:`running a Bokeh server<userguide_server>`,
you may be interested in learning more about the internals of the Bokeh server
in :ref:`contributor_guide_server`.

.. _Authentication and security: https://www.tornadoweb.org/en/stable/guide/security.html
.. _demo.bokeh.org: https://demo.bokeh.org
.. _get_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.get_secure_cookie
.. _Nginx load balancer documentation: http://nginx.org/en/docs/http/load_balancing.html
.. _set_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.set_secure_cookie
.. _XSRF Cookies:  https://www.tornadoweb.org/en/stable/guide/security.html#cross-site-request-forgery-protection
.. _Jinja project documentation: https://jinja.palletsprojects.com/en/2.10.x/

.. |server_document|  replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`
