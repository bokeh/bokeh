.. _devguide_setup:

Setting up a development environment
====================================

The Bokeh project consists of two major components: the Bokeh package source
code, written in Python, and the :term:`BokehJS` client-side library, written in
TypeScript.

Therefore, you need to set up two environments to contribute to Bokeh: A Python
environment and a TypeScript environment. This chapter walks you through all the
necessary steps to set up a full development environment:

:ref:`devguide_setup_preliminaries`

:ref:`devguide_setup_cloning`

:ref:`devguide_setup_creating_conda_env`

:ref:`devguide_setup_installing_node_packages`

:ref:`devguide_setup_configuring_git`

:ref:`devguide_setup_install_locally`

:ref:`devguide_setup_sample_data`

:ref:`devguide_setup_environment_variables`

:ref:`devguide_setup_test_setup`

.. _devguide_setup_preliminaries:

1. Check basic requirements
---------------------------

Install or update Git
~~~~~~~~~~~~~~~~~~~~~

The Bokeh source code is stored in a `Git`_ source control repository. The first
step to working on Bokeh is to install or update Git on your system.

There are different ways to do this, depending on whether you are using
Windows, OSX, or Linux. To install Git on any platform, refer to the
`Installing Git`_ section of the `Pro Git Book`_.

If you have never used Git before, you can find links to several beginner
tutorials and resources in the `Git documentation`_.

Install or update conda
~~~~~~~~~~~~~~~~~~~~~~~

Working on the Bokeh codebase requires installing several software packages that
are not Python packages. For example, `Node.js`_ for TypeScript development or
`Selenium`_ for testing and exporting.

To be able to manage Python and non-Python dependencies in one place, Bokeh uses
the `conda package manager`_. ``conda`` is part of the free `Anaconda`_ Python
distribution available for Windows, macOS, and Linux. Conda creates and manages
virtual environments for you. Therefore, you don't need tools like ``venv``,
``virtualenv``, or ``pipenv``. While it is technically possible to install all
dependencies manually without ``conda``, this guide will assume that you have
``conda`` installed.

To install or update Conda on your system, see `Installation`_ in the `Conda
documentation`_.

.. note::
    If ``conda`` is already installed on your system, make sure it is up to date
    by running the following command:

    .. code-block:: sh

        conda update -n base -c defaults conda

.. _devguide_setup_cloning:

2. Fork and clone the repository
--------------------------------

The source code for the Bokeh project is hosted on GitHub_, at
https://github.com/bokeh/bokeh.

Unless you are a `@bokeh/dev team member`_, you first need to create a fork of
Bokeh's main repository. For more information on creating a fork, refer to
`Fork a repo`_ in `GitHub Help`_.

Next, clone the version of the Bokeh repository you want to work on to a local
folder on your hard drive. Use ``git clone`` or follow the instructions for
`cloning a forked repository`_ in `GitHub Help`_.

Cloning the repository creates a ``bokeh`` directory at your file system
location. This local ``bokeh`` directory is referred to as the *source checkout*
for the remainder of this document.

.. _devguide_setup_creating_conda_env:

3. Create a conda environment
-----------------------------

The Bokeh repository you just cloned to your local hard drive contains an
:bokeh-tree:`environment.yml` file. In this file is all the necessary
information to automatically create a basic development environment. The name of
this virtual environment will be ``bkdev``.

Use ``conda env create`` at the root level of your *source checkout* directory
to set up the environment and install all necessary packages:

.. code-block:: sh

    conda env create -f environment.yml

Then, activate the environment:

.. code-block:: sh

    conda activate bkdev

.. note::
    To update your local environment, use
    ``conda env update -f environment.yml``. Updating your local environment
    is necessary whenever the dependencies in ``environment.yml`` change. This
    can happen when the file is updated in the main Bokeh repository or when you
    switch branches to work on different issues, for example.

To learn more about creating and managing conda environments, see `Managing
environments`_ in the `Conda documentation`_.

.. _devguide_setup_installing_node_packages:

4. Install Node packages
------------------------

Building BokehJS also requires installing JavaScript dependencies using
the `Node Package Manager (npm) <npm>`_. If you have followed the
:ref:`instructions above <devguide_setup_creating_conda_env>`,
``conda`` has already installed the necessary ``npm`` and ``node.js``
packages to your system.

Bokeh usually requires the latest major revision of ``npm``. To install the
newest version globally, start from the top level of the *source checkout*
directory, and run the following commands:

.. code-block:: sh

    cd bokehjs
    npm install -g npm@7

If you do not want to install npm globally, leave out the ``-g`` flag. In this
case, you need to adjust all subsequent ``npm`` commands to use the local
version installed under ``bokehjs/node_modules``.

Next, still in the ``bokehjs`` subdirectory, run the following command
to install all of BokehJS' JavaScript dependencies:

.. code-block:: sh

    npm ci

