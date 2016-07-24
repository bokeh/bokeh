.. _userguide_server:

Running a Bokeh Server
======================

.. _userguide_server_purpose:

Purpose
-------

The architecture of Bokeh is such that high-level "model objects"
(representing things like plots, ranges, axes, glyphs, etc.) are created
in Python, and then converted to a JSON format that is consumed by the
client library, BokehJS. (See :ref:`userguide_concepts` for a more detailed
discussion.) By itself, this flexible and decoupled design offers advantages,
for instance it is easy to have other languages (R, Scala, Lua, ...) drive
the exact same Bokeh plots and visualizations in the browser.

However, if it were possible to keep the "model objects" in python and in
the browser in sync with one another, then more additional and powerful
possibilities immediately open up:

* respond to UI and tool events generated in a browser with computations or
  queries using the full power of python
* automatically push updates the UI (i.e. widgets or plots), in a browser
* use periodic, timeout, and asynchronous callbacks drive streaming updates

**This capability to synchronize between python and the browser is the main
purpose of the Bokeh Server.**


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
use in this scenario. All of the methods here below can be used effectively:

* :ref:`userguide_server_output_server`
* :ref:`userguide_server_bokeh_client`
* :ref:`userguide_server_applications`

For the most flexible approach, that could transition most directly to a
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
on the server, either for their own local use, or for consumption by a
larger audience. Another scenario is the case where a group of *several
creators* all want publish different applications to the same server. **This
is not a good use-case for single Bokeh server.** Because it is possible to
create applications that execute arbitrary python code, process isolation and
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
server with other web application frameworks. See a complete example at
https://github.com/bokeh/bokeh-demos/tree/master/happiness


.. _userguide_server_output_server:

Specifying ``output_server``
----------------------------

With the previous Flask-based Bokeh server, there was a function
:func:`bokeh.io.output_server` that could be used to load Bokeh documents
in to a running Bokeh server programmatically. The function still exists
and works, however its utility is somewhat limited.

First, we must have a Bokeh Server running. To do that, execute the command:

.. code-block:: sh

    bokeh serve

or, alternatively:

.. code-block:: sh

    python -m bokeh serve

When the server starts you should see output similar to the following on your
console:

.. code-block:: sh

    DEBUG:bokeh.server.tornado:Allowed Host headers: ['localhost:5006']
    DEBUG:bokeh.server.tornado:These host origins can connect to the websocket: ['localhost:5006']
    DEBUG:bokeh.server.tornado:Patterns are: [<<< several endpoints >>>]
    INFO:bokeh.command.subcommands.serve:Starting Bokeh server on port 5006 with applications at paths ['/']

This starts the Bokeh Server in a mode where it can easily accept connections
and data from any script that uses :func:`~bokeh.io.output_server` to connect
to it.

A simple script that illustrates this is here:

.. code-block:: python

    from bokeh.plotting import figure, show, output_server

    p = figure(title="Server Plot")
    p.circle([1, 2, 3], [4, 5, 6])

    output_server("hover")

    show(p)

Because the script calls ``show``, a browser tab is automatically opened up
to the correct URL to view the document, which in this case is:

.. code-block:: none

    http://localhost:5006/?bokeh-session-id=hover

.. _userguide_server_bokeh_client:

Connecting with ``bokeh.client``
--------------------------------

With the new Tornado and websocket-based server introduced in Bokeh 0.11,
there is also a proper client API for interacting directly with a Bokeh
Server. This client API can be used to trigger updates to the plots and
widgets in the browser, either in response to UI events from the browser
or as a results of periodic or asynchronous callbacks. As before, the first
step is to start a Bokeh Server:

.. code-block:: sh

    bokeh serve

Next, let's look at a complete example, and then examine a few key lines
individually:

.. code-block:: python

    import numpy as np
    from numpy import pi

    from bokeh.client import push_session
    from bokeh.driving import cosine
    from bokeh.plotting import figure, curdoc

    x = np.linspace(0, 4*pi, 80)
    y = np.sin(x)

    p = figure()
    r1 = p.line([0, 4*pi], [-1, 1], color="firebrick")
    r2 = p.line(x, y, color="navy", line_width=4)

    # open a session to keep our local document in sync with server
    session = push_session(curdoc())

    @cosine(w=0.03)
    def update(step):
        # updating a single column of the the *same length* is OK
        r2.data_source.data["y"] = y * step
        r2.glyph.line_alpha = 1 - 0.8 * abs(step)

    curdoc().add_periodic_callback(update, 50)

    session.show(p) # open the document in a browser

    session.loop_until_closed() # run forever

