.. _devguide:

###############
Developer Guide
###############

.. contents::
    :local:
    :depth: 2

Architecture Overview
=====================

.. _bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with.  This library is written primarily in CoffeeScript
and is one of the very unique things about the Bokeh plotting system.

.. _bokehjs_motivations:

BokehJS Motivations
-------------------

When researching the wide field of JavaScript plotting libraries, we found
that they were all architected and designed to integrate with other JavaScript.
If they provided any server-side wrappers, those were always "second class" and
primarily designed to generate a simple configuration for the front-end JS.  Of
the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself.  Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of JavaScript.

.. _bokehjs_goals:

Goals
-----

BokehJS is intended to be a standalone, first-class JavaScript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.  Currently we use HTML5 Canvas, and in the
future this may be extended to include WebGL.  We are keeping a very
close watch over high-performance JavaScript technologies, including
web workers, asm.js, SIMD, and parallel JS (e.g. River Trail).

.. _bokehjs_interface:

Interface
---------

BokehJS is a standalone JavaScript library for dynamic and interactive visualization
in the browser. It is built on top of HTML5 canvas, and designed for high-performance
rendering of larger data sets. Its interface is declarative, in the style of
`Protovis <http://mbostock.github.io/protovis/>`_, but its implementation consists of
a reactive scene graph (similar to `Chaco <http://code.enthought.com/chaco/>`_). Some
examples for different types of plots are show below in `bokehjs_examples`_.

The full BokehJS interface is described detail in :doc:`bokehjs`

.. _bokehjs_location:

Location
--------

The BokehJS files are available via CDN at pydata.org.
For instance, for version 0.4:

* http://cdn.pydata.org/bokeh-0.4.js
* http://cdn.pydata.org/bokeh-0.4.css
* http://cdn.pydata.org/bokeh-0.4.min.js
* http://cdn.pydata.org/bokeh-0.4.min.css

.. _bokehjs_examples:

Examples
--------

Several live examples that demonstrate the BokehJS interface are available as JSFiddles.
Click on "CoffeeScript" to see the code that generates these plots, or on "Edit in
JSFiddle" to fork and create your own examples.

Scatter
*******

This example shows a scatter plot where every circle has its own radius and color.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/Tw5Sm/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Lorenz
******

This example shows a 2D projection of the Lorenz attractor. Sections of the line are color-coded
by time.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/s2k59/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Animated
********

This example shows how it it possible to animate BokehJS plots by updating the data source.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/K8P4P/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


.. _pythoninterface:

Python Interface
================

*Coming soon*

Properties
----------


Sessions
--------


Low-level Object Interface
--------------------------

Here is a notional diagram showing the overall object system in Bokeh. We will discuss each
of these in turn.

.. image:: /_images/objects.png
    :align: center

High Level Plotting Interface
-----------------------------



.. _developer_install:

Installation for Developers
===========================

Bokeh development is complicated by the fact that there is Python code and
CoffeeScript in Bokeh itself, and there is CoffeeScript in BokehJS.

It is possible to set up just for development on Bokeh, without having a
development install of BokehJS.  To do this, just run ``python setup.py install``.
This will copy the pre-built ``bokeh.js`` from the ``bokehjs/release`` directory
into the correct place in the source tree.

If you want to do development on BokehJS as well, then modify the CoffeeScript
source in the ``bokehjs/`` directory, and follow the instructions below for
building/installing CoffeeScript.  Then run ``python setup.py devjs``.
ONLY DO THIS IF YOU KNOW WHAT YOU ARE DOING!

If you have any problems with the steps here, please contact the developers
(see :ref:`contact`).

CoffeeScript
------------

Building the CoffeeScript BokehJS library has a number of requirements:

You need to have node.js and the node package manager (npm) installed.

We're using Grunt for our CoffeeScript build tool.  Grunt will compile
CoffeeScript, combine js files, and support node.js require syntax on the
client side.  Install grunt by executing::

    $ npm install -g grunt-cli

.. note:: The following commands should be executed in the ``bokejs``
          subdirectory of the top level checkout.

In order to build the JavaScript files that comprise ``bokeh.js``, first install
necessary dependencies::

    $ npm install

This command will install build dependencies in the node_modules subdirectory.

To compile the CoffeeScript into JavaScript, execute grunt::

    $ grunt build

At this point bokeh can be be used as an `AMD module together with
require.js <http://requirejs.org/docs/whyamd.html>`_. To build a single
``bokeh.js`` that may be included as a script, see below.

Grunt can concatenate the JavaScript files into a single JavaScript file,
either minified or unminified. To generate a minified script, execute the
command::

    $ grunt mindeploy

The resulting script will have the filename ``bokeh.min.js`` and be located in
the ``build/js`` subdirectory.

To generate an un-minified script, (useful for debugging or developing
bokehjs), execute the command::

    $ grunt devdeploy

The resulting script will have the filename bokeh.js and be located in
the ``build/js`` subdirectory.

To generate both minified and un-minified output in the ``build/js``
subdirectory, execute the command::

    $ grunt deploy
