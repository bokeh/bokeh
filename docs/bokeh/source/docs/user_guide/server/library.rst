.. _ug_server_library:

Bokeh server APIs
=================

ASGI applications
-----------------

:class:`~bokeh.server.asgi.BokehASGI` is a framework-neutral ASGI 3 application
that can be served directly or mounted inside another ASGI application. Bokeh
does not select or install an ASGI server or framework:

.. code-block:: python

   from pathlib import Path

   from bokeh.server.asgi import BokehASGI

   application = BokehASGI({"/plot": Path("bkapp.py")})

Save this as ``main.py`` and serve it using any ASGI 3 server, for example
``python -m uvicorn main:application``. To mount it in FastAPI or Starlette:

.. code-block:: python

   from contextlib import asynccontextmanager
   from pathlib import Path

   from fastapi import FastAPI

   from bokeh.server.asgi import BokehASGI

   bokeh_app = BokehASGI({"/": Path("bkapp.py")})

   @asynccontextmanager
   async def lifespan(site):
       # Mounted FastAPI/Starlette applications don't receive lifespan events.
       await bokeh_app.core.start()
       try:
           yield
       finally:
           await bokeh_app.core.stop()

   site = FastAPI(lifespan=lifespan)
   site.mount("/bokeh", bokeh_app)

Path applications use the same formats as ``bokeh serve``. A path may identify
a Python script or a directory-style application containing ``main.py`` or
``main.ipynb``. Directory applications also support ``app_hooks.py``,
``server_lifecycle.py``, ``static``, ``templates/index.html``, and
``theme.yaml``. Application code runs once per session and modifies
:func:`~bokeh.io.curdoc`. Relative paths are resolved from the server process's
working directory. Existing explicit application forms remain supported:

.. code-block:: python

   from bokeh.application import Application
   from bokeh.application.handlers.function import FunctionHandler

   explicit = Application(FunctionHandler(modify_document))
   BokehASGI({"/explicit": explicit, "/callable": modify_document})

The mount's ASGI ``root_path`` is included automatically in Bokeh resource and
websocket URLs. Equivalent complete examples are available for:

* :bokeh-tree:`examples/server/api/asgi/fastapi_embed.py`
* :bokeh-tree:`examples/server/api/asgi/fastapi_shared_data.py`
* :bokeh-tree:`examples/server/api/asgi/starlette_embed.py`
* :bokeh-tree:`examples/server/api/asgi/django_embed.py`
* :bokeh-tree:`examples/server/api/asgi/framework_free.py`

The ASGI frontend handles Bokeh document, autoload, metadata, static asset, and
websocket routes, as well as application startup and shutdown through ASGI
lifespan events.

Reverse proxy deployment
~~~~~~~~~~~~~~~~~~~~~~~~

A reverse proxy must preserve the public ``Host`` and browser-supplied
``Origin`` headers. Forward ``Upgrade``, ``Connection``, and
``Sec-WebSocket-Protocol`` unchanged; Bokeh's websocket handshake requires the
``bokeh`` subprotocol followed by the session token. If the page origin is not
the public Bokeh host, add that origin to ``extra_websocket_origins``. If the
proxy strips a public path prefix, configure the ASGI server or parent mount to
put that prefix in the ASGI ``root_path`` so Bokeh generates matching resource
and websocket URLs.

Only trust forwarded client, host, and scheme headers from known proxies.
Configure websocket ping interval and timeout, proxy idle timeout, and maximum
websocket message size at the ASGI server: ASGI does not expose portable ping
frames or message-size controls to Bokeh.

Bokeh session documents and callbacks are process-local. Multi-worker
deployments therefore need session affinity, and signed sessions need the same
strong ``secret_key`` on every worker. External producers must deliver updates
to every worker. When Bokeh is mounted, use the parent-lifespan pattern above
only if the framework does not propagate lifespan events to mounted apps.

The following nginx and Apache configurations proxy a public
``/services/bokeh`` path to an ASGI server listening on port 5100. They are
also exercised by Bokeh's nightly deployment tests.

nginx:

.. literalinclude:: /../../../examples/server/deployment/asgi/nginx.conf
   :language: nginx

Apache:

.. literalinclude:: /../../../examples/server/deployment/asgi/apache.conf
   :language: apache

Updating active sessions from the host
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

An enclosing ASGI application's lifespan can own a single background producer
and publish its output to every currently active Bokeh session. Pass
:meth:`~bokeh.server.asgi.BokehASGI.update_sessions` a callable that accepts a
single :class:`~bokeh.document.document.Document`:

.. code-block:: python

   def update_document(doc):
       source = doc.get_model_by_name("shared-source")
       source.data = latest_snapshot

   await bokeh_app.update_sessions("/", update_document)

Bokeh invokes ``update_document`` once per local session with that document's
lock held. The callable may be synchronous or asynchronous, and updates to
different sessions run concurrently. Sessions created after the call starts
are not included, so application construction should also initialize a new
document from the latest snapshot. Shared data read by synchronous application
code must be immutable or protected for access from worker threads.