If you run this script, you will see a plot with an animated line appear in
a new browser tab. The first half of the script is like most any script that
uses the ``bokeh.plotting`` interface. The first interesting line is:

.. code-block:: python

    session = push_session(curdoc())

This line opens a new session with the Bokeh Server, initializing it with our
current Document. This local Document will be automatically kept in sync with
the server. The next few lines define and add a periodic callback to be run
every 50 milliseconds:

.. code-block:: python

    @cosine(w=0.03)
    def update(step):
        # updating a single column of the the *same length* is OK
        r2.data_source.data["y"] = y * step
        r2.glyph.line_alpha = 1 - 0.8 * abs(step)

    curdoc().add_periodic_callback(update, 50)

Next, analogous to :func:`bokeh.io.show`, there is this a
:func:`~bokeh.client.session.ClientSession.show` on session objects that will
automatically open a browser tab to display the synced Document.

Finally, we need to tell the session to loop forever, so that the periodic
callbacks happen:

.. code-block:: python

    session.loop_until_closed() # run forever

This mode of interaction can be very useful, especially for individual
exploratory data analysis (e.g, in a Juypter notebook). However, it does
have some drawbacks when compared to the Application technique described
below. In particular, in addition to network traffic between the browser
and the server, there is network traffic between the python client and the
server as well. Depending on the particular usage, this could be a
significant consideration.

.. _userguide_server_applications:

Building Bokeh Applications
---------------------------

By far the most flexible way to create interactive data visualizations using
the Bokeh server is to create Bokeh Applications, and serve them with the
``bokeh serve`` command.

.. _userguide_server_applications_single_module:

