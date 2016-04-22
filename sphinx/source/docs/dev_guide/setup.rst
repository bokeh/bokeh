.. _devguide_setup:

Getting Set Up
==============

The Bokeh project encompasses two major components: the Bokeh package source
code, written in Python, and the BokehJS client-side library, written in
CoffeeScript. Accordingly, development of Bokeh is slightly complicated by
the fact that BokehJS requires an explicit compilation step to render the
CoffeeScript source into deployable JavaScript.

For this reason, in order to develop Bokeh from a source checkout, you must
first be able to build BokehJS.

.. _devguide_cloning:

Cloning the Repository
----------------------

The source code for the Bokeh project is hosted on GitHub_. To clone the
source repository, issue the following command:

.. code-block:: sh

    git clone https://github.com/bokeh/bokeh.git

This will create a ``bokeh`` directory at your location. This ``bokeh``
directory is referred to as the "source checkout" for the remainder of
this document.

.. _devguide_building_bokehjs:


Building BokehJS
----------------

The BokehJS build process is handled by Gulp_, which in turn depends on
`Node.js <NodeJS>`_. Gulp is used to compile CoffeeScript and Less (CSS)
sources (as well as Eco templates), and to combine these resources into
optimized and minified ``bokeh.js`` and ``bokeh.css`` files.

Install npm and node
~~~~~~~~~~~~~~~~~~~~

First, install Node.js and npm (node package manager).
You can download and install these directly, or use
`conda <http://conda.pydata.org/>`_ to install them
from the Bokeh channel on `anaconda.org <https://anaconda.org>`_:

.. code-block:: sh

    conda install -c bokeh nodejs

Alternatively, on Ubuntu you can use ``apt-get``:

.. code-block:: sh

    apt-get install npm node


Install Gulp and necessary plugins
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Once you have npm and Node.js installed, you must use them to install
the required dependencies before you can build BokehJS.
Execute the following command in the ``bokehjs`` subdirectory:

.. code-block:: sh

    npm install

This command will install the necessary packages into the ``node_modules``
subdirectory (and list them as ``devDependencies`` in ``package.json``).

If ``bokehjs`` fails, please check if you are working inside the ``bokehjs`` directory.

At this point you can typically use the ``setup.py`` script at the top level
of the source checkout to manage building and installing BokehJS as part of
the complete Bokeh library (see :ref:`devguide_python_setup`).

However, if you want to work on the BokehJS sources or use BokehJS as a
standalone library, then you need to use Gulp to build the BokehJS library
as shown below.

Building BokehJS with Gulp
~~~~~~~~~~~~~~~~~~~~~~~~~~

Below are the main Gulp commands for development (to be executed from
the ``bokehjs`` subdirectory). To run these commands, you can either
use ``bokehjs/node_modules/.bin/gulp``, install Gulp globally via
`npm`:

.. code-block:: sh

    npm install -g gulp

or install gulp via conda (recommended):

.. code-block:: sh

    conda install -c javascript gulp

To generate the compiled and optimized BokehJS libraries with source maps,
and deploy them to the ``build`` subdirectory:

.. code-block:: sh

    gulp build

Additionally, ``gulp build`` accepts a ``--build-dir`` argument to specify
where the built resources should be produced:

.. code-block:: sh

    gulp build --build-dir=/home/bokeh/mybuilddir

For faster development turnaround, you can skip the very slow minification
step of the build by issuing:

.. code-block:: sh

    gulp dev-build

To direct Gulp to automatically watch the source tree for changes and
trigger a recompile if any source file changes:

.. code-block:: sh

    gulp watch

A Gulp build will automatically generate the sources and their associated source
maps. With "source mapping" enabled in your browser, you will be able to:

* debug the original .coffeescript files when using ``js/bokeh.js``
* debug the compiled non-minified javascript when using ``js/bokeh.min.js``
* debug the original .less files when using ``css/bokeh.css`` or ``css/bokeh.min.css``

