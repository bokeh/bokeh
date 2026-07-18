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

Path applications use the same script format as ``bokeh serve``: their
top-level code runs once per session and modifies :func:`~bokeh.io.curdoc`.
Relative paths are resolved from the server process's working directory.
Existing explicit application forms remain supported:

.. code-block:: python

   from bokeh.application import Application
   from bokeh.application.handlers.function import FunctionHandler

   explicit = Application(FunctionHandler(modify_document))
   BokehASGI({"/explicit": explicit, "/callable": modify_document})

The mount's ASGI ``root_path`` is included automatically in Bokeh resource and
websocket URLs. Equivalent complete examples are available for:

* :bokeh-tree:`examples/server/api/asgi/fastapi_embed.py`
* :bokeh-tree:`examples/server/api/asgi/starlette_embed.py`
* :bokeh-tree:`examples/server/api/asgi/django_embed.py`
* :bokeh-tree:`examples/server/api/asgi/framework_free.py`

The ASGI frontend handles Bokeh document, autoload, metadata, static asset, and
websocket routes, as well as application startup and shutdown through ASGI
lifespan events. ASGI does not expose websocket ping frames, so transport
keepalive should be configured on the ASGI server (for example, Uvicorn's
websocket ping interval) rather than with Bokeh's
``keep_alive_milliseconds`` option.

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
