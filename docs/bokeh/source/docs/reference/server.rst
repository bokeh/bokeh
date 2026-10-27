.. _bokeh.server:

bokeh.server
============

.. automodule:: bokeh.server

Bokeh server applications create a document for each session and synchronize
it with a browser over a WebSocket. Application callbacks update that document
in Python. Both command-line hosting with ``bokeh serve`` and direct ASGI
hosting use this session model.

See :ref:`ug_server` for application forms, hosting and deployment. The modules
below document the server implementation and APIs.

.. toctree::
    :maxdepth: 2
    :glob:

    server/*
