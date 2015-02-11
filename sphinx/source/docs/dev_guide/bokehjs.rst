.. _devguide_bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with.  This library is written primarily in CoffeeScript
and is one of the very unique things about the Bokeh plotting system.

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

.. warning::
    While it is possible in principle to construct plots using only BokehJS
    models directly, this would be somewhat tedious. Work is ongoing to create
    higher level integrations and interfaces for BokehJS.

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas, and designed
for high-performance rendering of larger data sets. Its interface is declarative,
in the style of Protovis_, but its implementation consists of a reactive scene
graph (similar to Chaco_. Some examples for different types of plots are show
below in `devguide_bokehjs_examples`_.

The full BokehJS interface is described detail in :doc:`../reference/bokehjs`

.. _devguide_bokehjs_dependencies:

Dependencies
------------

BokehJS ships with all of its vendor dependencies built in. For reference, the
vendor libraries that BokehJS includes are:

* almond
* backbone-amd
* bootstrap-3.1.1
* font-awesome-4.2.0
* gear-utils
* hammer.js-2.0.4
* jqrangeslider-5.7.0
* jquery-1.11.1
* jquery-event-2.2
* jquery-mousewheel-3.1.12
* jquery-ui-1.11.2
* jsnlog.js-2.7.5
* kiwi
* numeral.js-1.5.3
* qunit
* rbush
* requirejs
* slick-grid-2.1.0
* sprintf
* text
* timezone
* underscore-amd

.. _devguide_bokehjs_examples:

Examples
--------

.. warning::
    These examples currently use an old, deprecated engineering JS interface
    that has since been remvoed.  Work is ongoing to create a new interface
    and update these examples.

Several live examples that demonstrate the BokehJS interface are available on
JSFiddle_. Click on "CoffeeScript" to see the code that generates these plots,
or on "Edit in JSFiddle" to fork and create your own examples.

Scatter
~~~~~~~

This example shows a scatter plot where every circle has its own radius and
color.

.. raw:: html

    <iframe
        width="100%"
        height="700"
        src="http://jsfiddle.net/bokeh/Tw5Sm/embedded/result,js/"
        allowfullscreen="allowfullscreen"
        frameborder="0"
    ></iframe>

Lorenz
~~~~~~

This example shows a 2D projection of the Lorenz attractor. Sections of the
line are color-coded by time.

.. raw:: html

    <iframe
        width="100%"
        height="700"
        src="http://jsfiddle.net/bokeh/s2k59/embedded/result,js"
        allowfullscreen="allowfullscreen"
        frameborder="0"
    ></iframe>

Animated
~~~~~~~~

This example shows how it it possible to animate BokehJS plots by updating
the data source.

.. raw:: html

    <iframe
        width="100%"
        height="700"
        src="http://jsfiddle.net/bokeh/K8P4P/embedded/result,js/"
        allowfullscreen="allowfullscreen"
        frameborder="0"
    ></iframe>

.. _Chaco: http://code.enthought.com/chaco/
.. _JSFiddle: http://jsfiddle.net/
.. _Protovis: http://mbostock.github.io/protovis/

