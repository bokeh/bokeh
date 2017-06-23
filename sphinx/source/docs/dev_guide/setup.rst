.. _devguide_setup:

Getting Set Up
==============

The Bokeh project encompasses two major components: the Bokeh package source
code, written in Python, and the BokehJS client-side library, written in
CoffeeScript and TypeScript. Accordingly, development of Bokeh is slightly
complicated by the explicit compilation step required to generate deployable
JavaScript.

For this reason, in order to develop Bokeh from a source checkout, you must
first be able to build BokehJS. This chapter will walk you through getting a
full development environment set up.

.. contents::
    :local:
    :depth: 2

.. dev_guide_preliminaries:

Preliminaries
-------------

Git
~~~

The Bokeh source code is stored in a `Git`_ source control repository.
The first step to working on Bokeh is to install Git on to your system.
There are different ways to do this depending on whether, you are using
Windows, OSX, or Linux.

To install Git on any platform, refer to the `Installing Git`_ section of
the `Pro Git Book`_.

Conda
~~~~~

Developing Bokeh requires installing some software packages that are not
Python packages (e.g. Selenium, nodejs, etc.). To make this more manageable,
core developers rely heavily on the `conda package manager`_ for the free
`Anaconda`_ Python distribution. However, ``conda`` can also install
non-Python package dependencies, which helps streamline Bokeh development
greatly. It is *strongly* recommended that anyone developing Bokeh also use
``conda``, and the remainder of the instructions will assume that ``conda``
is available.

To install Conda on any platform, see the `Download conda`_ section of the
`conda documentation`_.

.. _devguide_cloning:

Cloning the Repository
----------------------

The source code for the Bokeh project is hosted on GitHub_. To clone the
source repository, issue the following command:

.. code-block:: sh

    git clone https://github.com/bokeh/bokeh.git

This will create a ``bokeh`` directory at your file system location. This
``bokeh`` directory is referred to as the *source checkout* for the remainder
of this document.

.. _dev_guide_installing_dependencies:

Installing Dependencies
-----------------------

Bokeh requires many additional packages for development and testing. Many
of these are on the main Anaconda default channel, but others are only
available from additional conda channels, or via the Node Package Manager.

.. _dev_guide_installing_dependencies_conda:

Conda Packages
~~~~~~~~~~~~~~

On all platforms, execute the following two commands at your command prompt
to add the "bokeh" and "conda-forge" channels to your list of package
sources:

.. code-block:: sh

    conda config --append channels bokeh
    conda config --append channels conda-forge

From the top level of the *source checkout* directory, execute the following
command at your command prompt to install all the required packages:

* OSX / Linux

    .. code-block:: sh

        conda install `python scripts/deps.py build run test`

    Note the required backticks in the command.


* Windows (Powershell)

    .. code-block:: sh

        conda install $(python scripts/deps.py build run test)

* Winows (DOS Command Prompt)

    .. code-block:: sh

        for /F "delims=" %i in ('python scripts/deps.py build run test') do (conda install %i)

.. _dev_guide_installing_dependencies_node:

Node Packages
~~~~~~~~~~~~~

Building BokehJS also requires installing  JavaScript dependencies using
the Node Package Manager. If you have followed the instructions above,
``conda`` has already installed the necessary ``npm`` and ``node.js``
packages to your system.

Starting from the top level of the *source checkout* directory, execute
the following commands

.. code-block:: sh

    cd bokehjs
    npm install

This command will install the necessary packages into the ``node_modules``
subdirectory.

----

Typically, these instructions only need to be followed once, when you are
first getting set up. Occasionally, however, dependencies may be added or
changed, in which case these instructions will need to be followed again.

.. _devguide_configuring_git:

Configuring Git
---------------

There are a few configurations you can make locally that will help make
working with the repository safer and easier.

.. note::
    The optional instructions in this section are specific to **OSX** and
    **Linux**.

.. _devguide_suggested_git_hooks:

Git Hooks
~~~~~~~~~

In order to help prevent some accidental errors, here are some git hooks
that may be useful. The scripts below should be placed in the ``.git/hooks``
subdirectory in the top level of the *source checkout* directory and be
marked executable with e.g. ``chmod +x pre-commit``. For more information
on git hooks, see `this turorial`_.

``pre-commit``

    This git hook runs the code quality tests before allowing a commit to
    proceed. Note that all the standard testing dependencies must be installed
    in order for this hook to function.

    .. code-block:: sh

        #!/bin/bash

        py.test -m quality
        exit $?

``pre-push``

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

.. _devguide_suggested_git_aliases:

Git Aliases
~~~~~~~~~~~

There are also some useful aliases that can be added to the ``.gitconfig`` file located in your home directory.

The following alias adds a ``git resolve`` command that will automatically open up your editor to resolve any merge conflicts.

.. code-block:: sh

    [alias]
        resolve = !sh -c 'vim -p $(git status -s | grep "^UU" | cut -c4-)'

You can replace ``vim`` with whatever your favorite editor command is.

.. _devguide_python_setup:

Building and Installing
-----------------------

Once you have all the required depencies installed, the simplest way to
build and install Bokeh and BokehJS is to use the ``setup.py`` script at
the top level of the *source checkout* directory.

The ``setup.py`` script has two main modes of operation:

``python setup.py install``

    Bokeh will be installed in your Python ``site-packages`` directory.
    In this mode, any changes to the python source code will not show up
    until ``setup.py install`` is run again.

``python setup.py develop``

    A ``bokeh.pth`` path file will be written to your Python ``site-packages``
    directory that points to the ``bokeh`` subdirectory of your *source
    checkout*. Any changes you make to the python source code will be available
    immediately without any additional steps.

With either mode, you will be prompted for how to install BokehJS, e.g.:

.. code-block:: sh

    python setup.py develop

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS from bokeh/bokehjs/build

    Choice?

You may skip this prompt by supplying the appropriate command line option
to ``setup.py``, e.g.

* ``python setup.py develop --build-js``
* ``python setup.py develop --install-js``

Note that you will need to build BokehJS any time that the BokehJS source
code changes (either by you or by pulling new revisions from GitHub). In
particular, at the very least, you must build BokehJS the first time you
install.

.. note::
    Occasionally the list of JavaScript dependencies also changes. If this
    occurs, you will also need to re-run the instructions in the
    :ref:`dev_guide_installing_dependencies_node` section above.


Getting Help
------------

If you have any problems with the steps here, please `contact the developers`_.

.. _Anaconda: https://www.continuum.io/downloads
.. _contact the developers: http://bokehplots.com/pages/contact.html
.. _conda package manager: https://conda.io/docs/intro.html
.. _conda documentation: https://conda.io/docs/index.html
.. _Download conda: https://conda.io/docs/download.html
.. _Git: https://git-scm.com
.. _GitHub: https://github.com
.. _Installing Git: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
.. _meta.yaml: http://github.com/bokeh/bokeh/blob/master/conda.recipe/meta.yaml
.. _Pro Git Book: https://git-scm.com/book/en/v2
.. _this turorial: https://www.digitalocean.com/community/tutorials/how-to-use-git-hooks-to-automate-development-and-deployment-tasks
