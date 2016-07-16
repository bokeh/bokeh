.. _devguide_bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with.  This library is written primarily in CoffeeScript
and is one of the unique things about the Bokeh plotting system.

.. _devguide_bokehjs_motivations:

BokehJS Motivations
-------------------

When researching the wide field of JavaScript plotting libraries, we found
that they were all architected and designed to integrate with other JavaScript.
If they provided any server-side wrappers, those were always "second class"
and primarily designed to generate a simple configuration for the front-end JS.
Of the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself. Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of JavaScript.

.. _devguide_bokehjs_goals:

Goals
-----

BokehJS is intended to be a standalone, first-class JavaScript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.  Currently we use HTML5 Canvas, and in the
future this may be extended to include WebGL.  We are keeping a very
close watch over high-performance JavaScript technologies, including
web workers, asm.js, SIMD, and parallel JS (e.g. River Trail).

.. _devguide_bokehjs_interface:

Interface
---------

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas, and designed
for high-performance rendering of larger data sets. Its interface is declarative,
in the style of Protovis_, but its implementation consists of a reactive scene
graph (similar to Chaco_).

More information is available at :ref:`userguide_bokehjs`.

.. _Chaco: http://code.enthought.com/chaco/
.. _JSFiddle: http://jsfiddle.net/
.. _Protovis: http://mbostock.github.io/protovis/
