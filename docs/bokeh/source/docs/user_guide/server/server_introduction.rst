.. _ug_server_introduction:

Overview
========

A Bokeh server application builds plots, widgets and Python callbacks for a
browser. Each session owns a :class:`~bokeh.document.Document`. Changes to
its models travel between Python and BokehJS over a WebSocket connection.

.. _ug_server_app_forms:

Comparing script apps and module apps
-------------------------------------

**Module apps** expose a ``modify_document(doc)`` function or an explicit
:class:`~bokeh.application.Application` object through ordinary Python imports.
The module is imported once. The document function runs for each session.
Keep models inside that function so that sessions do not share model instances.

**Script apps** use a Python script or a directory containing ``main.py``.
Bokeh executes the script for each session and supplies :func:`~bokeh.io.curdoc`.
Directory apps can discover assets, templates, themes and lifecycle hooks.

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Aspect
     - Module apps
     - Script apps
   * - Entry point
     - An imported ``modify_document(doc)`` function or ``Application`` object
     - A Python script or a directory containing ``main.py``
   * - Session creation
     - Call the document function for each session
     - Execute the script for each session
   * - State
     - Function-local state belongs to the session. Module state is shared.
     - Script globals belong to the session. Imported modules can share state.
   * - Configuration
     - Configure themes, templates, static assets and lifecycle hooks explicitly
     - Directory apps discover these files and hooks
   * - Hosting
     - Expose ``BokehASGI`` to an ASGI server or parent application
     - Use ``bokeh serve`` or load the script with ``BokehASGI``
   * - Good fit
     - Reusable application code, imports and testing
     - Quick experiments and existing applications

Start with a module app for reusable code. Both forms support Python callbacks
and interactive documents. Neither form requires a web framework.
See :ref:`ug_server_script_to_module` to convert an existing script app.

Hosting choices
---------------

An ASGI server can run :class:`~bokeh.server.asgi.BokehASGI` directly. A larger
website can mount it alongside its own routes and middleware. Neither choice
requires changing a module app's document function.

``bokeh serve`` loads script apps and uses ASGI internally. For direct hosting,
``BokehASGI`` can also load an existing script app from its file path.
Application form and hosting method are separate choices.

Choosing the hosting setup
--------------------------

``bokeh serve`` provides convenient hosting for script and directory apps. It
supports Python callbacks, document templates, authentication policies, custom
application indexes, diagnostics and static-file serving.

Direct ASGI hosting can be just as small for a module app. Create ``app.py``:

.. code-block:: python

    from bokeh.models import Slider
    from bokeh.server.asgi import BokehASGI


    def modify_document(doc):
        doc.add_root(Slider(start=0, end=10, value=1))


    app = BokehASGI(modify_document)

Run it with ``python -m uvicorn app:app``. No web framework is needed.
See :ref:`ug_server_getting_started` for an example with a Python callback.

A direct host also gives you control when Bokeh becomes part of a larger
website or deployment. These features concern the surrounding service as well
as the plots:

.. list-table::
   :header-rows: 1
   :widths: 22 35 43

   * - Feature
     - When it becomes useful
     - ASGI approach
   * - Additional HTTP routes
     - Your application serves APIs or pages alongside its plots.
     - Mount ``BokehASGI`` in a parent ASGI application and define the other
       routes there. A web framework is optional.
   * - Login and logout pages
     - Your website manages login forms or an identity provider.
     - Provide those endpoints in the parent application or a gateway. Use
       ``AuthPolicy`` to authenticate Bokeh requests.
   * - Signed cookies and CSRF protection
     - Custom web endpoints manage browser credentials and submissions.
     - Use the parent framework's security facilities. Bokeh session signing
       and origin checks protect Bokeh connections.
   * - Multiple worker processes
     - Deployment needs more than one server process.
     - Let the ASGI server or process manager run workers. Route requests to
       the process that owns the session and plan how workers share data.
   * - Transport tuning
     - You need WebSocket or HTTP settings beyond the CLI options.
     - Configure the HTTP and WebSocket options supported by your chosen
       ASGI server.
   * - Embedding in another Python service
     - The surrounding service owns startup, shutdown and the event loop.
     - Expose ``BokehASGI`` through that service. Use application lifecycle
       hooks for resources owned by the Bokeh application.

See :ref:`ug_server_hosting`, :ref:`ug_server_frameworks` and
:ref:`ug_server_deploy` for the corresponding hosting examples and deployment
configuration.

Other considerations
--------------------

Development, external data sources and request credentials have their own
configuration:

* For development autoreload, run a module app with
  ``python -m uvicorn app:app --reload``.
* The CLI accepts Python scripts and directory apps. Put notebook application
  code in a script or document function for serving. Use notebooks for
  interactive plotting.
* External Python producers communicate through application-owned APIs or
  shared data services.
* Read request headers and cookies from server-side session context. Generated
  session tokens contain query arguments and explicit application metadata.

See :ref:`ug_server_authentication` for authentication setup and the browser
login flow, and :ref:`ug_server_session_request` for request context.

Example collections
-------------------

* :bokeh-tree:`examples/server/module_apps` groups reusable examples by topic.
* :bokeh-tree:`examples/server/script_apps` is a flat collection of scripts and
  directory apps with task-oriented names.

Hosted applications execute Python code. Only run code you trust. A shared
Bokeh process is not an isolation boundary for untrusted application authors.
