.. _devguide:

###############
Developer Guide
###############

.. contents::
    :local:
    :depth: 2

.. _developer_process:

Process
=======

The development process for Bokeh is outline in `Bokeh Enhancement Proposal 1 <https://github.com/ContinuumIO/bokeh/wiki/BEP-1:-Issues-and-PRs-management>`_. All changes, enhancements, and bugfixes should generally go
through the process outlined there.

.. _developer_install:

Installation for Developers
===========================

Bokeh development is complicated by the fact the client-side BokehJS library
is written in CoffeeScript and requires an explicit compilation step. Also, it
is not guaranteed that the previously released BokehJS and the current python
Bokeh library in GitHub master will always be compatible. For this reason, in
order to do development on Bokeh from a source checkout, you must first be
able to build BokehJS.

.. _developer_building_bokehjs:

Building BokehJS
----------------

Building the BokehJS library requires you to have ``node.js`` and ``npm`` (node
package manager) installed. There exist system installers for these packages,
but if you are using conda, the easiest way to get them is to install from
the Bokeh channel on Binstar by executing the command::

    $ conda install -c bokeh nodejs

BokehJS uses Grunt for managing its build. Grunt will compile CoffeeScript,
Less and Eco sources, combine JavaScript files, and generate optimized and
minified ``bokeh.js`` and ``bokeh.css``.

If you are using conda, you can also install the Grunt command line tool
from the Bokeh channel on `Binstar <https://binstar.org>`_::

    $ conda install -c bokeh grunt-cli

Otherwise you can install Grunt by with npm by executing::

    $ npm install grunt-cli

in the ``bokehjs`` subdirectory of the Bokeh source checkout.

.. note:: The following commands should be executed in the ``bokehjs``
          subdirectory of the Bokeh source checkout.

In order to build the JavaScript files that comprise ``bokeh.js``, first install
necessary dependencies::

    $ npm install

This command will install build dependencies in the ``node_modules`` subdirectory.

Typically at this point you would use the ``setup.py`` script at the top level
to manage building and installing BokehJS as part of complete Bokeh library.
(See :ref:`developer_python_setup` for additional information.)
However, if you are using BokehJS as a standalone JavaScript library, without
the rest of Bokeh, then the instructions below describe the process to build
BokehJS.

To generate the compiled and optimized JavaScript libraries, run the command::

    $ grunt deploy

This creates both ``bokeh.js`` and ``bokeh.min.js`` scripts in the ``build/js``
subdirectory, and ``bokeh.css`` and ``bokeh.min.css`` CSS files in the
``build/css`` subdirectory.

To build the BokehJS sources without concatenating and optimizing into
standalone libraries, run the command::

    $ grunt build

At this point BokehJS can be be used together with `require.js` as an
`AMD module <http://requirejs.org/docs/whyamd.html>`_. To
automatically watch the source tree for changes and trigger a recompile
of individual files as they change, run the command::

    $ grunt watch

This can be used together with "splitjs" mode of the Bokeh server to
facilitate a more rapid development cycle.

Alternative BokehJS build system
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As an alternatively to ``grunt``, you can use `sbt <http://www.scala-sbt.org` to
build BokehJS. To start, run `./sbt` in the top level directory. This will
download `sbt` itself, its dependencies and configure the build system.
In general you should see (more or less) the following output::

    $ ./sbt
    [info] Loading project definition from /home/user/continuum/bokeh/project
    [info] Set current project to bokeh (in build file:/home/user/continuum/bokeh/)
    continuum (bokeh)>

There are two main commands available: `build` and `deploy`. The `build` command
compiles CoffeeScript, Less and Eco sources, and copies other resources to the
build directory. The `deploy` command does the same and additionally generates
optimized and minified `bokeh.js` and `bokeh.css` outputs.

You may also run specific subtasks, e.g. `compile` to compile CoffeeScript, Less and
Eco sources, but not copy resources. You can also prefix any command with `~`, which
enables incremental compilation. For example, issuing `~less` will watch `*.less`
sources and compile only the subset of files that changed. To stop watching sources,
press ENTER. Pressing Ctrl+C will terminate `sbt`.

