.. _ug_server_introduction:

Overview
========

A Bokeh server application builds plots, widgets and Python callbacks for a
browser. Each session owns a :class:`~bokeh.document.Document`. Changes to
its models travel between Python and BokehJS over a WebSocket connection.

Application forms
-----------------

**Module apps** expose a ``modify_document(doc)`` function or an explicit
:class:`~bokeh.application.Application` object through ordinary Python imports.
The module is imported once. The document function runs for each session.
Keep models inside that function so that sessions do not share model instances.

**Script apps** use a Python script or a directory containing ``main.py``.
Bokeh executes the script for each session and supplies :func:`~bokeh.io.curdoc`.
Directory apps can discover assets, templates, themes and lifecycle hooks.

Hosting choices
---------------

An ASGI server can run :class:`~bokeh.server.asgi.BokehASGI` directly. A larger
website can mount it alongside its own routes and middleware. Neither choice
requires changing a module app's document function.

``bokeh serve`` loads script apps and uses ASGI internally. For direct hosting,
``BokehASGI`` can also load an existing script app from its file path.
Application form and hosting method are separate choices.

Example collections
-------------------

* :bokeh-tree:`examples/server/module_apps` groups reusable examples by topic.
* :bokeh-tree:`examples/server/script_apps` is a flat collection of scripts and
  directory apps with task-oriented names.

Hosted applications execute Python code. Only run code you trust. A shared
Bokeh process is not an isolation boundary for untrusted application authors.
