.. _contributor_guide_setup:

Setting up a development environment
====================================

The Bokeh project consists of two major components: the Bokeh package source
code, written in Python, and the :term:`BokehJS` client-side library, written in
TypeScript.

Therefore, you need to set up two environments to contribute to Bokeh: A Python
environment and a TypeScript environment. This chapter walks you through all the
necessary steps to set up a full development environment.

.. _contributor_guide_setup_preliminaries:

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

.. _contributor_guide_setup_cloning:

2. Fork and clone the repository
--------------------------------

The source code for the Bokeh project is hosted on GitHub_, at
https://github.com/bokeh/bokeh.

Unless you are a `@bokeh/dev team member`_, you first need to create a fork of
Bokeh's main repository. For more information on creating a fork, see
`Fork a repo`_ in `GitHub Help`_.

Next, clone the version of the Bokeh repository you want to work on to a local
folder on your hard drive. Use ``git clone`` or follow the instructions for
`cloning a forked repository`_ in `GitHub Help`_.

Cloning the repository creates a ``bokeh`` directory at your file system
location. This local ``bokeh`` directory is referred to as the *source checkout*
for the remainder of this document.

.. _contributor_guide_setup_creating_conda_env:

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
    can happen when the environment file is updated in the main Bokeh repository
    or when you switch branches to work on different issues, for example.

To learn more about creating and managing conda environments, see `Managing
environments`_ in the `Conda documentation`_.

.. _contributor_guide_setup_installing_node_packages:

4. Install Node packages
------------------------

Building BokehJS also requires installing JavaScript dependencies using
the `Node Package Manager (npm) <npm_>`_. If you have followed the
:ref:`instructions above <contributor_guide_setup_creating_conda_env>`,
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
to install all the JavaScript dependencies for BokehJS:

.. code-block:: sh

    npm ci

This command installs the necessary packages into the ``node_modules``
subdirectory.

.. note::
    Typically, you only need to do this once when you first set up your local
    environment. However, if dependencies are added or changed, you need to
    repeat these steps to install and update the respective packages.

.. _contributor_guide_setup_pre-commit:

5. Set up pre-commit
--------------------

Bokeh uses `pre-commit`_ to help you prevent some common mistakes in your
commits.

To set up pre-commit locally, run the following command from the top level of
your *source checkout* directory:

.. code-block:: sh

    python scripts/hooks/install.py

This configures pre-commit to use two `Git hooks`_ that will check your code
whenever you push a commit to Bokeh's GitHub repository:

Codebase tests
    git-commit will run Bokeh's
    :ref:`codebase tests <contributor_guide_testing_local_codebase>` to check
    for codebase quality issues such as whitespaces and imports. This includes
    testing with `Flake8`_, `ESLint`_, and `isort`_.

