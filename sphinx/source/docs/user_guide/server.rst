.. _userguide_server:

Running a Bokeh Server
======================

.. _userguide_server_purpose:

Purpose
-------

* respond to UI and tool events generated in a browser
* push updates the UI, or plots, in a browser
* use periodic, timeout, and asychronous callbacks drive updates

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

:ref:`userguide_server_output_server`

:ref:`userguide_server_bokeh_client`

:ref:`userguide_server_applications`

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
usage, and you will want to first consult the section

:ref:`userguide_server_applications`

to understand how to create Bokeh Applications, and then refer to the
section

:ref:`userguide_server_deployment`

for information on how to deploy the Bokeh server with your application.

.. _userguide_server_use_case_shared:

Shared Publishing
~~~~~~~~~~~~~~~~~

Both of the scenarios above involve a *single creator* making applications
on the server, either for their own local use, or for consumption by a
larger audience. Another scenario is the case where a group of *several
creators* all want publish applications to the same server. **This is not a
good use-case for single Bokeh server.** Because it is possible to create
applications that execute arbitrary python code, process isolation and
security concerns make this kind of shared tenancy prohibitive.

In order to support this kind of multi-creator environment, it is required
to build up infrastructure that can run many Bokeh servers as-needed, either
on a per-app, or at least a per-user basis. It is possible that we may create
a public service to enable just this kind of usage in the future, and it
would also certainly be possible for third parties to build their own private
infrastructure to do so as well, but that is beyond the scope of this
User's Guide.


.. _userguide_server_output_server:

Specifying ``output_server``
----------------------------

With the previous Flask-based Bokeh server, there was a function
:func:`bokeh.io.output_server` that could be used to load Bokeh documents
in to a running Bokeh server programmaticaally. The function still exists
and works, however its utility is somewhat limited.

First, we must have a Bokeh Server running. To do that, execute the command:

.. code-block:: sh

    bokeh serve

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
        r2.data_source.data["y"] = y * step
        r2.glyph.line_alpha = 1 - 0.8 * abs(step)

    curdoc().add_periodic_callback(update, 50)

    session.show() # open the document in a browser

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

Let's look again at a complete example and then examine some specific parts
in more detail:

.. code-block:: python

    # myapp.py

    import numpy as np

    from bokeh.models import Button
    from bokeh.palettes import RdYlBu3
    from bokeh.plotting import figure, curdoc, vplot

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
        ds.data['x'].append(np.random.random()*70 + 15)
        ds.data['y'].append(np.random.random()*70 + 15)
        ds.data['text_color'].append(RdYlBu3[i%3])
        ds.data['text'].append(str(i))
        ds.trigger('data', ds.data, ds.data)
        i = i + 1

    # add a button widget and configure with the call back
    button = Button(label="Press Me")
    button.on_click(callback)

    # put the button and plot in a layout and add to the document
    curdoc().add_root(vplot(button, p))

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

In addition to creating Bokeh applications from single python files, it is
also possible to create applications from dirctories.

.. _userguide_server_deployment:

Deployment Scenarios
--------------------

With an application like the one above, we can do different things. We can
run it just as above locally any time we want to interact with it. Or we can
share it with other people, and they can run it locally themselves in the
same manner. But we might also want to deploy the application in a way that
other people can access it. This section describes some of the considerations
that arise in that case.

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

.. note::
    We intend to expand this section with more guidance for other tools and
    configurations. If have experience with other web deployment scenarios
    and wish to contribute your knowledge here, please contact us.

.. _userguide_server_deployment_nginx_proxy:

Configure a Reverse Proxying
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If the goal is to serve an web application to the general Internet, it is
often desirable to host the application on an internal network, and proxy
connections to it through some dedicated HTTP server. One very common HTTP
and reverse-proxying server is Nginx.

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

    serve myapp.py --port 5100 --host 127.0.0.1:80

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

.. _userguide_server_deployment_nginx_load_balance:

Load Balancing
~~~~~~~~~~~~~~

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

Monitoring with Supervisord
~~~~~~~~~~~~~~~~~~~~~~~~~~~


.. _userguide_server_deployment_automation:

A Full Example with Automation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

https://github.com/bokeh/demo.bokehplots.com


.. _Nginx load balancer documentation: http://nginx.org/en/docs/http/load_balancing.html
