.. _ug_server_frameworks:

Integrating with frameworks
===========================

Use a framework when the website needs its own routes, middleware or login
pages. Bokeh remains responsible for documents and callbacks.

The examples share the Fourier application so that the framework code is easy
to compare:

* :bokeh-tree:`examples/server/module_apps/frameworks/embed_in_fastapi/server.py`
* :bokeh-tree:`examples/server/module_apps/frameworks/embed_in_starlette/server.py`
* :bokeh-tree:`examples/server/module_apps/frameworks/embed_in_django/server.py`
* :bokeh-tree:`examples/server/module_apps/frameworks/embed_in_streamlit/server.py`

Install the framework used by an example in your application's environment.
Run from the repository root, for example:

.. code-block:: sh

    python -m uvicorn examples.server.module_apps.frameworks.embed_in_fastapi.server:app

Mounting and lifecycle
----------------------

A Bokeh application can be mounted inside FastAPI or Starlette:

.. code-block:: python

    from contextlib import asynccontextmanager

    from fastapi import FastAPI
    from bokeh.server.asgi import BokehASGI
    from my_app import modify_document

    plots = BokehASGI(modify_document)


    @asynccontextmanager
    async def lifespan(site):
        await plots.core.start()
        try:
            yield
        finally:
            await plots.core.stop()


    site = FastAPI(lifespan=lifespan)
    site.mount("/plots", plots)

The lifespan above connects the mounted Bokeh application to the parent
application's startup and shutdown. See :ref:`ug_server_asgi_lifespan` for
lifecycle ownership. Mount paths are included in Bokeh resource and WebSocket
URLs through ASGI ``root_path``.

Shared data and Streamlit
-------------------------

:bokeh-tree:`examples/server/module_apps/frameworks/share_data_with_fastapi/server.py`
adds a producer using the same document function and async producer as
:bokeh-tree:`examples/server/module_apps/lifecycle/share_data_with_asgi`. See :ref:`ug_server_shared_data` for producer ownership and
updates across sessions.

:bokeh-tree:`examples/server/module_apps/frameworks/control_particles_with_streamlit`
uses Streamlit controls and Bokeh rendering. Viewer state is separate for each
viewer. The particle simulation runs in the browser. This larger example is
optional reading after the introductory integrations.
