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

.. _devguide_suggested_git_hooks:

Git Hooks
---------

In order to help prevent some accidental situations, here are two git hooks
that may be useful. The scripts below should be places in the ``.git/hooks``
directory, and be marked executable with e.g. ``chmod +x pre-commit``. For
more information on git hooks, see `this reference`_.


``pre-commit``
~~~~~~~~~~~~~~

This git hook runs the code quality tests before allowing a commit to
proceed. Note that all the standard testing dependencies musts be installed
in order for this hook to function.

.. code-block:: sh

    #!/bin/bash

    py.test -m quality
    exit $?

``pre-push``
~~~~~~~~~~~~

This git hook prevents accidental pushes to ``master`` on GitHub.

.. code-block:: sh

    #!/bin/bash

    protected_branch='master'
    current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

    if [ $protected_branch = $current_branch ]
    then
        read -p "You're about to push master, is that what you intended? [y|n] " -n 1 -r < /dev/tty
        echo
        if echo $REPLY | grep -E '^[Yy]$' > /dev/null
        then
            exit 0 # push will execute
        fi
        exit 1 # push will not execute
    else
        exit 0 # push will execute
    fi

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
Execute the following commands:

.. code-block:: sh

    cd bokehjs
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

.. _contact the developers: http://bokehplots.com/pages/contact.html
.. _GitHub: https://github.com
.. _Gulp: http://gulpjs.com/
.. _meta.yaml: http://github.com/bokeh/bokeh/blob/master/conda.recipe/meta.yaml
.. _this reference: https://www.digitalocean.com/community/tutorials/how-to-use-git-hooks-to-automate-development-and-deployment-tasks