in your developer console.

.. _devguide_python_setup:

Python Setup
------------

Once you have a working BokehJS build (which you can verify by completing
the steps described in :ref:`devguide_building_bokehjs`), you can use the
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

With either mode, you will be prompted for how to install BokehJS, e.g.:

.. code-block:: sh

    python setup.py install

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS from bokeh/bokehjs/build

    Choice?

You may skip this prompt by supplying the appropriate command line option
to ``setup.py``:

* ``--build_js``
* ``--install_js``

If you have any problems with the steps here, please `contact the developers`_.

Dependencies
~~~~~~~~~~~~

In order to build Bokeh from its source, you'll have to install the project's
python dependencies. If you're using Conda or pip + virtualenv to setup a
development environment, you'll be able to install these via ``conda install``
or ``pip install`` for the packages references at :ref:`install_dependencies`.

There are additional testing dependencies required to run the unit tests,
which include:

* beautiful-soup
* colorama
* pytest
* pytest-cov
* pytest-selenium >= 1.0
* mock
* websocket-client

Both the build and test dependencies can potentially change between releases
and be out of sync with the hosted Bokeh site documentation, so the best way
to view the current required packages is the review the meta.yaml_ file included
in the Github repository.

.. This comment is just here to fix a weird Sphinx formatting bug

----

To quickly and easily confirm that your environment contains all of the
necessary dependencies to build both the docs and the development version
of Bokeh, run the ``devdeps.py`` file inside the ``bokeh/scripts`` directory.

If any needed packages are missing, you will be given output like this

.. code-block:: sh

    ------------------------------------------------------------------
    You are missing the following Dev dependencies:
     *  beautiful-soup

    ------------------------------------------------------------------
    You are missing the following Docs dependencies:
     *  sphinx
     *  pygments

Otherwise, you should see this message

.. code-block:: sh

    ------------------------------------------------------------------
    All Dev dependencies installed!  You are good to go!

    ------------------------------------------------------------------
    All Docs dependencies installed!  You are good to go!


Additionally, ``devdeps.py`` will check that the ``bokehjs/node_modules``
directory exists, which is where npm packages are installed.

If this directory is not found, it will provide instructions on how and where to
install npm packages.


Windows Notes
~~~~~~~~~~~~~

If you build Bokeh on a Windows machine in a Conda environment with either
``setup.py install`` or ``setup.py develop``, running ``bokeh serve`` will
not work correctly. The .exe will not be available within the Conda
environment, which means you will use the version available in the base
install, if it is available. Instead, you can make sure you use the Python
version within the environment by making use of Python's ``-m`` flag,
as in the following example:

.. code-block:: sh

    python -m bokeh serve path\to\<yourapp>.py

Developing Examples
-------------------

The processes described so far, discussed solely building BokehJS' components.
When using them in the development repository, you must be cautious about which
components are picked by Bokeh, especially when working on examples. Failing
to do so, may result in you testing wrong version, specifically CDN version of
BokehJS.

In the case of statically generated HTML or IPython notebooks, you should set
``BOKEH_DEV=true`` in the shell, e.g.:

.. code-block:: sh

    BOKEH_DEV=true python example.py

This enables the development mode, which uses absolute paths to development
(non-minified) BokehJS components, sets logging to ``debug``, makes generated
HTML and JSON human-readable, etc. Alternatively you can enable each part of
the development mode with a specific shell variable. For example, to configure
Bokeh to use relative paths to development resources, issue:

.. code-block:: sh

    BOKEH_RESOURCES=relative-dev python example.py

For Bokeh server examples, add ``BOKEH_DEV=true`` to the server invocation:

.. code-block:: sh

    BOKEH_DEV=true bokeh serve example-server.py

Environment Variables
---------------------

There are several environment variables that can be useful for developers:

