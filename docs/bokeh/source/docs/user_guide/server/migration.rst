.. _ug_server_migration:

Migrating to 4.0
================

``bokeh serve`` remains available for script and directory apps. It uses
framework-free ASGI and Uvicorn instead of Tornado. Module apps can be hosted
directly through ASGI or mounted in a larger website.

Removed interfaces
------------------

* ``bokeh.client``, including ``pull_session`` and ``push_session``, has been
  removed. Customize documents inside the application using callbacks and
  authenticated request context. Use an application-owned data service for
  external producers.
* Tornado ``Server``, ``BaseServer``, ``BokehTornado`` and ``IOLoop`` hosting
  interfaces have been removed. Use ``BokehASGI``.
* ``extra_patterns`` and custom Tornado request handlers have been removed.
  Add HTTP routes to the parent ASGI application.
* ``AuthProvider``, ``AuthModule`` and ``--auth-module`` have been removed.
  Use ``AuthPolicy`` and ``--auth-policy module:attribute``.
* Tornado signed-cookie and XSRF helpers are no longer supplied by Bokeh.
  Custom HTTP endpoints use their host framework's facilities.

CLI changes
-----------

The CLI no longer accepts notebook application files, ``--num-procs``,
``--dev``, ``--cookie-secret``, ``--enable-xsrf-cookies``, custom index/favicon
options, diagnostic timer options or fine-grained compression controls.
Unsupported flags are errors. Retired authentication environment/configuration
settings also fail startup rather than silently disabling authentication.

Direct ASGI hosting uses explicit host configuration. Configure TLS, trusted
proxies, WebSocket limits and keepalive on the host. See
:ref:`ug_server_deploy`.

Request context changes
-----------------------

Server-side ``doc.session_context.request.cookies`` retains cookies from the
real initiating request by default. A reconnect preserves that initial snapshot.
Supplied token cookie claims do not override request cookies, including in
external-signed sessions.

Generated session tokens no longer copy Authorization, Proxy-Authorization or
raw Cookie headers. Cookie filters now affect server-side context only. Neither
``include_cookies`` nor ``exclude_cookies`` copies cookies into tokens. Code that
reads cookies from ``token_payload`` should use
``session_context.request.cookies`` instead.

Session headers now consistently come from the real initiating request, with
header filters applied. Explicitly including Authorization makes it available
server-side but never copies it into tokens. Supplied token header claims no
longer replace session request headers. Custom token metadata remains available
through ``token_payload``. Keep secrets out of that browser-visible metadata.
Request hooks and authentication policies still receive the original request.
See :ref:`ug_server_session_request` and :ref:`ug_server_session_signing`.

Example paths
-------------

The former ``examples/server/app`` collection is now split into a flat
``script_apps`` collection and topic-based ``module_apps`` examples. Framework
integrations live under ``module_apps/frameworks``. Each module example has a
README with its launch command from the repository root.

See :ref:`ug_server_script_to_module` for the application conversion steps.
Independent notebook display and the Jupyter export integration remain
available. Their dependencies do not define the CLI hosting model.
