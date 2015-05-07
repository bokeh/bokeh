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

The Bokeh server is built on top of `Flask`_. Bokeh ships with a standalone
executable ``bokeh-server`` that you can easily run. You can also embed the
Bokeh server functionality inside another Flask server using the Bokeh Server
`Flask Blueprint`_.

The basic task of the Bokeh Server is to be a mediator between the original
data and plot models created by a user, and the reflected data and plot models
in the BokehJS client.

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