This command installs the necessary packages into the ``node_modules``
subdirectory.

.. note::
    Typically, you only need to do this once when you first set up your local
    environment. However, if dependencies are added or changed, you need to
    repeat these steps to install and update the respective packages.

.. _devguide_setup_configuring_git:

5. Configure Git
----------------

Use the following optional configurations for Git to make working with the
repository safer and easier.

.. note::
    The optional instructions in this section are specific to **OSX** and
    **Linux**.

.. _devguide_setup_suggested_git_hooks:

Git Hooks
~~~~~~~~~

The following `Git hooks`_ can help you prevent some common mistakes. To
use those scripts, save them to the ``.git/hooks`` directory in the top level of
your *source checkout* directory and mark them executable with ``chmod +x``.

pre-commit Git hook

    This Git hook runs all the codebase tests before allowing a commit to
    proceed. Note that all the standard testing dependencies must be installed
    in order for this hook to work.

    .. code-block:: sh

        #!/bin/bash

        pytest tests/codebase
        exit $?

pre-push Git hook

    This Git hook prevents accidental pushes to the ``main`` branch on GitHub.

    .. code-block:: sh

        #!/bin/bash

        protected_branch='main'
        current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

        if [ $protected_branch = $current_branch ]
        then
            read -p "You're about to push main, is that what you intended? [y|n] " -n 1 -r < /dev/tty
            echo
            if echo $REPLY | grep -E '^[Yy]$' > /dev/null
            then
                exit 0 # push will execute
            fi
            exit 1 # push will not execute
        else
            exit 0 # push will execute
        fi

.. _devguide_setup_suggested_git_aliases:

Git Aliases
~~~~~~~~~~~

There are also some useful `Git aliases`_ you can add to the ``.gitconfig``
file located in your home directory.

The following alias adds a ``git resolve`` command that will automatically
open up your editor to resolve any merge conflicts.

.. code-block:: sh

    [alias]
        resolve = !sh -c 'vim -p $(git status -s | grep "^UU" | cut -c4-)'

You can replace ``vim`` with whatever your favorite editor command is.

.. _devguide_setup_install_locally:

6. Build and install locally
----------------------------

Once you have all the required dependencies installed, the simplest way to
build and install Bokeh and BokehJS is to use the ``setup.py`` script. This
script is located at the top level of the *source checkout* directory.

The ``setup.py`` script has two main modes of operation:

``python setup.py develop``
    Bokeh will be installed to refer to the source directory. Any changes
    you make to the python source code will be available immediately without
    any additional steps. **This is the recommended mode when working on the
    Bokeh codebase.**

``python setup.py install``
    Bokeh will be installed in your Python ``site-packages`` directory.
    In this mode, any changes to the Python source code will have no effect
    until you run ``setup.py install`` again.

With either mode, Bokeh asks you how to install :term:`BokehJS`. For
example:

.. code-block:: sh

    python setup.py develop

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS from bokeh/bokehjs/build

    Choice?

Unless you know what you are doing, you should choose option 1 here. At the very
least, you need to build BokehJS the first time you set up your local
development environment.

You can skip this prompt by supplying the appropriate command line option
to ``setup.py``. For example:

* ``python setup.py develop --build-js``
* ``python setup.py develop --install-js``

.. note::
    You need to rebuild BokehJS each time the BokehJS source code changes. This
    can become necessary because you made changes yourself or because you pulled
    updated code from GitHub.

    Occasionally, the list of JavaScript dependencies also changes. If this
    happens, you will need to re-run the instructions in the
    :ref:`devguide_setup_installing_node_packages` section above before
    rebuilding BokehJS.

.. _devguide_setup_sample_data:

7. Download sample data
-----------------------

Several tests and examples require Bokeh's sample data to be available on your
hard drive. After :ref:`installing <devguide_setup_install_locally>` Bokeh, use
the following command to download and install the data:

.. code-block:: sh

    bokeh sampledata

You also have the opportunity to configure the download location or to start the
download programmatically. See the :ref:`install_sampledata` section of the
first steps guides for more details.

.. _devguide_setup_environment_variables:

8. Set environment variables
----------------------------

Bokeh uses environment variables to control several aspects of how the different
parts of the library operate and interact.

To learn about all environment variables available in Bokeh, see
:ref:`bokeh.settings` in the reference guide.

``BOKEH_RESOURCES``
~~~~~~~~~~~~~~~~~~~

When working on Bokeh's codebase, the most important environment variable to be
aware of is ``BOKEH_RESOURCES``. This variable controls which version of
:term:`BokehJS` to use.

By default, Bokeh downloads any necessary JavaScript code for BokehJS from a
Content Delivery Network (CDN). If you want Bokeh to use your local BokehJS
version instead, you should set ``BOKEH_RESOURCES=absolute-dev``.

``BOKEH_DEV``
~~~~~~~~~~~~~