This operation is process-local. Deployments with multiple ASGI workers need
an external broker or data service to deliver each snapshot to every worker.
See :bokeh-tree:`examples/server/api/asgi/fastapi_shared_data.py` for a complete
lifespan-managed example.

ASGI servers send lifespan events to the top-level application. When Bokeh is
mounted under a framework that does not propagate those events to mounts, such
as FastAPI or Starlette, compose ``bokeh_app.core.start()`` and
``bokeh_app.core.stop()`` into the parent lifespan as shown above.

Authentication
~~~~~~~~~~~~~~

Authentication can be performed by the host framework, by a
:class:`~bokeh.server.auth.AuthPolicy`, or by both. An auth policy protects
Bokeh's dynamic HTTP routes and websocket handshake without importing an ASGI
framework:

.. code-block:: python

   import os

   from bokeh.server.asgi import BokehASGI
   from bokeh.server.auth import AuthPolicy

   async def authenticate(request):
       authorization = request.headers.get("authorization")
       if authorization == f"Bearer {os.environ['SITE_TOKEN']}":
           return "alice"
       return None

   policy = AuthPolicy(
       authenticate,
       login_url="/login",
       logout_url="/logout",
   )

   application = BokehASGI(
       {"/": "bkapp.py"},
       auth_policy=policy,
       sign_sessions=True,
       secret_key=os.environ["BOKEH_SECRET_KEY"].encode(),
   )

The authenticator may be synchronous or asynchronous. It returns the current
user, or ``None`` to reject a request. Unauthenticated HTTP requests redirect
to ``login_url``, when configured, and otherwise receive HTTP 401.
Unauthenticated websockets are closed before Bokeh accepts them. Login and
logout endpoints remain the responsibility of the host application.

Authentication middleware such as Starlette's commonly stores its result in
the ASGI ``scope["user"]`` value. Bokeh copies this to ``request.user``, so a
policy can enforce the host framework's result. Configure the parent
application's lifespan for this ``bokeh_app`` as shown above, then mount it:

.. code-block:: python

   def authenticate(request):
       user = request.user
       if user is not None and getattr(user, "is_authenticated", False):
           return user
       return None

   bokeh_app = BokehASGI(
       {"/": "bkapp.py"},
       auth_policy=AuthPolicy(authenticate, login_url="/login"),
   )
   site.mount("/bokeh", bokeh_app)

The authenticated user is subsequently available as
``curdoc().session_context.request.user``. ASGI ``scope["state"]`` is similarly
available to the authenticator as ``request.state``.

Session tokens are bearer credentials, not a replacement for authenticating
HTTP and websocket requests. Authenticated deployments should enable signed
sessions and configure a strong shared secret. Token payloads are signed but
not encrypted; use ``include_headers``, ``exclude_headers``,
``include_cookies``, and ``exclude_cookies`` to avoid copying secrets into
them.

The older :class:`~bokeh.server.auth_provider.AuthProvider` and
``--auth-module`` interfaces use Tornado request handlers and remain available
for the Tornado frontend. They are not required by
:class:`~bokeh.server.auth.AuthPolicy`.

Session document construction runs in worker threads. Consequently, expensive
synchronous application code does not block the event loop from accepting
unrelated HTTP or websocket work, and independent sessions can initialize
concurrently. Script applications serialize the temporary process-global
state they require, including ``sys.path``, ``sys.argv``, and the working
directory.

Embedding in Tornado
--------------------

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

If your server should honor the same environment variables and configuration
files used by ``bokeh serve`` (for example, ``BOKEH_AUTH_MODULE``,
``BOKEH_SSL_CERTFILE``, ``BOKEH_SIGN_SESSIONS``), use the
:meth:`~bokeh.server.server.Server.from_settings` factory method instead:

.. code-block:: python

   from bokeh.server.server import Server

   server = Server.from_settings(
       bokeh_applications,  # list of Bokeh applications
       io_loop=loop,        # Tornado IOLoop
       **server_kwargs
   )

   server.start()

You can also create and control an ``IOLoop`` directly. This can be useful when
creating standalone "normal" Python scripts that serve Bokeh apps or embedding
a Bokeh application in a framework like Flask or Django without having to run a
separate Bokeh server process. You can find some examples of this technique in
the examples directory:

* :bokeh-tree:`examples/server/api/flask_embed.py`
* :bokeh-tree:`examples/server/api/notebook_embed.ipynb`
* :bokeh-tree:`examples/server/api/standalone_embed.py`
* :bokeh-tree:`examples/server/api/tornado_embed.py`

Also note that every command line argument for ``bokeh serve`` has a
corresponding keyword argument for ``Server``. For instance, using the
``--allow-websocket-origin`` command line argument is equivalent to passing
``allow_websocket_origin`` as a parameter.

.. _ug_server_bokeh_client:

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
