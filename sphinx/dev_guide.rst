
.. _devguide:

###############
Developer Guide
###############

Architecture Overview
=====================

.. _technicalvision:

Technical Vision
----------------

Photographers use the Japanese word "bokeh" to describe the blurring of the
out-of-focus parts of an image.  Its aesthetic quality can greatly enhance a
photograph, and photographers artfully use focus to draw attention to subjects
of interest.  "Good bokeh" contributes visual interest to a photograph and
places its subjects in context.

In this vein of focusing on high-impact subjects while always maintaining
a relationship to the data background, the Bokeh project attempts to
address fundamental challenges of large dataset visualization:

* How do we look at *all* the data?

  * What are the best perceptual approaches to honestly and accurately
    represent the data to domain experts and SMEs so they can apply their
    intuition to the data?

  * Are there automated approaches to accurately reduce large datasets
    so that outliers and anomalies are still visible, while we meaningfully
    represent baselines and backgrounds?  How can we do this without 
    "washing away" all the interesting bits during a naive downsampling?
        
  * If we treat the pixels and topology of pixels on a screen as a bottleneck
    in the I/O channel between hard drives and an analyst's visual cortex, 
    what are the best compression techniques at all levels of the data 
    transformation pipeline?

* How can scientists and data analysts be empowered to use visualization
  fluidly, not merely as an output facility or one stage of a pipeline,
  but as an entire mode of engagement with data and models?

  * Are language-based approaches for expressing mathematical modeling
    and data transformations the best way to compose novel interactive
    graphics?

  * What data-oriented interactions (besides mere linked brushing/selection)
    are useful for fluid, visually-enable analysis?

One guiding principle for the development of Bokeh is to provide useful
software for people, while incorporating novel ideas from the academic
world of visualization research.  Too many great ideas in visualization
stay trapped in grad school, instead of improving the lives of scientists
and analysts.

Bokeh is one of several open-source components of the broader technical
vision of `Continuum Analytics <http://continuum.io>`_.  By providing powerful data
description and vector computing on remote and distributed data via 
`Blaze <http://blaze.pydata.org>`_ and `Numba <http://numba.pydata.org>`_, and
providing interactive visualizations of them via Bokeh, we enable teams
to collaboratively perform rich analysis, share them with others (potentially
non-technical members of their team or business), and rapidly create
analytical dashboards and monitoring interfaces.

Additionally, as a modular and open-source project, we hope that Bokeh will
enable many other projects to build a rich suite of domain-specific applications
that change existing, legacy paradigms of data processing workflow.

.. _bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with.  This library is written primarily in Coffeescript
and is one of the very unique things about the Bokeh plotting system.

BokehJS Motivations
-------------------

When researching the wide field of Javascript plotting libraries, we found
that they were all architected and designed to integrate with other Javascript.
If they provided any server-side wrappers, those were always "second class" and
primarily designed to generate a simple configuration for the front-end JS.  Of
the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself.  Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of Javascript.

Goals
-----

BokehJS is intended to be a standalone, first-class Javascript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.  Currently we use HTML5 Canvas, and in the
future this may be extended to include WebGL.  We are keeping a very
close watch over high-performance Javascript technologies, including
web workers, asm.js, SIMD, and parallel JS (e.g. River Trail).


.. _pythoninterface:

Python Interface
================

*Coming soon*

Properties
----------


Sessions
--------


Low-level Glyph Interface
-------------------------


Plotting.py
-----------



.. _developer_install:

Installation for Developers
===========================

Bokeh development is complicated by the fact that there is Python code and
Coffeescript in Bokeh itself, and there is Coffeescript in BokehJS.

It is possible to set up just for development on Bokeh, without having a
development install of BokehJS.  To do this, just run ``python setup.py``.
This will copy the pre-built ``application.js`` and ``bokehnotebook.js`` files
from the ``jsbuild/`` directory into the correct place in the source tree.

If you want to do development on BokehJS as well, then modify the subtree
source in the ``subtree/bokehjs/`` directory, and run ``python exportjs.py``
in the top-level Bokeh directory.  (You must re-run exportjs.py after all
bokehjs changes.)  ONLY DO THIS IF YOU KNOW WHAT YOU ARE DOING!

If you have any problems with the steps here, please contact the developers 
(see :ref:`contact`).

Coffeescript
------------

To develop Bokeh you will need to `install
coffeescript <http://coffeescript.org/#installation>`_, which depends on
`node.js <http://nodejs.org/>`_.

Hem
---

We're using our own fork of hem to manage the build process.  *This will be
changing in version 0.3, when we will move to a different set of Javascript
technologies for building the front-end.*

Please clone this repo: `https://github.com/ContinuumIO/hem <https://github.com/ContinuumIO/hem>`_.
hem will compile coffeescript, combine js files, and support node.js require
syntax on the client side.

Install it by executing the following inside the hem repo::

    $ sudo npm link

This will link hem to your working copy so you get hem changes as we push it
out.  Inside ``bokeh/server/`` of the Bokeh repo, execute::

    $ hem server &
    
The hem server will serve up coffeescript, compiling them on the fly.

Developing with Hem Server
--------------------------

To run the debug webserver, execute ``bokeh-server -d -j``.  The debug
webserver is configured to ask the hem server for compiled javascript, rather
than read the pre-compiled application.js off of disk.

For the embedded plotting examples, or the production server, you will need to
compile the js yourself.

   * Go to the ``bokeh/server/`` directory.
   * ``hem build -d`` will build the Bokeh application.js file
   * ``hem build -d -s slug.notebook.json`` will build bokehnotebook.js, which
     is used for all the notebook examples
   * the ``-d`` option will prevent hem from uglifying the js, which breaks the
     notebook export at the moment.