.. warning::
        The ``sbt`` build system is experimental and not integrated with ``setup.py``
        and should be used with caution.

.. _developer_python_setup:

Python Setup
------------

Once you have a working BokehJS build (which you can verify by completing the
steps described in :ref:`developer_building_bokehjs` one time), you can
use the ``setup.py`` script at the top level to install or develop the full
Bokeh library from source.

The ``setup.py`` script has two main modes of operation: ``install`` and
``develop``.

When ``python setup.py install`` is used, Bokeh will be installed in your local
``site-packages`` directory. In this mode, any changes to the python source
code will not show up until ``setup.py install`` is run again.

When ``python setup.py develop`` is used, a path file ``bokeh.pth``
will be written to your ``site-packages`` directory that points to the
``bokeh`` subdirectory of your source checkout. Any changes to the python
source code will be available immediately without any additional steps.

With either mode, you will be prompted for how to install BokehJS, e.g.::

    $ python setup.py install

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS
    3) do not install BokehJS

    Choice?

You may skip this prompt by supplying the appropriate command line option
to ``setup.py``:

* ``--build_js``
* ``--install_js``
* ``--no_js``

If you have any problems with the steps here, please contact the developers
(see :ref:`contact`).

.. _developer_documentation:

Documentation
=============

Requirements
------------

We use `Sphinx <http://sphinx-doc.org>` to generate our HTML documentation. You
will need the following packages installed in order to build Bokeh documentation:

* docutils
* sphinx
* sphinxcontrib-napoleon

These can be installed using ``conda`` or ``pip`` or from source.

building
--------

To generate the full HTML documentation, navigate to the ``sphinx`` subdirectory
of the Bokeh source checkout, and execute the command::

    make all

To start a server and automatically open the built documentation in a browser,
execute the command::

    make serve

Docstrings
----------

We use `Sphinx Napoleon <http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html>`_
to process docstrings for our reference documentation. All docstrings are `Google Style Docstrings <http://sphinxcontrib-napoleon.readthedocs.org/en/latest/example_google.html#example-google>`_.

Docstrings should generally begin with a verb stating what the function or method does in
short statement. For example::

    "Create and return a new Foo."

is to be preferred over::

    "This function creates and returns a new Foo."

All docstrings for functions and methods should have an **Args:** section (if any
arguments are accepted) and also a **Returns:** section (even if the function just
returns None).

.. _developer_testing:

Testing
=======

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/ContinuumIO/bokeh.

To run the just the python unit tests, run the command::

    $ python -c "import bokeh; bokeh.test()"

To run just the BokehJS unit tests, execute::

    $ grunt test

in the `bokehjs` subdirectory.

Additionally, there are "examples tests" that check whether all the examples
produce outputs. This script is in the `examples` directory and can be run by
executing::

    $ test -D

You can run all available tests (python and JS unit tests and example tests)
from the top level directory by executing::

    $ BOKEH_DEFAULT_NO_DEV=True nosetests

Currently this script does not support Windows.

To help the test script choose the appropriate test runner, there are some
naming conventions that examples should adhere to. Non-IPython notebook
example scripts that rely on the Bokeh server should have 'server' or
'animate' in their filenames.

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
itself. Very few JS plotting libraries took large and streaming server-side
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

.. _bokehjs_examples:

Examples
--------

Several live examples that demonstrate the BokehJS interface are available as JSFiddles.
Click on "CoffeeScript" to see the code that generates these plots, or on "Edit in
JSFiddle" to fork and create your own examples.

Scatter
~~~~~~~

This example shows a scatter plot where every circle has its own radius and color.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/Tw5Sm/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Lorenz
~~~~~~

This example shows a 2D projection of the Lorenz attractor. Sections of the line are color-coded
by time.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/s2k59/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Animated
~~~~~~~~

This example shows how it it possible to animate BokehJS plots by updating the data source.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/K8P4P/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


.. _pythoninterface:

Python Interface
================

Low-level Object Interface
--------------------------

Here is a notional diagram showing the overall object system in Bokeh. We will discuss each
of these in turn.

.. image:: /_images/objects.png
    :align: center

