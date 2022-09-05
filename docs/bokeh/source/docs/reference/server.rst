.. _bokeh.server:

bokeh.server
============

.. automodule:: bokeh.server

By far the most flexible way to create interactive data visualizations using
the Bokeh server is to create Bokeh Applications, and serve them with a Bokeh
server. In this scenario, a Bokeh server uses the application code to create
sessions and documents for all clients (typically browsers) that connect:

.. figure:: /_images/bokeh_serve.svg
    :align: center
    :width: 65%

    A Bokeh server (left) uses Application code to create Bokeh Documents.
    Every new connection from a browser (right) results in the Bokeh server
    creating a new document, just for that session.

The application code is executed in the Bokeh server every time a new
connection is made, to create the new Bokeh ``Document`` that will be synced
to the browser. The application code also sets up any callbacks that should be
run whenever properties such as widget values are changes.

The reference links in the sidebar document the details of the Bokeh Server.
Most users will probably not need to be concerned with these details, unless
they have specialized requirements, and should refer to the User's Guide
chapter :ref:`userguide_server` for information about using the Bokeh Server.

.. toctree::
    :maxdepth: 2
    :glob:

    server/*