Protected branches
    git-commit will make sure you don't accidentally push a commit to `Bokeh's
    protected branches`_ ``main`` and ``branch-x.y`` on GitHub.

.. note::
    Depending on your system, running those tests may take several dozen
    seconds. If any of the tests fail, check the output of your console. In most
    cases, this is where you will find the necessary information about what you
    need to change to pass the tests.

To uninstall the Git hooks, run the following command from the top level of your
*source checkout* directory:

    .. code-block:: sh

        python scripts/hooks/uninstall.py

.. _contributor_guide_setup_install_locally:

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

You can skip this prompt by supplying the appropriate command-line option
to ``setup.py``. For example:

* ``python setup.py develop --build-js``
* ``python setup.py develop --install-js``

.. note::
    You need to **rebuild BokehJS each time the BokehJS source code changes**.
    This can become necessary because you made changes yourself or because you
    pulled updated code from GitHub.

    Occasionally, the **list of JavaScript dependencies also changes**. If this
    happens, you will need to re-run the instructions in the
    :ref:`contributor_guide_setup_installing_node_packages` section above before
    rebuilding BokehJS.

    In case you **update from a development environment based on Bokeh 2.3 or
    older**, you most likely also need to delete the ``bokehjs/build`` folder in
    your local environment before building and installing a fresh BokehJS.

.. _contributor_guide_setup_sample_data:

7. Download sample data
-----------------------

Several tests and examples require Bokeh's sample data to be available on your
hard drive. After :ref:`installing <contributor_guide_setup_install_locally>`
Bokeh, use the following command to download and install the data:

.. code-block:: sh

    bokeh sampledata

You also have the opportunity to configure the download location or to start the
download programmatically. See the :ref:`install_sampledata` section of the
first steps guides for more details.

.. _contributor_guide_setup_environment_variables:

8. Set environment variables
----------------------------

Bokeh uses :ref:`environment variables <userguide_settings>` to control several
aspects of how the different parts of the library operate and interact.

To learn about all environment variables available in Bokeh, see
:ref:`bokeh.settings` in the reference guide.

``BOKEH_RESOURCES``
~~~~~~~~~~~~~~~~~~~

When working on Bokeh's codebase, the most important environment variable to be
aware of is ``BOKEH_RESOURCES``. This variable controls which version of
:term:`BokehJS` to use.

By default, Bokeh downloads any necessary JavaScript code for BokehJS from a
Content Delivery Network (CDN). If you have modified any BokehJS code and built
BokehJS locally, you need to change how Bokeh loads those JavaScript resources.
You will not see any effects of your local changes to BokehJS unless you
configure Bokeh to use your local version of BokehJS instead of the default
version from the CDN.

You have the following three options to use your local version of BokehJS:

Use ``absolute-dev``
    Set ``BOKEH_RESOURCES`` to ``absolute-dev`` to load JavaScript resources
    from the static directory of your locally installed Bokeh library. This way,
    Bokeh will also use unminified BokehJS resources for improved readability.

    .. tabs::

        .. code-tab:: sh Linux/macOS

            export BOKEH_RESOURCES=absolute-dev

        .. code-tab:: PowerShell Windows (PS)

            $Env:BOKEH_RESOURCES = "absolute-dev"

        .. code-tab:: doscon Windows (CMD)

            set BOKEH_RESOURCES=absolute-dev

Use ``inline``
    Set ``BOKEH_RESOURCES`` to ``inline`` to include all necessary local
    JavaScript resources directly inside the generated HTML file.

    .. tabs::

        .. code-tab:: sh Linux/macOS

            export BOKEH_RESOURCES=inline

        .. code-tab:: PowerShell Windows (PS)

            $Env:BOKEH_RESOURCES = "inline"

        .. code-tab:: doscon Windows (CMD)

            set BOKEH_RESOURCES=inline

Use ``server-dev``
    Set ``BOKEH_RESOURCES`` to ``server-dev`` to load your local BokehJS through
    a Bokeh server.

    First, start a local server.

    .. tabs::

        .. code-tab:: sh Linux/macOS

            BOKEH_DEV=true bokeh static

        .. code-tab:: PowerShell Windows (PS)

            $Env:BOKEH_DEV = "true"
            bokeh static

        .. code-tab:: doscon Windows (CMD)

            set BOKEH_DEV=true
            bokeh static

    Next, open a new terminal window and set ``BOKEH_RESOURCES`` to
    ``server-dev``.

    .. tabs::

        .. code-tab:: sh Linux/macOS

            export BOKEH_RESOURCES=server-dev

        .. code-tab:: PowerShell Windows (PS)

            $Env:BOKEH_RESOURCES = "server-dev"

        .. code-tab:: doscon Windows (CMD)

            set BOKEH_RESOURCES=server-dev

    This way, you have access to more development functions, such as
    `source maps` to help debug the original TypeScript instead of the compiled
    JavaScript.

See :class:`~bokeh.resources.Resources` for more details.

``BOKEH_DEV``
~~~~~~~~~~~~~

There are several other environment variables that are helpful when working on
Bokeh's codebase. The most common settings for local development are combined in
the variable ``BOKEH_DEV``.

To enable development settings, set ``BOKEH_DEV`` to ``true``:

.. tabs::

    .. code-tab:: sh Linux/macOS

        export BOKEH_DEV=true

    .. code-tab:: PowerShell Windows (PS)

        $Env:BOKEH_DEV = "true"

    .. code-tab:: doscon Windows (CMD)

        set BOKEH_DEV=true

Setting ``BOKEH_DEV`` to ``true`` is equivalent to setting all of the following
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
    Setting ``BOKEH_DEV=true`` enables ``BOKEH_RESOURCES=absolute-dev``, which
    causes rendering problems when used with :term:`Bokeh server <Server>` or in
    :ref:`Jupyter notebooks <userguide_jupyter>`. To avoid those problems,
    use the following settings instead:

    * Set ``BOKEH_RESOURCES`` to ``server`` for server
    * Set ``BOKEH_RESOURCES`` to ``inline`` for notebooks

.. _contributor_guide_setup_test_setup:

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

    Python version      :  3.9.7 | packaged by conda-forge | (default, Sep 29 2021, 19:20:46)
    IPython version     :  7.20.0
    Tornado version     :  6.1
    Bokeh version       :  3.0.0dev1+20.g6c394d579
    BokehJS static path :  /opt/anaconda/envs/test/lib/python3.9/site-packages/bokeh/server/static
    node.js version     :  v16.12.0
    npm version         :  7.24.2
    Operating system    :  Linux-5.11.0-40-generic-x86_64-with-glibc2.31

Run examples
~~~~~~~~~~~~

Next, run some of the standalone examples included with Bokeh.

Make sure the :ref:`environment variable <contributor_guide_setup_environment_variables>`
``BOKEH_RESOURCES`` is set to ``absolute-dev`` or ``inline`` in order to use
your local version of BokehJS. In the *source checkout* directory, run the
following command(s):

.. tabs::

    .. code-tab:: sh Linux/macOS

        BOKEH_RESOURCES=inline python examples/plotting/file/marker_map.py

    .. code-tab:: PowerShell Windows (PS)

        $Env:BOKEH_RESOURCES = "inline"
        python.exe .\examples\plotting\file\marker_map.py

    .. code-tab:: doscon Windows (CMD)

        set BOKEH_RESOURCES=inline
        python examples\plotting\file\marker_map.py

This creates a file ``marker_map.html`` locally. When you open this file in a web
browser, it should display this visualization:

.. image:: /_images/bokeh_marker_map_html.png
    :class: image-border
    :scale: 50 %
    :align: center

Run Bokeh Server
~~~~~~~~~~~~~~~~

Another way to use Bokeh is as a :term:`server <Server>`. Set the
:ref:`environment variable <contributor_guide_setup_environment_variables>`
``BOKEH_DEV=false`` and run the ``bokeh serve`` command in the *source
checkout* directory:

.. tabs::

    .. code-tab:: sh Linux/macOS

        BOKEH_DEV=false python -m bokeh serve --show examples/app/sliders.py

    .. code-tab:: PowerShell Windows (PS)

        $Env:BOKEH_DEV = "False"
        python.exe -m bokeh serve --show .\examples\app\sliders.py

    .. code-tab:: doscon Windows (CMD)

        set BOKEH_DEV=false
        python -m bokeh serve --show examples\app\sliders.py

This should open up a browser with an interactive figure:

.. image:: /_images/bokeh_app_sliders.png
    :class: image-border
    :align: center

All the sliders allow interactive control of the sine wave, with each update
redrawing the line with the new parameters. The ``--show`` option opens a
web browser. The default URL for the Bokeh server is ``localhost:5006``.

Troubleshooting
---------------

Updating an existing development environment does not always work as
expected. Make sure your
:ref:`conda environment <contributor_guide_setup_creating_conda_env>`,
:ref:`Node packages <contributor_guide_setup_installing_node_packages>`, and
:ref:`local build <contributor_guide_setup_install_locally>` are up to date.

If you keep getting errors after updating an older environment, use
``conda remove --name bkdev --all``, delete your local ``bokeh`` folder,
and reinstall your development environment, following the steps in this guide
from :ref:`the beginning <contributor_guide_setup_preliminaries>`.

For more information on running and installing Bokeh, check the
:ref:`additional resources available to contributors <contributor_guide_resources>`.
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
.. _pre-commit: https://pre-commit.com/
.. _Git hooks: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
.. _Flake8: https://flake8.pycqa.org/
.. _ESLint: https://eslint.org/
.. _isort: https://pycqa.github.io/isort/
.. _Bokeh's protected branches: https://github.com/bokeh/bokeh/wiki/BEP-6:-Branching-Strategy
.. _merge conflicts: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts
.. _source maps: https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map
