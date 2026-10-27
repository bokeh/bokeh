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
``--dev``, ``--cookie-secret``, ``--enable-xsrf-cookies`` or fine-grained
compression controls.
Unsupported flags are errors. Retired authentication environment/configuration
settings also fail startup rather than silently disabling authentication.

The ``--ico-path`` option, ``ico_path`` setting and ``BOKEH_ICO_PATH``
environment variable remain supported. They select the icon served at
``/favicon.ico``, under any configured URL prefix. Set the value to a ``.ico`` file path, ``"default"`` for the Bokeh
icon, or ``"none"`` to disable it. The icon is loaded when the ASGI application
is constructed.

The custom index option ``--index`` remains available. Index templates now use
Jinja2, with ``prefix`` and ``items`` available as template variables. Convert
Tornado template endings such as ``{% end %}`` to Jinja2 endings such as
``{% endfor %}``.

``--stats-log-frequency`` and ``--mem-log-frequency`` remain available in
milliseconds. Statistics are logged at DEBUG level. Memory logging requires
``psutil`` and is disabled by default.

CLI subclasses can still override ``customize_applications`` and
``customize_kwargs``. The configuration passed to ``customize_kwargs`` now
contains ASGI application options and host options. Tornado-specific options
and ``customize_server`` are not supported.

Direct ASGI hosting uses explicit host configuration. Configure TLS, trusted
proxies, WebSocket limits and keepalive on the host. See
:ref:`ug_server_deploy`.

Static-file HTTP support
------------------------

ASGI static routes retain cache validators, conditional requests and single
byte ranges without a web framework dependency. Ordinary URLs require cache
revalidation. URLs with a nonempty ``v`` query argument can be cached for one
year. Multiple ranges fall back to the full response.
See :ref:`ug_server_static_http` for static-file cache and range behavior.

Request context changes
-----------------------

Server-side ``doc.session_context.request.cookies`` retains cookies from the
real initiating request by default. A reconnect preserves that initial snapshot.
Supplied token cookie claims do not override request cookies, including in
external-signed sessions.

Generated session tokens no longer automatically copy request headers or cookies.
Header and cookie filters affect only server-side context. Code that reads these
values from ``token_payload`` should use ``session_context.request`` instead.

Session arguments also come from the actual initiating request. Supplied token
header, cookie and argument claims no longer replace request context. Custom
token metadata remains available through ``token_payload``. Generated tokens
still include query arguments as metadata, so keep secrets out of URLs and
custom payloads. Arguments are client input and must be validated.

Request hooks and authentication policies still receive the original request.
Reconnecting to an existing session preserves its initial request snapshot.
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