Single module format
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

    # add a text renderer to out plot (no data yet)
    r = p.text(x=[], y=[], text=[], text_color=[], text_font_size="20pt",
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
get a JSON serialized version of the the application. But in this case,
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

Directory format
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
       +---main.py
       +---server_lifecycle.py
       +---static
       +---theme.yaml
       +---templates
            +---index.html

The optional components are

* A ``server_lifecycle.py`` file that allows optional callbacks to be triggered at different stages of application creation, as descriped in :ref:`userguide_server_applications_lifecycle`.

* A ``static`` subdirectory that can be used to serve static resources associated with this application.

* A ``theme.yaml`` file that declaratively defines default attributes to be applied to Bokeh model types.

* A ``templates`` subdirectory with ``index.html`` Jinja template file. The directory may contain additional Jinja templates for ``index.html`` to refer to. The template should have the same parameters as the :class:`~bokeh.core.templates.FILE` template.

When executing your ``main.py`` Bokeh server ensures that the standard
``__file__`` module attribute works as you would expect. So it is possible
to include data files or custom user defined models in your directory
however you like. Additionally, the application directory is also added
to ``sys.path`` so that python modules in the application directory may
be easily imported.

An example might be:

.. code-block:: none

    myapp
       |
       +---data
       |    +---things.csv
       |
       +---helpers.py
       +---main.py
       |---models
       |    +---custom.js
       |
       +---server_lifecycle.py
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
    from helpers import load_data

    load_data(join(dirname(__file__), 'data', 'things.csv')

And similar code to load the JavaScript implementation for a custom model
from ``models/custom.js``


.. _userguide_server_applications_callbacks:

Callbacks and Events
~~~~~~~~~~~~~~~~~~~~

Before jumping in to callbacks and events specifically in the context of the
Bokeh Server, it's worth discussing different use-cases for callbacks in
general.

JavaScript Callbacks in the Browser
'''''''''''''''''''''''''''''''''''

Regardless of whether there is a Bokeh Server involved, it is possible to
create callbacks that execute in the browser, using ``CustomJS`` and other
methods. See :ref:`userguide_interaction_actions` for more detailed information and examples.

It is critical to note that **no python code is ever executed when a CustomJS
callback is used**. This is true even when the call back is supplied as python
code to be translated to JavaScript. A ``CustomJS`` callback is only executed
inside a browser JavaScript interpreter, and can only directly interact
JavaScript data and functions (e.g., BokehJS Backbone models).

Python Callbacks with Jupyter Interactors
'''''''''''''''''''''''''''''''''''''''''

If you are working in the Jupyter Notebook, it is possible to use Jupyter
interactors to quickly create simple GUI forms automatically. Updates to the
widgets in the GUI can trigger python callback functions that execute in
the Jupyter Python kernel. It is often useful to have these callbacks call
:func:`~bokeh.io.push_notebook` to push updates to displayed plots. For more
detailed information, see :ref:`userguide_notebook_jupyter_interactors`.

.. note::
    It is currently possible to push udpates from python, to BokehJS (i.e.,
    to update plots, etc.) using :func:`~bokeh.io.push_notebook`. It is not
    currently possible to get events or updates from the other direction (e.g.
    to have a range or selection update trigger a python callback) without
    using a Bokeh Server as described in the next section. Adding the
    capability for two-way Python<-->JS synchronization through Jupyter comms
    is a planned future addition.

Updating From Threads
'''''''''''''''''''''

If the app needs to perform blocking computation, it can be possible to have
a separate thread perform that work, and then add a callback to update the
document with the results. It is important to emphasize that the interface
to update the document must pass through a "next tick callback". A callback
added this way will execute as soon as possible on the next iteration of the
Tornado event loop, and automatically acquire necessary locks to update the
document state safely.

Any usage that updates the document state from another thread, either by
calling other methods on the document, or by setting properties directly
on Bokeh models, risks data and protocol corruption.

.. warning::
    The ONLY safe operations to perform on a document from a different thread
    is :func:`~bokeh.document.Document.add_next_tick_callback` and
    :func:`~bokeh.document.Document.remove_next_tick_callback`

It is also important to save a local copy of ``curdoc()`` off so that all
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

    # this must only be modified from a Bokeh session allback
    source = ColumnDataSource(data=dict(x=[0], y=[0]))

    # This is important! Save curdoc() to make sure all threads
    # see then same document.
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
    documents. It is recommended that at most one thread add callbacks to
    the document. It is planned to add more fine grained locking to
    callback methods in the future.

Updating from Unlocked Callbacks
''''''''''''''''''''''''''''''''

You may also want to drive blocking computations from callbacks using, e.g.
Tornado's ``ThreadPoolExecutor`` in an asynchronous callback. This can work,
however, normally Bokeh session callbacks recursively lock the document until
all future work they initiate is completed. To make this scenario work as
desired, Bokeh provides a :func:`~bokeh.document.without_document_lock`
decorator that can suppress the normal locking behavior.

As with the thread example above, all actions that update document state
**must go through a next-tick callback**.

The following example demonstrates an application that drives a blocking
computation from one unlocked Bokeh session callback, by yielding to a
blocking function that runs on the thread pool executor and updates by using
a next-tick callback, and also updates the state simply from a standard
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

    # this unclocked callback will not prevent other session callbacks from
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

.. _userguide_server_applications_lifecycle:

Lifecycle Hooks
~~~~~~~~~~~~~~~

Sometimes it is desirable to have code execute at specific times in a server
or session lifetime. For instance, if you are using a Bokeh Server along side
a Django server, you would need to call ``django.setup()`` once, as each
Bokeh server started, to initialize the Django properly for use by Bokeh
application code.

Bokeh provides this capability through a set of *Lifecycle Hooks*. To use
these hooks, you must create your application in
:ref:`userguide_server_applications_directory`, and include a designated file
called ``server_lifecycle.py`` in the directory. In this file you can include
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


.. _userguide_server_deployment:

Deployment Scenarios
--------------------

With an application, we can run it just locally any time we want to interact
with it. Or we can share it with other people, and they can run it locally
themselves in the same manner. But we might also want to deploy the application
in a way that other people can access it. This section describes some of the
considerations that arise in that case.

.. _userguide_server_deployment_standalone:

Standalone Bokeh Server
~~~~~~~~~~~~~~~~~~~~~~~

First, it is possible to simply run the Bokeh server on a network for users
to interact with directly. Depending on the computational burden of your application code, the number of users, the power of the machine used to run
on, etc., this could be a simple and immediate option for deployment an
internal network.

However, it is often the case that there are needs around authentication,
scaling, and uptime. In these cases more sophisticated deployment
configurations are needed. In the following sections we discuss some of
these considerations.

SSH Tunnels
'''''''''''

It may be convenient or necessary to run a standalone instance of the Bokeh server on a host to which direct access cannot be allowed. In such cases, ssh can be used to "tunnel" to the server.

In the simplest scenario, the Bokeh server will run on one host and will be accessed from another location, e.g., a laptop, with no intermediary machines.

Run the server as usual on the **remote host**:

.. code-block:: sh

    bokeh server

Next, issue the following command on the **local machine** to establish an ssh tunnel to the remote host:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006  user@remote.host

Replace *user* with your username on the remote host and *remote.host* with the hostname/IP address of the system hosting the Bokeh server. You may be prompted for login credentials for the remote system. After the connection is set up you will be able to navigate to ``localhost:5006`` as though the Bokeh server were running on the local machine.

The second, slightly more complicated case occurs when there is a gateway between the server and the local machine.  In that situation a reverse tunnel must be estabished from the server to the gateway. Additionally the tunnel from the local machine will also point to the gateway.

Issue the following commands on the **remote host** where the Bokeh server will run:

.. code-block:: sh

    nohup bokeh server &
    ssh -NfR 5006:localhost:5006 user@gateway.host

Replace *user* with your username on the gateway and *gateway.host* with the hostname/IP address of the gateway. You may be prompted for login credentials for the gateway.

Now set up the other half of the tunnel, from the local machine to the gateway. On the **local machine**:

.. code-block:: sh

    ssh -NfL localhost:5006:localhost:5006 user@gateway.host

Again, replace *user* with your username on the gateway and *gateway.host* with the hostname/IP address of the gateway. You should now be able to access the Bokeh server from the local machine by navigating to ``localhost:5006`` on the local machine, as if the Bokeh server were running on the local machine. You can even set up client connections from a Jupyter notebook running on the local machine.

.. note::
    We intend to expand this section with more guidance for other tools and
    configurations. If have experience with other web deployment scenarios
    and wish to contribute your knowledge here, please
    `contact us on the mailing list`_.

.. _userguide_server_deplyoment_proxy:

Basic Reverse Proxy Setup
~~~~~~~~~~~~~~~~~~~~~~~~~

If the goal is to serve an web application to the general Internet, it is
often desirable to host the application on an internal network, and proxy
connections to it through some dedicated HTTP server. This sections provides
guidance for basic configuration behind some common reverse proxies.

.. _userguide_server_deployment_nginx_proxy:

Nginx
'''''

One very common HTTP and reverse-proxying server is Nginx. A sample
server confuguration block is shown below:

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

The above ``server`` block sets up Nginx to to proxy incoming connections
to ``127.0.0.1`` on port 80 to ``127.0.0.1:5100`` internally. To work in this
configuration, we will need to use some of the command line options to
configure the Bokeh Server. In particular we need to use ``--port`` to specify
that the Bokeh Server should listen itself on port 5100. We also need to
set the ``--host`` option to whitelist ``127.0.0.1:80`` as an acceptable `Host`
on the incoming request header:

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --host 127.0.0.1:80

.. note::
    The ``--host`` option is to guard against spoofed ``Host`` values. In a
    more realistic scenario where you have Nginx and the Bokeh server server
    running on ``foo.com``, you would set ``--host foo.com:80``. Then any
    attempted connections that do not report this ``Host`` in the request
    header (as *all* connections from Nginx do) will be rejected.

Note that in the basic server block above we have not configured any special
handling for static resources, e.g., the Bokeh JS and CSS files. This means
that these files are served directly by the Bokeh server itself. While this
works, it places an unnecessary additional load on the Bokeh server, since
Nginx has a fast static asset handler. To utilize Nginx to server Bokeh's
static assets, you can add a new stanza inside the `server` block above,
similar to this:

.. code-block:: nginx

    location /static {
        alias /path/to/bokeh/server/static;
    }

Be careful that the file permissions of the Bokeh resources are accessible to
whatever user Nginx is running as. Alternatively, you can copy the resources
to a global static directory during your deployment process. See
:ref:`userguide_server_deployment_automation` for a demonstration of this.

Apache
''''''

Another common HTTP server and proxy is Apache:

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
static resources directory, however it is also possible (and probably
preferable) to copy the Bokeh static resources to whatever standard
static files location is configured for Apache as part of the deployment.

As before, you would run the Bokeh server with the command:

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --host 127.0.0.1:80

.. _userguide_server_deployment_nginx_proxy_ssl:

Reverse Proxying with Nginx and SSL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you would like to deploy a Bokeh Server behind an SSL-terminated Nginx
proxy, then a few additional customizations are needed. First, the Bokeh
server must be configured for a ``--host`` with the HTTP port 443, and
you must also add the ``--use-xheaders`` flag:

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --host foo.com:443 --use-xheaders

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
servers. Often in this situation it is desired to run all the Bokeh server
instances behind a load balancer, so that new connections are distributed
amongst the individual servers.

Nginx offers a load balancing capability. We will describe some of the basics
of one possible configuration, but please also refer to the
`Nginx load balancer documentation`_. For instance, there are various different
strategies available for choosing what server to connect to next.

First we need to add an ``upstream`` stanze to our NGinx configuration,
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

    serve myapp.py --port 5100 --host 127.0.0.1:80
    serve myapp.py --port 5101 --host 127.0.0.1:80
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

.. _userguide_server_deployment_supervisord:

Process Control with Supervisord
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

It is often desired to use process control and monitoring tools when
deploying web applications. One popular such tool is `Supervisor`_, which
can automatically start and stop process, as well as re-start processes
if they terminate unexpectedly. Supervisor is configured using INI style
config files. A sample file that might be used to start a single Bokeh
Server app is below:

.. code-block:: ini

    ; supervisor config file

    [unix_http_server]
    file=/tmp/supervisor.sock   ; (the path to the socket file)
    chmod=0700                  ; sockef file mode (default 0700)

    [supervisord]
    logfile=/var/log/supervisord.log ; (main log file; default $CWD/supervisord.log)
    pidfile=/var/run/supervisord.pid ; (supervisord pidfile; default $CWD/supervisord.pid)
    childlogdir=/var/log/supervisor  ; ('AUTO' child log dir, default $TEMP)

    ; The section below must be in the present for the RPC (supervisorctl/web)
    ; interface in to function.
    [rpcinterface:supervisor]
    supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

    [supervisorctl]
    serverurl=unix:///tmp/supervisor.sock ; use a unix:// URL for a unix socket

    [program:myapp]
    command=/path/to/bokeh serve myapp.py --host foo.com:80
    directory=/path/to/workdir
    autostart=false
    autorestart=true
    startretries=3
    numprocs=4
    process_name=%(program_name)s_%(process_num)02d
    stderr_logfile=/var/log/myapp.err.log
    stdout_logfile=/var/log/myapp.out.log
    user=someuser
    environment=USER="someuser",HOME="/home/someuser"

The standard location for the supervisor configj file varies from system to
system. Consult the `Supervisor configuration documentation`_ for more
details. It is also possible to specify a config file explicity. To do this,
execute:

.. code-block:: sh

    supervisord -c /path/to/supervisord.conf

to start the Supervisor process. Then to control processes execute
``supervisorctl`` commands. For instance to start all processes, run:

.. code-block:: sh

    supervisorctl -c /path/to/supervisord.conf start all

To stop all processes run:

.. code-block:: sh

    supervisorctl -c /path/to/supervisord.conf start all

And to update the process control after editing the config file, run:

.. code-block:: sh

    supervisorctl -c /path/to/supervisord.conf update

.. _userguide_server_scaling:

Scaling the server
~~~~~~~~~~~~~~~~~~

You can fork multiple server processes with the `num-procs` option. For example, to fork 3 processes:

.. code-block:: sh

    bokeh serve --num-procs 3

Note that the forking operation happens in the underlying Tornado Server, see notes in the `Tornado docs`_.

.. _Tornado docs: http://www.tornadoweb.org/en/stable/tcpserver.html#tornado.tcpserver.TCPServer.start

.. _userguide_server_deployment_automation:

A Full Example with Automation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To deploy the demo site at http://demo.bokehplots.com we combine all of the
above techniques. Additionally, we used `SaltStack`_ to automate many aspects
of the deployment.

.. note::
    Other devops automation tools include `Puppet`_, `Ansible`_, and `Chef`_.
    We would like to provide specific guidance where ever we can, so if you
    have experience with these tools and would be interested in contributing
    your knowledge, please `contact us on the mailing list`_.

You can see all the code for deploying the site at the public GitHub
repository here:

https://github.com/bokeh/demo.bokehplots.com

You can modify or deploy your own version of this site on an Amazon Linux
instance by simply running the ``deploy.sh`` script at the top level. With
minor modifications, this machinery should work on many linux variants.

.. _Ansible: http://www.ansible.com
.. _Chef: https://www.chef.io/chef/
.. _contact us on the mailing list: https://groups.google.com/a/continuum.io/forum/#!forum/bokeh
.. _Puppet: https://puppetlabs.com
.. _SaltStack: http://saltstack.com
.. _Nginx load balancer documentation: http://nginx.org/en/docs/http/load_balancing.html
.. _Supervisor: http://supervisord.org
.. _Supervisor configuration documentation: http://supervisord.org/configuration.html
