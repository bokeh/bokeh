.. _ug_server_deploy:

Deployment
==========

The same deployment considerations apply to script apps and module apps.
Start with one process and add infrastructure when the application needs it.

TLS and reverse proxies
-----------------------

Serve public applications over HTTPS. Terminate TLS at a reverse proxy or
configure the ASGI host directly. For ``bokeh serve``, use ``--ssl-certfile``
and ``--ssl-keyfile`` for direct TLS termination.

A proxy must forward the public Host and browser Origin headers. Preserve
WebSocket upgrade headers and ``Sec-WebSocket-Protocol``. Bokeh uses the
``bokeh`` subprotocol followed by the session token.

If the proxy removes a public URL prefix, configure the host's ASGI
``root_path`` to represent it. A parent framework mount supplies this
information automatically. The CLI uses ``--prefix`` instead and requires
the proxy to preserve that prefix. Check document, static asset, embedding and
WebSocket URLs together.

Only trust forwarded scheme and client-address headers from known proxies.
With the CLI, enable ``--use-xheaders`` and set ``--forwarded-allow-ips`` to
those addresses. The default is ``127.0.0.1``. Forwarded headers do not
authenticate users.

Origin restrictions
-------------------

Use ``extra_websocket_origins`` with ``BokehASGI`` or
``--allow-websocket-origin`` with ``bokeh serve`` for public page hosts,
including direct access through a reverse proxy and pages embedded at a
different origin. List the public page hosts explicitly. Avoid wildcards.
An origin allowlist is not a replacement for user authentication.

Authentication and tokens
-------------------------

Configure :ref:`ug_server_authentication` for dynamic HTTP and WebSocket
requests. Application static assets are public and must not contain private
data. See :ref:`ug_server_session_signing` for signing, secret configuration
and the request data copied into tokens. Keep secrets out of source control
and URLs.

Connections and resource limits
--------------------------------

Configure maximum WebSocket message size, keepalive and ping timeout on the
ASGI host. Proxy idle timeouts must allow long-lived WebSocket connections.
``bokeh serve`` exposes ``--websocket-max-message-size`` and ``--keep-alive``.
The latter takes milliseconds and zero disables pings.

Use session lifetime and cleanup settings to release disconnected documents.
See :ref:`ug_server_session_cleanup` for releasing session resources and
:ref:`ug_server_asgi_lifespan` for application shutdown.

Multiple workers
----------------

Documents, callbacks and shared Python data are process-local. HTTP bootstrap
and the subsequent WebSocket must reach the worker that owns the session.
Multi-worker deployments need session affinity. Shared producers must deliver
updates to every worker, often through an external data service or broker.

``bokeh serve`` runs one process. Configure advanced worker deployment through
an explicit ASGI host. Do not assume that adding workers makes shared Python
objects available across processes.
