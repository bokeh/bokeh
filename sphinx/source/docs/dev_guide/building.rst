.. _devguide_building:

Building and Installing
=======================

.. contents::
    :local:
    :depth: 2


The Bokeh project encompasses two major components: the Bokeh package source
code, written in Python, and the BokehJS client-side library, written in
CoffeeScript. Accordingly, development of Bokeh is slightly complicated by the
fact that BokehJS requires an explicit compilation step to render the
CoffeeScript source into deployable JavaScript.

For this reason, in order to develop Bokeh from a source checkout, you must
first be able to build BokehJS.

.. _devguide_cloning:

Cloning the Repository
----------------------

The source code for the Bokeh project is hosted on GitHub_. To clone the
source repository, issue the following command::

    git clone https://github.com/bokeh/bokeh.git

This will create a ``bokeh`` directory at your location. This ``bokeh``
directory is referred to as the "source checkout" for the remainder of
this document.

.. _devguide_building_bokehjs:


Building BokehJS
----------------

The BokehJS build process is handled by Grunt_, which in turn depends on
`Node.js <NodeJS>`_. Grunt is used to compile CoffeeScript and Less (CSS)
sources (as well as Eco templates), and to combine these resources into
optimized and minified ``bokeh.js`` and ``bokeh.css`` files.

Install npm and node
~~~~~~~~~~~~~~~~~~~~

First, install Node.js and npm (node package manager).
You can download and install these directly, or use
`conda <http://conda.pydata.org/>`_ to install them
from the Bokeh channel on `Binstar <https://binstar.org>`_::

    $ conda install -c bokeh nodejs

Alternatively, on Ubuntu you can use ``apt-get``::

    $ apt-get install npm node


Install Grunt and necessary plugins
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Once you have npm and Node.js installed, you must use them to install
the required dependencies before you can build BokehJS.
Execute the following command in the ``bokehjs`` subdirectory::
    
    $ npm install

This command will install the necessary packages into the ``node_modules``
subdirectory (and list them as ``devDependencies`` in ``package.json``).

At this point you can typically use the ``setup.py`` script at the top level
of the source chekcout to manage building and installing BokehJS as part of
the complete Bokeh library (see :ref:`devguide_python_setup`).

However, if you are using BokehJS as a standalone JavaScript library, then
the instructions below describe the process to iteratively build BokehJS with
Grunt for development purposes.

Building BokehJS with Grunt
~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you want to be able to run the commands below, you can either use
``bokehjs/node_modules/.bin/grunt`` or globally install 
the grunt command line interface::

    $ npm install -g grunt-cli

There are three main Grunt commands for development (to be executed from the
``bokehjs`` subdirectory):

.. code-block:: sh

    $ grunt deploy

This will generate the compiled and optimized BokehJS libraries, and deploy
them to the ``build`` subdirectory.

.. code-block:: sh

    $ grunt build

This will build the BokehJS sources without concatenating and optimizing into
standalone libraries. At this point BokehJS can be be as an `AMD module`_.

.. code-block:: sh

    $ grunt watch

This directs Grunt to automatically watch the source tree for changes and
trigger a recompile of individual files as they change. This is especially
useful together with the ``--splitjs`` mode of the Bokeh server to afford a
more rapid development cycle.

Building BokehJS with SBT
~~~~~~~~~~~~~~~~~~~~~~~~~

.. warning::
        The ``sbt`` build system is experimental and not integrated with
        ``setup.py``, so it should be used with caution.

As an alternative to Grunt, you can use `SBT`_ to build BokehJS. To start,
run the command:

.. code-block:: sh

    $ ./sbt

in the top level directory. This will download ``sbt`` (and its dependencies)
itself, and configure the build system.

There are two main commands available: ``build`` and ``deploy``. The ``build``
command compiles CoffeeScript, Less and Eco sources, and copies other resources
to the build directory. The ``deploy`` command does the same and additionally
generates optimized and minified ``bokeh.js`` and ``bokeh.css`` outputs.

You may also run specific subtasks, e.g. ``compile`` to compile CoffeeScript,
Less and Eco sources, but not copy resources. You can also prefix any command
with ``~``, which enables incremental compilation. For example, issuing ``~less``
will watch ``*.less`` sources and compile only the subset of files that changed.
To stop watching sources, press ENTER. Pressing Ctrl+C will terminate ``sbt``.

.. _devguide_python_setup:

Python Setup
------------

Once you have a working BokehJS build (which you can verify by completing the
steps described in :ref:`devguide_building_bokehjs`), you can use the
``setup.py`` script at the top level of the source checkout to install or
develop the full Bokeh library from source.

The ``setup.py`` script has two main modes of operation: ``install`` and
``develop``.

When ``python setup.py install`` is used, Bokeh will be installed in your
local ``site-packages`` directory. In this mode, any changes to the python
source code will not show up until ``setup.py install`` is run again.

When ``python setup.py develop`` is used, a path file ``bokeh.pth`` will be
written to your ``site-packages`` directory that points to the ``bokeh``
subdirectory of your source checkout. Any changes to the python source code
will be available immediately without any additional steps.

With either mode, you will be prompted for how to install BokehJS, e.g.::

    $ python setup.py install

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS from bokeh/bokehjs/build

    Choice?

You may skip this prompt by supplying the appropriate command line option
to ``setup.py``:

* ``--build_js``
* ``--install_js``

If you have any problems with the steps here, please contact the developers
(see :ref:`contact`).

Dependencies
~~~~~~~~~~~~

If you are working within a Conda environment, you will need to make sure you
have the python requirements installed. You can install these via ``conda
install`` or ``pip install`` for the packages referenced at
:ref:`install_dependencies`.

Testing dependencies include the following additional libraries:

* beautiful-soup
* colorama
* pdiff
* boto
* nose
* mock
* coverage
* websocket-client

Windows Notes
~~~~~~~~~~~~~

If you build Bokeh on a Windows machine in a Conda environment with either
``setup.py install`` or ``setup.py develop``, running ``bokeh-server`` will
not work correctly. The .exe will not be available within the Conda
environment, which means you will use the version available in the base
install, if it is available. Instead, you can make sure you use the version
within the environment by explicitly running the bokeh-server python script
in the root of the bokeh repository, similar to the following example::

    python bokeh-server --script path\to\<yourapp>.py

Incremental Compilation
-----------------------

The processes described about result in building and using a full `bokeh.js`
library. This could be considered "production" mode. It is also possible to
run Bokeh code in a mode that utilizes ``require.js`` to serve up individual
JavaScript modules separately. If this is done, then changes to BokehJS can be incrementally compiled, and the development iteration cycle shortened
considerably.

For static examples, you can use the ``BOKEH_RESOURCES`` environement variable
to indicate that BokehJS should be loaded from individual sources::

    $ BOKEH_RESOURCES=relative-dev python example.py

For Bokeh server examples, simply add the ``--dev`` command line flag to the
server invocation::

    $ bokeh-server --dev

    $ python example-server.py

.. _AMD module: http://requirejs.org/docs/whyamd.html
.. _Binstar: https://binstar.org
.. _conda: http://conda.pydata.org/
.. _GitHub: https://github.com
.. _Grunt: http://gruntjs.com/
.. _NodeJS: http://nodejs.org/
.. _SBT: http://www.scala-sbt.org