.. _userguide_server:

Deploying the Bokeh Server
==========================

.. contents::
    :local:
    :depth: 2

.. program:: bokeh-server

.. _userguide_server_overview:

Overview
--------

The Bokeh server is an optional component that can be used to provide
additional capabilities, such as:

* publishing Bokeh plots for wider audiences
* streaming data to automatically updating plots
* interactively visualizing very large datasets
* building dashboards and apps with sophisticated interactions

The Bokeh server is built on top of `Flask`_, specifically as a
`Flask Blueprint`_. You can embed the Bokeh server functionality inside
a Flask application, or deploy the server in various configurations
(described below), using this blueprint. The Bokeh library also ships
with a standalone executable ``bokeh-server`` that you can easily run to
try out server examples, for prototyping, etc. however it is not intended
for production use.

The basic task of the Bokeh Server is to be a mediator between the original data
and plot models created by a user, and the reflected data and plot models in the
BokehJS client:

.. image:: /_images/bokeh_server.png
    :align: center
    :scale: 80 %

Here you can see illustrated the most useful and compelling of the Bokeh server:
**full two-way communication between the original code and the BokehJS plot.**
Plots are published by sending them to the server. The data for the plot can be
updated on the server, and the client will respond and update the plot. Users can
interact with the plot through tools and widgets in the browser, then the results of
these interactions can be pulled back to the original code to inform some further
query or analysis (possibly resulting in updates pushed back the plot).

We will explore the capabilities afforded by the Bokeh server in detail below.

Concepts
--------

Running the Example Server
--------------------------


Publishing to the Server
------------------------


Streaming Data with the Server
------------------------------


Downsampling with Server
------------------------


Reacting to User Interactions
-----------------------------


Building Bokeh Applications
---------------------------


Deploying for Production
------------------------



.. _Flask: http://flask.pocoo.org
.. _Flask Blueprint: http://flask.pocoo.org/docs/0.10/blueprints