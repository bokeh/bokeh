.. _ug_server_deploy:

Deployment scenarios
====================

To make your application into a user-friendly service, you'll have to deploy
your work. This subsection explores various aspects of deployment.

Standalone Bokeh server
-----------------------

You can have the Bokeh server running on a network for users to interact with
your app directly. This can be a simple solution for local network deployment,
provided the capabilities of the hardware running the server match your app
requirements and the expected number of users.

However, if you have authentication, scaling, or uptime requirements, you'll
have to consider more sophisticated deployment configurations.

Integrating Bokeh server into other web services
------------------------------------------------

Bokeh server is frequently used to create plots and dashboards embedded within
larger parent applications. For instance, in a financial context, this may
involve incorporating Bokeh-backed trendlines that chart account balances over
time into a web-based trading platform. In a supply-chain context, a Bokeh view
could be integrated into an existing inventory management system to
interactively monitor a store's item supplies.

To meet this use-case, the ``bokeh.embed`` module offers the
:func:`~bokeh.embed.server_document` and :func:`~bokeh.embed.server_session`
methods. Refer to :ref:`ug_output_embed_apps` for a detailed discussion of their
usage, with examples. In short, these methods return the text of an HTML script
tag that loads a view from Bokeh server, and adds the view to the DOM of any
page that the script tag is placed in.

If the parent service you wish to integrate with is not Python-based, you can
still integrate with Bokeh through the ``server_document`` / ``server_session``
methods. However, you will need to do so by calling out to a small, long-lived
Python script that returns the text contents of those methods via any standard
form of IPC.

