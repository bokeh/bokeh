.. _devguide:

###############
Developer Guide
###############

.. contents::
    :local:
    :depth: 2

Testing
=======

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/ContinuumIO/bokeh.

To run the python unit tests manually, you can execute::

    $ python -c "import bokeh; bokeh.test()"

Additionally, there are "examples tests" that check whether all the examples
produce outputs. This script is in the `examples` directory and can be run by
executing::

    $ test -D

You can also run all the available test (unit tests and example tests) from the
top level directory following the next steps::

    $ export BOKEH_DEFAULT_NO_DEV=True (just do it once!)

and then::

    $ nosetests

or::

    $ nosetests --with-coverage

Currently this script does not support Windows. When adding new examples, make
sure to place them in appropriate location under `examples/` directory and use
special keywords (`server`, `animate`) in their names, if required. This will
help test script to properly classify examples and use correct test runner. If
new examples are placed under `plotting/` directory, only `animate` keyword is
required for animated examples. Placing examples elsewhere, e.g. in `glyphs/`,
may also require `server` keyword for server examples, because otherwise they
will be classified as `file` (`*.py` extension) or `notebook` examples (`*.ipynb`
extension).

There is also a bokehjs unit test suite, it can be run by changing directories
to the `bokehjs` subdirectory and executing::

    $ grunt test

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

Bokeh supports three main kinds of sessions: **file**, **server** and **notebook**.
This allows for creating static files with plots, communicating with a plot server
and rendering plots in `IPython Notebook <http://ipython.org/notebook>`, and there
are :class:`HTMLFileSession`, :class:`PlotServerSession` and :class:`NotebookSession`,
respectively, to handle those cases.

File sessions
*************

::

    >>> from bokeh.session import HTMLFileSession
    >>> session = HTMLFileSession("myplot.html")
    >>> session.save()

:func:`HTMLFileSession.save` accepts ``resources`` argument that allows to specify
how static files (JavaScript and CSS files) will be attached to generated HTML files::

    >>> session.save(resources="inline")

This is equivalent to ``session.save()`` and Bokeh will merge all static resources into
``myplot.html``. This might be convenient, because we get a single-file bundle that's
easy to move around and share, but the resulting HTML file is large, e.g. ``anscombe``
example (``examples/glyphs/anscombe.py``) creates ``anscombe.html`` file that is over
half a megabyte large (as of Bokeh 0.4.2).

An alternative is to use either ``relative`` or ``absolute`` options, which allow
for reuse of pre-generated static resources by linking to ``bokeh(.min).{js,css}``
from generated HTML file, using relative (to the working directory) or absolute
paths, respectively. In ``relative`` case, one can specify ``rootdir`` to change
working directory. Using either of those two options allows to reduce ``anscombe.html``
to under 20 kilobytes. Note that depending on the configuration, moving Bokeh or
generated ``*.html`` files around may break links and you will have to rerun your
code for the new setup.

Another option is to use ``relative-dev`` or ``absolute-dev`` which additionally
allow to use individual development files via ``requirejs`` instead of ``bokeh.*``
bundles. If developing Bokeh, this allows for very fast turnaround time when used
together with ``grunt watch`` for compiling ``bokehjs``. Don't use this in production
environments. When working with examples, it may come handy to use ``BOKEH_RESOURCES``
and ``BOKEH_ROOTDIR`` environmental variables, which allow to override any values
passed to :func:`HTMLFileSession.save`. This is useful when working with examples,
which use user-friendly defaults (user-friendly ``!=`` developer-friendly).

You can also link to static files that are available from Bokeh's `CDN <http://cdn.pydata.org>`
by setting ``resources="cdn"``. This requires an internet connection to make it work,
but is very useful for sharing plots. Note that if you are using a development version
of Bokeh, then linked resources are from latest published version prior to current
``HEAD``. This may introduce incompatibilities between Bokeh and BokehJS.

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
into the correct place in the source tree, and then install Bokeh into your
``site-packages``.

You can also use a "develop" install (one that points at your source checkout) by
running ``python setup.py develop``. This will place a ``bokeh.pth`` file in
``site-packages`` that points to your source checkout, and also  copy the pre-built
``bokeh.js`` from the ``bokehjs/release`` directory into the correct place in the
source tree. This mode is suitabe fordoing development on just Bokeh (but not BokehJS)

If you want to do development on BokehJS as well, then modify the CoffeeScript
source in the ``bokehjs/`` directory, and follow the instructions below for
building/installing CoffeeScript.  Then run ``python setup.py develop --build_js``.

.. warning:: It is not guaranteed that the previously released BokehJS and the
             current python Bokeh library in GitHub master will always be compatible.
             The ``--build_js`` option may be **required** in some circumstances.

If you have any problems with the steps here, please contact the developers
(see :ref:`contact`).

BokehJS
-------

Building the BokehJS library requires you to have `node.js` and `npm` (node
package manager) installed. We're using Grunt for building BokehJS. Grunt will
compile CoffeeScript, Less and Eco sources, combine JavaScript files, and
generate optimized and minified `bokeh.js` and `bokeh.css`.

Install Grunt by executing::

    $ npm install -g grunt-cli

.. note:: The following commands should be executed in the ``bokejs``
          subdirectory of the top level checkout.

In order to build the JavaScript files that comprise ``bokeh.js``, first install
necessary dependencies::

    $ npm install

This command will install build dependencies in the `node_modules/` subdirectory.

To compile the CoffeeScript, Less and Eco sources, issue::

    $ grunt build

At this point BokehJS can be be used as an `AMD module together with require.js
<http://requirejs.org/docs/whyamd.html>`_. To build a single ``bokeh.js`` that may
be included as a script, see below.

Grunt can concatenate the JavaScript files into a single JavaScript file, either
minified or unminified. To generate both minified and unminified libraries, issue::

    $ grunt deploy

The resulting scripts will have the filenames `bokeh.js` and `bokeh.min.js` and
be located in the ``build/js`` subdirectory.

Alternative build system
~~~~~~~~~~~~~~~~~~~~~~~~

Alternatively to `grunt`, you can use `sbt <http://www.scala-sbt.org` to build BokehJS.
To start, issue `./sbt` in the root directory. This will download `sbt` itself, its
dependencies and configure the build system. Due to this, the first run will be slow.
In general you should see (more or less) the following output::

    $ ./sbt
    [info] Loading project definition from /home/user/continuum/bokeh/project
    [info] Set current project to bokeh (in build file:/home/user/continuum/bokeh/)
    continuum (bokeh)>

There are two main commands available: `build` and `deploy`. `build` compiles CoffeeScript,
Less and Eco sources, and copies other resources to the build directory. `deploy` does the
same and additionally generates optimized and minified `bokeh.js` and `bokeh.css`. You can
also run any specific subtask if you want, e.g. `compile` to compile CoffeeScript, Less and
Eco sources, but not copy resources. You can prefix any command with `~`, which enables
incremental compilation, so e.g. `~less` will watch `*.less` sources and compile the subset
of files that changed. To stop watching sources, press ENTER (note that pressing Ctrl+C will
terminate `sbt`).

Note that `sbt`-based build system is experimental and should be used with caution.
