.. _ug_server_script_to_module:

Converting script apps to module apps
=====================================

Changing the host and changing the application form are separate steps.
``BokehASGI`` can load an existing script path, but ordinary imported document
functions make reuse and testing easier.

Extract document construction
------------------------------

Move model creation and callbacks into ``modify_document(doc)``. Replace
``curdoc()`` with the ``doc`` argument. Keep imports at module scope and models
inside the function. Each call must build an independent model graph.

Callbacks can close over session variables. If an old callback changes a script
global, make that state local to ``modify_document`` and use ``nonlocal`` where
needed. Do not accidentally turn per-session state into shared module state.

Compare the two slider examples:

* :bokeh-tree:`examples/server/script_apps/adjust_plot_with_sliders.py`
* :bokeh-tree:`examples/server/module_apps/getting_started/adjust_plot_with_sliders/main.py`

Replace directory discovery
----------------------------

Configure the theme and template explicitly on the document. Supply static
assets through an application handler or the surrounding host. Resolve asset
paths relative to ``__file__`` rather than changing the working directory.

Move ``app_hooks.py`` behavior into explicit application lifecycle methods or
the host's ASGI lifespan. Keep per-session cleanup with its document.
See :ref:`ug_server_lifecycle` and
:bokeh-tree:`examples/server/module_apps/lifecycle/track_stocks/server.py`.

Add the ASGI entry point
------------------------

For a simple app, put document construction in ``main.py`` and expose
``app = BokehASGI(modify_document)`` in the same file. Run it with
``python -m uvicorn main:app``. No web framework is required.

When authentication, lifecycle hooks or static asset handling need separate
setup, keep the document function in ``app.py`` and import it into ``server.py``.
Expose the ASGI application as ``app`` and run ``python -m uvicorn server:app``.
Add a framework later if the website needs more routes or middleware.

Each example README gives its exact launch command from the repository root.
Both forms use ordinary imports and do not execute their former scripts.
The ``bokeh serve`` command continues to accept scripts and directories only.
