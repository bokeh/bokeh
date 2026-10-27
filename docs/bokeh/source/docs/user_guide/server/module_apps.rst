.. _ug_server_module_apps:

Building module apps
====================

A module app exposes a document function through a normal Python import.
Create models and callbacks inside the function. Imported modules may hold
shared data, but Bokeh model instances belong to one document at a time.

The examples use this structure:

.. code-block:: text

    adjust_plot_with_sliders/
      __init__.py
      app.py
      README.md

``app.py`` defines ``modify_document(doc)`` and exposes
``app = BokehASGI(modify_document)``. For a single-file local app, run
``python -m uvicorn app:app`` from its directory. Repository examples use
package paths from the repository root, as shown in each README. This keeps
relative imports working when an example has companion modules.

Examples with authentication, application lifecycle hooks or static asset
configuration keep document construction in ``app.py`` and hosting in
``server.py``. Their entry point is ``server:app``. The separation is useful
when hosting has setup of its own.

Explicit application objects
----------------------------

Use :class:`~bokeh.application.Application` when the application needs more than
a document function:

.. code-block:: python

    from bokeh.application import Application
    from bokeh.application.handlers.function import FunctionHandler
    from bokeh.server.asgi import BokehASGI

    from app import modify_document

    app = BokehASGI(Application(FunctionHandler(modify_document)))

Add handlers or override lifecycle methods as needed. A module app does not
automatically discover ``app_hooks.py``, ``theme.yaml`` or a ``static`` directory.
Configure these features explicitly.

.. _ug_server_apps_template:

Themes, templates and assets
----------------------------

Set ``doc.theme`` with a built-in theme name or a
:class:`~bokeh.themes.Theme` loaded from a path relative to ``__file__``.
Set ``doc.template`` to a Jinja template when the page needs a custom layout.
Use ``doc.template_variables`` for values consumed by the template.

See :bokeh-tree:`examples/server/module_apps/applications/dashboard/app.py`
for an explicit template and
:bokeh-tree:`examples/server/module_apps/applications/dashboard/server.py`
for a handler that supplies an application static directory. The host can
also serve assets through its own routes.

Bokeh serves its JavaScript at ``/static/js`` and registered extensions at
``/static/extensions/<name>``. Application assets use ``/<app>/static``.
For an application at the root, ``/static`` also serves application assets
outside the reserved JavaScript and extension paths. A mount or URL prefix
comes before these paths. These routes are public even with an auth policy.

Relative template URLs such as ``static/css/custom.css`` need a page URL ending
in ``/`` to resolve beneath a non-root application. Use an explicit URL based
on the public application path when the page URL has no trailing slash.

Testing document functions
--------------------------

A document function can be tested without starting a server:

.. code-block:: python

    from bokeh.document import Document
    from app import modify_document

    first = Document()
    second = Document()
    modify_document(first)
    modify_document(second)
    assert first.roots[0] is not second.roots[0]

Use a running host for tests that need session context, lifecycle hooks,
authentication or WebSocket synchronization. For more application examples,
see :bokeh-tree:`examples/server/module_apps/applications`.