``BOKEH_BROWSER``
~~~~~~~~~~~~~~~~~
What browser to use when opening plots
Valid values are any of the browser names understood by the python
standard library webbrowser_ module.

``BOKEH_DEV``
~~~~~~~~~~~~~~
Whether to use development mode
This uses absolute paths to development (non-minified) BokehJS components,
sets logging to ``debug``, makes generated HTML and JSON human-readable,
etc.

This is a meta variable equivalent to the following environment variables:

- ``BOKEH_BROWSER=none``
- ``BOKEH_LOG_LEVEL=debug``
- ``BOKEH_MINIFIED=false``
- ``BOKEH_PRETTY=true``
- ``BOKEH_PY_LOG_LEVEL=debug``
- ``BOKEH_RESOURCES=absolute-dev``
- ``BOKEH_SIMPLE_IDS=true``

Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_DOCS_CDN``
~~~~~~~~~~~~~~~~~~~~
What version of BokehJS to use when building sphinx docs locally.

.. note::
    Set to ``"local"`` to use a locally built dev version of BokehJS.

    This variable is only used when building documentation from the
    development version.

``BOKEH_DOCS_VERSION``
~~~~~~~~~~~~~~~~~~~~~~
What version of Bokeh to show when building sphinx docs locally. Useful for re-deployment purposes.

.. note::
    Set to ``"local"`` to use a locally built dev version of BokehJS.

    This variable is only used when building documentation from the
    development version.

``BOKEH_DOCS_CSS_SERVER``
~~~~~~~~~~~~~~~~~~~~~~~~~
Where to get the css stylesheet from, by default this will be bokehplots.com

.. note::
    This variable is only used when building documentation from the
    development version.

``BOKEH_LOG_LEVEL``
~~~~~~~~~~~~~~~~~~~
The BokehJS console logging level to use Valid values are, in order of increasing severity:

  - ``trace``
  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``

The default logging level is ``info``.

.. note::
    When running server examples, it is the value of this
    ``BOKEH_LOG_LEVEL`` that is set for the server that matters.

``BOKEH_MINIFIED``
~~~~~~~~~~~~~~~~~~~
Whether to emit minified JavaScript for ``bokeh.js``
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_PRETTY``
~~~~~~~~~~~~~~~~~
Whether to emit "pretty printed" JSON
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_PY_LOG_LEVEL``
~~~~~~~~~~~~~~~~~~~~~~~
The Python logging level to set
As in the JS side, valid values are, in order of increasing severity:

  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``
  - ``none``

The default logging level is ``none``.

``BOKEH_RESOURCES``
~~~~~~~~~~~~~~~~~~~~
What kind of BokehJS resources to configure
For example:  ``inline``, ``cdn``, ``server``. See the
:class:`~bokeh.resources.Resources` class reference for full details.

``BOKEH_ROOTDIR``
~~~~~~~~~~~~~~~~~~
Root directory to use with ``relative`` resources
See the :class:`~bokeh.resources.Resources` class reference for full
details.

``BOKEH_SIMPLE_IDS``
~~~~~~~~~~~~~~~~~~~~~~~
Whether to generate human-friendly object IDs
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
Normally Bokeh generates UUIDs for object identifiers. Setting this variable
to an affirmative value will result in more friendly simple numeric IDs
counting up from 1000.

``BOKEH_VERSION``
~~~~~~~~~~~~~~~~~
What version of BokehJS to use with ``cdn`` resources
See the :class:`~bokeh.resources.Resources` class reference for full details.

.. _anaconda.org: https://anaconda.org
.. _conda: http://conda.pydata.org/
.. _contact the developers: http://bokehplots.com/pages/contact.html
.. _GitHub: https://github.com
.. _Gulp: http://gulpjs.com/
.. _meta.yaml: http://github.com/bokeh/bokeh/blob/master/conda.recipe/meta.yaml
.. _NodeJS: http://nodejs.org/
.. _webbrowser: https://docs.python.org/2/library/webbrowser.html