To allow your parent application to display embedded Bokeh views, you must
configure the parent application to permit cross-origin requests to your Bokeh
server instance. This is accomplished by adding the public hostname and port
number of your Bokeh server to the ``script-src`` and ``connect-src``
directives of the parent service's `content security policy (CSP)
<https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>`_, for both the HTTP(S)
and WS(S) protocols. The exact procedure for configuring the CSP will depend on
the toolkit or framework your parent service is built with, so reference the
specific documentation for that software. As a measure of last resort, CSP
headers can be overwritten by a reverse-proxy as well.

.. warning::
    Do not run Bokeh server over HTTP while running the parent service over
    HTTPS, or vice-versa. Bokeh's loader code determines which protocol to load
    resources over on the client-side, via ``window.location.protocol``, so if
    the protocol of the parent service does not match the protocol of your
    Bokeh server instance, the loader script's requests to Bokeh server will
    fail.

If your parent application is Python-based, and you don't mind tightly
integrating your Bokeh server application into your parent application's
codebase, Bokeh also supports running its underlying Tornado web server through
a thread launched by your parent application. Practical examples are linked
under :ref:`ug_server_library`. This approach still requires the use of
``server_document`` or ``server_session``, but may simplify CSP configuration
as well as deployment of your Bokeh server app.

SSH tunnels
~~~~~~~~~~~

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

SSL termination
---------------

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

Basic reverse proxy setup
-------------------------

To serve a web application to the general internet, you may wish to host your
app on an internal network and proxy connections to it through some dedicated
HTTP server. This subsection provides guidance on how to configure some common
reverse proxies.

Nginx
~~~~~

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
~~~~~~

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

        ProxyPass /myapp http://127.0.0.1:5100/myapp
        ProxyPassReverse /myapp http://127.0.0.1:5100/myapp

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

Unix sockets with proxies
-------------------------

In some cases, you might want to connect the proxied Bokeh server to the
proxy using a Unix socket, rather than a websocket. You can bind the Bokeh
server to a Unix socket and use Nginx or Apache to proxy to a Unix domain
socket.

.. note::
    Binding to a Unix socket is not supported on Windows.

.. code-block:: sh

    bokeh serve --unix-socket /path/to/socket.sock

A Nginx config could look like this example:

.. code-block:: nginx

    upstream myserver {
        server unix:/path/to/socket.sock;
    }

    server {
        listen 80 default_server;
        server_name _;

        access_log  /tmp/bokeh.access.log;
        error_log   /tmp/bokeh.error.log debug;

        location / {
            proxy_pass http://myserver;
        }

    }

Please be aware that Bokeh server network options such as websocket origins
and SSL configuration are incompatible with Unix sockets. It would be up to
the proxy to enforce these restrictions at the front end.

If there are multiple users who share the host, you can restrict the file
permissions on the socket to restrict access to the proxied server.

Reverse proxying with Nginx and SSL
-----------------------------------

To deploy a Bokeh server behind an SSL-terminated Nginx proxy, you need a
few additional customizations. In particular, you have to configure the
Bokeh server with the ``--use-xheaders`` flag.

.. code-block:: sh

    bokeh serve myapp.py --port 5100 --use-xheaders

The ``--use-xheaders`` flag causes Bokeh to override the remote IP and
URI scheme/protocol for all requests with ``X-Real-Ip``, ``X-Forwarded-For``,
``X-Scheme``, and ``X-Forwarded-Proto`` headers when they are available.

You also need to customize Nginx. In particular, you have to configure Nginx
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

Load balancing
--------------

The Bokeh server is scalable by design. If you need more capacity, you can
simply run additional servers. In this case, you'll generally want to run all
the Bokeh server instances behind a load balancer so that new connections are
distributed among individual servers.

.. figure:: /_images/bokeh_serve_scale.svg
    :align: center
    :width: 65%

    The Bokeh server is horizontally scalable. To add more capacity, you
    can run more servers behind a load balancer.

You can run as many Bokeh servers as you need. The following examples
are based on a setup with three Bokeh servers running on three different
ports:

.. code-block:: sh

    bokeh serve myapp.py --port 5100
    bokeh serve myapp.py --port 5101
    bokeh serve myapp.py --port 5102

The sections below propose basic configurations based on this setup. See the
`Nginx load balancer documentation`_ or the `Apache proxy balancer module
documentation`_ for more detailed information. For instance, there are
different strategies available to define how incoming connections are
distributed among server instances.

Nginx
~~~~~

First, you need to add an ``upstream`` stanza to the Nginx configuration.
This typically goes above the ``server`` stanza and looks something like the
following:

.. code-block:: nginx

    upstream myapp {
        least_conn;            # Use the least-connected strategy
        server 127.0.0.1:5100;
        server 127.0.0.1:5101;
        server 127.0.0.1:5102;
    }

The rest of the configuration uses the name ``myapp`` to refer to the above
``upstream`` stanza, which lists the internal connection information for the
three Bokeh server instances.

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

Apache
~~~~~~

First, make sure you have enabled the ``proxy_balancer`` and ``rewrite``
modules.

Add balancers for both http and websocket protocols:

.. code-block :: apache

    <Proxy "balancer://myapp_http">
        BalancerMember "http://127.0.0.1:5100/myapp"
        BalancerMember "http://127.0.0.1:5101/myapp"
        BalancerMember "http://127.0.0.1:5102/myapp"
        ProxySet lbmethod=bybusyness
    </Proxy>

    <Proxy "balancer://myapp_ws">
        BalancerMember "ws://127.0.0.1:5100/myapp"
        BalancerMember "ws://127.0.0.1:5101/myapp"
        BalancerMember "ws://127.0.0.1:5102/myapp"
        ProxySet lbmethod=bybusyness
    </Proxy>

The ``bybusyness`` load balancing method ensures that an incoming connection
is assigned to the instance that has the fewest active connections at that
time. It should yield better results than `other available algorithms`_ such
as ``byrequests``. You may have to enable ``mod_lbmethod_bybusyness``.

Finally, you can proxy websocket and http requests to the corresponding
balancers:

.. code-block:: apache

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /myapp(.*)    balancer://myapp_ws$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /myapp(.*)    balancer://myapp_http$1 [P,L]

Authentication
--------------

The Bokeh server itself does not have any facilities for authentication or
authorization. However, you can configure the Bokeh server with an "auth
provider" that hooks into Tornado's underlying capabilities. For background
information, see the Tornado docs for `Authentication and security`_. The rest
of this section assumes some familiarity with that material.

Auth module
~~~~~~~~~~~

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
~~~~~~~~~~~~~~

If you want to use Tornado's `set_secure_cookie`_ and `get_secure_cookie`_
functions in your auth module, you'll have to set a cookie secret. To do so,
use the ``BOKEH_COOKIE_SECRET`` environment variable.

.. code-block:: sh

    export BOKEH_COOKIE_SECRET=<cookie secret value>

The value should be a long, random sequence of bytes.

Security
--------

By default, the Bokeh server will accept any incoming connections with an
allowed WebSocket origin. If you specify a session ID, and a session with
that ID already exists on the server, the server will connect to that session.
Otherwise, the server will automatically create and use a new session.

If you are deploying an embedded Bokeh app within a large organization or
to the wider internet, you may want to limit who can initiate sessions, and
from where. Bokeh lets you manage session creation privileges.

WebSocket origin
~~~~~~~~~~~~~~~~

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
~~~~~~~~~~~~~~~~~~

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
~~~~~~~~~~~~

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

Scaling the server
------------------

You can fork multiple server processes with the `num-procs` option. For
example, run the following command to fork 3 processes:

.. code-block:: sh

    bokeh serve --num-procs 3

Note that the forking operation happens in the underlying Tornado server. For
further information, see the `Tornado docs`_.

.. _Apache proxy balancer module documentation: https://httpd.apache.org/docs/current/mod/mod_proxy_balancer.html
.. _other available algorithms: https://httpd.apache.org/docs/current/en/mod/mod_proxy_balancer.html#scheduler
.. _Authentication and security: https://www.tornadoweb.org/en/stable/guide/security.html
.. _get_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.get_secure_cookie
.. _Nginx load balancer documentation: http://nginx.org/en/docs/http/load_balancing.html
.. _set_secure_cookie: https://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.set_secure_cookie
.. _Tornado docs: http://www.tornadoweb.org/en/stable/tcpserver.html#tornado.tcpserver.TCPServer.start
.. _XSRF Cookies:  https://www.tornadoweb.org/en/stable/guide/security.html#cross-site-request-forgery-protection

.. |server_document|  replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`