There are several other environment variables that are helpful when working on
Bokeh's codebase. The most common settings for local development are combined in
the variable ``BOKEH_DEV``.

Setting ``BOKEH_DEV=true`` is equivalent to setting all of the following
variables individually:

- ``BOKEH_BROWSER=none``
- ``BOKEH_LOG_LEVEL=debug``
- ``BOKEH_MINIFIED=false``
- ``BOKEH_PRETTY=true``
- ``BOKEH_PY_LOG_LEVEL=debug``
- ``BOKEH_RESOURCES=absolute-dev``

This way, Bokeh will use local and unminified BokehJS resources, the default log
levels are increased, the generated HTML and JSON code will be more
human-readable, and Bokeh will not open a new browser window each time |show| is
called.

.. note::
    Setting ``BOKEH_DEV=true`` and therefore enabling
    ``BOKEH_RESOURCES=absolute-dev`` causes rendering problems when used
    with :term:`Bokeh server <Server>` or in
    :ref:`Jupyter notebooks <userguide_jupyter>`. To avoid those problems,
    use the following settings instead:

    * Set ``BOKEH_RESOURCES`` to ``server`` for server
    * Set ``BOKEH_RESOURCES`` to ``inline`` for notebooks

.. _devguide_setup_test_setup:

9. Test your local setup
------------------------

Run the following tests to check that everything is installed and set up
correctly:


Test Bokeh core
~~~~~~~~~~~~~~~

First, use the following command to test the Bokeh installation:

.. code-block:: sh

    python -m bokeh info

You should see output similar to:

.. code-block:: sh

    Python version      :  3.9.6 | packaged by conda-forge | (default, Jul 11 2021, 03:39:48)
    IPython version     :  7.25.0
    Tornado version     :  6.1
    Bokeh version       :  2.4.0dev1-42-g9c3ee2f7e-dirty
    BokehJS static path :  /home/user/bokeh/bokeh/server/static
    node.js version     :  v15.14.0
    npm version         :  7.19.1

Run examples
~~~~~~~~~~~~

Next, run some of the standalone examples included with Bokeh.

Make sure the :ref:`environment variable <devguide_setup_environment_variables>`
``BOKEH_RESOURCES`` is set to ``absolute-dev`` in order to use your local
version of BokehJS. In the *source checkout* directory, run the following
command:

.. code-block:: sh

    BOKEH_RESOURCES=absolute-dev python examples/plotting/file/iris.py

This creates a file ``iris.html`` locally. If you open this file in a web
browser, it should display this visualization:

.. image:: /_images/bokeh_iris_html.png
    :scale: 50 %
    :align: center

Run Bokeh Server
~~~~~~~~~~~~~~~~

Another way to use Bokeh is as a :term:`server <Server>`. Set the
:ref:`environment variable <devguide_setup_environment_variables>`
``BOKEH_DEV=false`` and run the ``bokeh serve`` command in the *source
checkout* directory:

.. code-block:: sh

    BOKEH_DEV=false python -m bokeh serve --show examples/app/sliders.py

This should open up a browser with an interactive figure:

.. image:: /_images/bokeh_app_sliders.png
    :scale: 50 %
    :align: center

All the sliders allow interactive control of the sine wave, with each update
redrawing the line with the new parameters. The ``--show`` option opens a
web browser, the default URL for the Bokeh server is ``localhost:5006``.

.. note ::
    If you have any problems with the steps here, check the
    :ref:`additional ressources available to contributors <contributors_guide_resources>`.
    Please feel free to ask at the `Bokeh Discourse`_ or `Bokeh's contributor
    Slack`_.

.. _Node.js: https://nodejs.org/en/
.. _Selenium: https://www.selenium.dev/
.. _Anaconda: https://www.anaconda.com/distribution/
.. _Bokeh's contributor Slack: https://slack-invite.bokeh.org/
.. _conda package manager: https://docs.conda.io/projects/conda/en/latest/
.. _Installation: https://conda.io/projects/conda/en/latest/user-guide/install/index.html
.. _Bokeh Discourse: https://discourse.bokeh.org/
.. _Git: https://git-scm.com
.. _Installing Git: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
.. _Pro Git Book: https://git-scm.com/book/en/v2
.. _Git documentation: https://git-scm.com/doc/ext
.. _@bokeh/dev team member: https://github.com/bokeh/bokeh/wiki/BEP-4:-Project-Roles#development-team
.. _GitHub: https://github.com
.. _Fork a repo: https://help.github.com/en/github/getting-started-with-github/fork-a-repo
.. _GitHub Help: https://help.github.com
.. _cloning a forked repository: https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository
.. _Managing environments: https://conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html
.. _Conda documentation: https://conda.io/projects/conda/en/latest/index.html
.. _npm: https://www.npmjs.com/
.. _Git hooks: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
.. _Git aliases: https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases
