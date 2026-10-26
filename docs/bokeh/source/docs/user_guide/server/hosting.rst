.. _ug_server_library:
.. _ug_server_hosting:

Hosting and authentication
==========================

Module apps and script apps describe how the application is written. Hosting
describes how it is served.

Direct ASGI hosting
-------------------

A document function can be passed directly to Bokeh:

.. code-block:: python

    from bokeh.server.asgi import BokehASGI
    from my_app import modify_document

    app = BokehASGI({"/plot": modify_document})

Run ``python -m uvicorn server:app`` when this entry point is in
``server.py``. Uvicorn is installed with Bokeh. Other ASGI 3 servers can host
the same application.

For an existing script app, pass a path instead:

.. code-block:: python

    from pathlib import Path
    from bokeh.server.asgi import BokehASGI

    app = BokehASGI({"/plot": Path(__file__).with_name("plot.py")})

Path loading retains script execution and directory discovery. It does not
convert the application to ordinary module imports. Script execution manages
process-global state such as ``sys.path`` and ``sys.argv`` and is serialized
around that state. A document function avoids that script-loading machinery.

Embedding in a page
-------------------

Use ``embed_server(url).fragment(resources="server").html`` to embed a hosted
application in another page. Serve both the HTTP routes and the WebSocket route.

See :bokeh-tree:`examples/server/module_apps/hosting/embed_without_a_framework/server.py`.
This example adds a surrounding page using ASGI routing alone. Its document
function comes from
:bokeh-tree:`examples/server/module_apps/applications/fourier_studio/app.py`
and is reused by the framework examples.

.. _ug_server_authentication:

Authentication policies
-----------------------

An :class:`~bokeh.server.auth.AuthPolicy` authenticates dynamic HTTP routes and WebSocket
requests. Static assets, including application static directories, are public. The authenticator receives a framework-neutral
:class:`~bokeh.server.request.ServerRequest` and returns a user or ``None``.
Synchronous and async authenticators are supported.

.. code-block:: python

    import os
    from hmac import compare_digest

    from bokeh.server.asgi import BokehASGI
    from bokeh.server.auth import AuthPolicy
    from my_app import modify_document

    expected = ("Bearer " + os.environ["APP_ACCESS_TOKEN"]).encode("utf-8")


    def authenticate(request):
        supplied = request.headers.get("Authorization", "").encode("utf-8")
        return "engineer" if compare_digest(supplied, expected) else None


    policy = AuthPolicy(authenticate, login_url="https://login.example.org/")
    app = BokehASGI(modify_document, auth_policy=policy)

``login_url`` optionally redirects unauthenticated HTTP requests. It does not
create login pages or validate credentials. WebSocket requests must also pass
authentication. A parent website or identity provider owns login/logout flows.

The repository example uses an Authorization bearer header:
:bokeh-tree:`examples/server/module_apps/hosting/authenticate_users`.
Set ``APP_ACCESS_TOKEN`` to a strong random secret, then run its documented
command. A client or trusted gateway must supply the header on both HTTP and
WebSocket requests. An ordinary browser tab does not add it automatically.
Use TLS for credentials. Never trust a user header that an arbitrary client
can supply. An identity gateway must strip client-supplied identity headers
and restrict direct access to the backend.

.. _ug_server_session_signing:

Session signing
---------------

Session tokens are bearer credentials. They do not replace request
authentication. Enable ``sign_sessions`` and set a strong ``secret_key`` for
an authenticated deployment. Signing is disabled by default. Signed tokens
are not encrypted.
Bokeh does not automatically copy cookies, Authorization, Proxy-Authorization
or raw Cookie headers into generated tokens. Request filters do not enable
cookie copying. Keep credentials out of custom request-hook payloads and
query arguments too.

For the CLI, use ``--session-ids signed`` and set ``BOKEH_SECRET_KEY``.
The ``external-signed`` mode requires a signed session ID supplied by a trusted
service. Workers serving the same application must use the same signing secret.
See :ref:`ug_server_deploy` for routing requests to the worker that owns a session.

.. _ug_server_session_request:

Request context
---------------

The authenticated user is available as
``doc.session_context.request.user``. Query arguments map names to lists of
bytes. Request headers, cookies and ASGI state are also available through the
request context.

``doc.session_context.request.cookies`` contains a server-side snapshot of the
real request that created the session. Cookies are available here by default,
including HttpOnly cookies. They stay on the server unless application code
copies them into a model, a template or an explicit token payload.

``include_cookies`` and ``exclude_cookies`` filter this server-side snapshot
only. For example, ``include_cookies=["theme"]`` keeps only ``theme`` in context.
Neither option copies cookies into tokens.

Session headers also come from the real initiating request, with
``include_headers`` and ``exclude_headers`` applied case-insensitively.
Authorization headers are available server-side unless filtered out. They are
never copied automatically into tokens, even when explicitly included. The
server-side Cookie header is rebuilt from the filtered cookies, unless header
filters exclude it. This behavior is the same for HTTP and WebSocket creation.

Filters do not alter the original request seen by authentication policies and
request hooks. Supplied token header claims remain in ``token_payload`` and
cannot replace the real request headers.

The initiating request may be HTTP or WebSocket. Reconnecting to an existing
session does not replace its cookie snapshot. Cookie claims in a supplied token
remain accessible through ``token_payload`` but never become request cookies.
This also applies to external-signed sessions. Authentication policies always
check the actual incoming request, including each WebSocket reconnect.

.. _ug_server_request_handler:

Request hooks
-------------

An application handler can implement ``process_request(request)`` to add JSON
values to ``doc.session_context.token_payload``. Script directory apps can use
``app_hooks.py`` with a ``process_request`` function. Synchronous hooks run in a
worker and async hooks are awaited.

Hosting controls
----------------

Configure TLS, trusted proxy headers, WebSocket message limits and keepalive
on the ASGI host. Prefixes and mount paths must agree with public URLs.
See :ref:`ug_server_deploy` for deployment details.
