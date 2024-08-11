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
Bokeh's main repository. While forking, make sure to uncheck the checkbox that
limits copying to a specific branch (for example "Copy the branch-3.2 branch
only"). For more information on creating a fork, see `Fork a repo`_ in
`GitHub Help`_.

Next, clone the version of the Bokeh repository you want to work on to a local
folder on your hard drive. Use ``git clone`` or follow the instructions for
`cloning a forked repository`_ in `GitHub Help`_.

Cloning the repository creates a ``bokeh`` directory at your file system
location. This local ``bokeh`` directory is referred to as the *source checkout*
for the remainder of this document.

Before continuing, it is necessary to add the Bokeh repository as an additional
upstream with the following commands:

.. tab-set::

    .. tab-item:: SSH

        .. code-block:: sh

            git remote add upstream git@github.com:bokeh/bokeh.git
            git fetch upstream

    .. tab-item:: HTTPS

        .. code-block:: sh

            git remote add upstream https://github.com/bokeh/bokeh.git
            git fetch upstream

.. _contributor_guide_setup_creating_conda_env:

3. Create a conda environment
-----------------------------

The Bokeh repository you just cloned to your local hard drive contains
:ref:`test environment files <contributor_guide_testing_ci_environments>`
in the :bokeh-tree:`conda` folder. In these files is all the necessary
information to automatically create a basic development environment.

Use ``conda env create`` at the root level of your *source checkout* directory
to set up the environment and install all necessary packages. The "test"
environment files are versioned by Python version.

For example, to install an environment for Python 3.10, invoke:

.. code-block:: sh

    conda env create -n bkdev -f conda/environment-test-3.10.yml

.. note::
    Use the ``conda -n bkdev`` option to make ``bkdev`` the name of your
    environment. The remainder of this chapter and all other chapters in this
    guide assume that this is the name of your environment.

Then, activate the environment:

.. code-block:: sh

    conda activate bkdev

.. note::
    To update your local environment, use
    ``conda env update --name bkdev -f conda/<environment file>``. Updating your local
    environment is necessary whenever the dependencies in the test environments
    change. This can happen when the environment files are updated in the main
    Bokeh repository or when you switch branches to work on different issues,
    for example.

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
    npm install --location=global npm

If you do not want to install npm globally, leave out the ``--location=global``
flag. In this case, you need to adjust all subsequent ``npm`` commands to use
the local version installed under ``bokehjs/node_modules``.

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
    testing with `Ruff`_, `ESLint`_, and `isort`_.

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
build and install Bokeh and BokehJS is to use `pip`_. ``pip`` is the package
installer for Python and is automatically installed when you
:ref:`set up the conda environment <contributor_guide_setup_creating_conda_env>`.
Make sure you have activated the ``bkdev`` environment before running ``pip``.

There are two ways to install a local development version of Bokeh with ``pip``:

``pip install -e .``
    Bokeh will be installed to refer to your local source directory. Any changes
    you make to the Python source code will be available immediately without
    any additional steps. **This is the recommended mode when working on the
    Bokeh codebase.**

``pip install .``
    Bokeh will be installed in your local Python ``site-packages`` directory.
    In this mode, any changes to the Python source code will have no effect
    until you run ``pip install .`` again.

Running either of those two commands also builds and installs a local version of
:term:`BokehJS`. If you want to skip building a new version of BokehJS and use a
different local version instead, set the ``BOKEHJS_ACTION`` environment variable:
``BOKEHJS_ACTION="install" pip install -e .``

.. note::
    You need to **rebuild BokehJS each time the BokehJS source code changes**.
    This can be necessary because you made changes yourself or because you
    pulled updated code from GitHub. Re-run ``pip install -e .`` to build
    and install BokehJS.

    Occasionally, the **list of JavaScript dependencies also changes**. If this
    happens, you will need to re-run the instructions in the
    :ref:`contributor_guide_setup_installing_node_packages` section above before
    rebuilding BokehJS.

.. _contributor_guide_setup_environment_variables:

7. Set environment variables
----------------------------

Bokeh uses :ref:`environment variables <ug_settings>` to control several
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

Note that ``BOKEH_RESOURCES`` should only be set when running examples.
When you run tests or build the docs, you should not set this variable
(or unset it if it is already set) or you might get an error.

You have the following three options to use your local version of BokehJS:

Use ``absolute-dev``
    Set ``BOKEH_RESOURCES`` to ``absolute-dev`` to load JavaScript resources
    from the static directory of your locally installed Bokeh library. This way,
    Bokeh will also use unminified BokehJS resources for improved readability.

    .. tab-set::

        .. tab-item:: Linux/macOS
            :sync: sh

            .. code-block:: sh

                export BOKEH_RESOURCES=absolute-dev

        .. tab-item:: Windows (PS)
            :sync: ps

            .. code-block:: powershell

                $Env:BOKEH_RESOURCES = "absolute-dev"

        .. tab-item:: Windows (CMD)
            :sync: cmd

            .. code-block:: doscon

                set BOKEH_RESOURCES=absolute-dev

Use ``inline``
    Set ``BOKEH_RESOURCES`` to ``inline`` to include all necessary local
    JavaScript resources directly inside the generated HTML file.

    .. tab-set::

        .. tab-item:: Linux/macOS
            :sync: sh

            .. code-block:: sh

                export BOKEH_RESOURCES=inline

        .. tab-item:: Windows (PS)
            :sync: ps

            .. code-block:: powershell

                $Env:BOKEH_RESOURCES = "inline"

        .. tab-item:: Windows (CMD)
            :sync: cmd

            .. code-block:: doscon

                set BOKEH_RESOURCES=inline

Use ``server-dev``
    Set ``BOKEH_RESOURCES`` to ``server-dev`` to load your local BokehJS through
    a Bokeh server.

    First, start a local server.

    .. tab-set::

        .. tab-item:: Linux/macOS
            :sync: sh

            .. code-block:: sh

                BOKEH_DEV=true bokeh static

        .. tab-item:: Windows (PS)
            :sync: ps

            .. code-block:: powershell

                $Env:BOKEH_DEV = "true"
                bokeh.exe static

        .. tab-item:: Windows (CMD)
            :sync: cmd

            .. code-block:: doscon

                set BOKEH_DEV=true
                bokeh static

    Next, open a new terminal window and set ``BOKEH_RESOURCES`` to
    ``server-dev``.

    .. tab-set::

        .. tab-item:: Linux/macOS
            :sync: sh

            .. code-block:: sh

               export BOKEH_RESOURCES=server-dev

        .. tab-item:: Windows (PS)
            :sync: ps

            .. code-block:: powershell

                $Env:BOKEH_RESOURCES = "server-dev"

        .. tab-item:: Windows (CMD)
            :sync: cmd

            .. code-block:: doscon

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

.. tab-set::

    .. tab-item:: Linux/macOS
        :sync: sh

        .. code-block:: sh

            export BOKEH_DEV=true

    .. tab-item:: Windows (PS)
        :sync: ps

        .. code-block:: powershell

            $Env:BOKEH_DEV = "true"

    .. tab-item:: Windows (CMD)
        :sync: cmd

        .. code-block:: doscon

            set BOKEH_DEV=true

Setting ``BOKEH_DEV`` to ``true`` implies the following setup:

- ``BOKEH_BROWSER=none``
- ``BOKEH_LOG_LEVEL=debug``
- ``BOKEH_MINIFIED=false``
- ``BOKEH_PRETTY=true``
- ``BOKEH_PY_LOG_LEVEL=debug``
- ``BOKEH_RESOURCES=server``

but is not strictly equivalent to setting those variables individually.

This way, Bokeh will use local and unminified BokehJS resources, the default
log levels are increased, the generated HTML and JSON code will be more
human-readable, and Bokeh will not open a new browser window each time |show|
is called.

.. note::
    Setting ``BOKEH_DEV=true`` enables ``BOKEH_RESOURCES=server``, which
    requires a resources server. If needed, the user can provide such server
    by running ``BOKEH_DEV=true bokeh static`` (on Linux) command separately
    (e.g. in a another terminal or console).

    Although using server resources for development is the most robust
    approach, users can slightly simplify their setup by setting
    ``BOKEH_RESOURCES`` to ``inline`` instead.

.. _contributor_guide_setup_test_setup:

8. Test your local setup
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

    Python version        :  3.12.3 | packaged by conda-forge | (main, Apr 15 2024, 18:38:13) [GCC 12.3.0]
    IPython version       :  8.19.0
    Tornado version       :  6.3.3
    NumPy version         :  2.0.0
    Bokeh version         :  3.5.1
    BokehJS static path   :  /opt/anaconda/envs/test/lib/python3.12/site-packages/bokeh/server/static
    node.js version       :  v20.12.2
    npm version           :  10.8.2
    jupyter_bokeh version :  (not installed)
    Operating system      :  Linux-5.15.0-86-generic-x86_64-with-glibc2.35

Run examples
~~~~~~~~~~~~

Next, run some of the standalone examples included with Bokeh.

Make sure the :ref:`environment variable <contributor_guide_setup_environment_variables>`
``BOKEH_RESOURCES`` is set to ``absolute-dev`` or ``inline`` in order to use
your local version of BokehJS. In the *source checkout* directory, run the
following command(s):

.. tab-set::

    .. tab-item:: Linux/macOS
        :sync: sh

        .. code-block:: sh

            BOKEH_RESOURCES=inline python examples/basic/data/transform_markers.py

    .. tab-item:: Windows (PS)
        :sync: ps

        .. code-block:: powershell

            $Env:BOKEH_RESOURCES = "inline"
            python.exe .\examples\basic\data\transform_markers.py

    .. tab-item:: Windows (CMD)
        :sync: cmd

        .. code-block:: doscon

            set BOKEH_RESOURCES=inline
            python examples\basic\data\transform_markers.py

This creates a file ``transform_markers.html`` locally. When you open this file in
a web browser, it should display this visualization:

.. image:: /_images/bokeh_transform_markers_html.png
    :class: image-border
    :scale: 50 %
    :align: center

Run Bokeh Server
~~~~~~~~~~~~~~~~

Another way to use Bokeh is as a :term:`server <Server>`. Set the
:ref:`environment variable <contributor_guide_setup_environment_variables>`
``BOKEH_DEV=false`` and run the ``bokeh serve`` command in the *source
checkout* directory:

.. tab-set::

    .. tab-item:: Linux/macOS
        :sync: sh

        .. code-block:: sh

            BOKEH_DEV=false python -m bokeh serve --show examples/server/app/sliders.py

    .. tab-item:: Windows (PS)
        :sync: ps

        .. code-block:: powershell

            $Env:BOKEH_DEV = "False"
            python.exe -m bokeh serve --show .\examples\server\app\sliders.py

    .. tab-item:: Windows (CMD)
        :sync: cmd

        .. code-block:: doscon

            set BOKEH_DEV=false
            python -m bokeh serve --show examples\server\app\sliders.py

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
expected. As a general rule, make sure your
:ref:`conda environment <contributor_guide_setup_creating_conda_env>`,
:ref:`Node packages <contributor_guide_setup_installing_node_packages>`, and
:ref:`local build <contributor_guide_setup_install_locally>` are always up to date.

The following list contains solutions to common issue that you might encounter when
setting up a development environment:

.. dropdown:: Git tags missing (``KeyError: '0.0.1'``)

    Sometimes you may run into issues if the tags of the Bokeh repository have not
    been cloned to your local directory. You might see a ``KeyError: '0.0.1'`` on your
    console output, for example.

    To check if the necessary tags are present, run the following command:

    .. tab-set::

        .. tab-item:: Linux/macOS
            :sync: sh

            .. code-block:: sh

                git tag -l | tail

        .. tab-item:: Windows (PS)
            :sync: ps

            .. code-block:: powershell

                git tag -l

        .. tab-item:: Windows (CMD)
            :sync: cmd

            .. code-block:: doscon

                git tag -l

    If there are no tags present, make sure that you follow the steps of
    :ref:`setting the Bokeh repository as an additional upstream <contributor_guide_setup_cloning>`.

.. dropdown:: Git commit fails due to line endings (``test_code_quality.py``, ``File contains carriage returns``)

    On Windows systems, you may get a ``File contains carriage returns at end of line:
    <file path>`` error while trying to push your local branch to your remote branch on
    GitHub. This is because Bokeh only allows LF line endings, while some Windows-based
    tools may add CR LF line endings.

    If you see this error, try running the following command:
    ``git config --global core.autocrlf false``. After running this command, delete and
    re-clone your forked repository (see :ref:`contributor_guide_setup_cloning`)

    This command configures git to always preserves the original LF-only newlines.
    See the `GitHub documentation`_ or `Git config documentation`_ for other options.


.. dropdown:: Errors after updating from an older version

    If you keep getting errors after updating an older environment, use
    ``conda remove --name bkdev --all``, delete your local ``bokeh`` folder,
    and reinstall your development environment, following the steps in this guide
    from :ref:`the beginning <contributor_guide_setup_preliminaries>`.

.. dropdown:: Slow network connections when cloning

    If you are experiencing slow network connections or timeouts when attempting to clone our repository,
    consider performing a **shallow clone**. This method downloads fewer commits,
    which speeds up the cloning process and reduces the amount of data transferred.

    Using a shallow clone can be an effective workaround for contributors
    with limited bandwidth or those experiencing slow cloning speeds. However, be aware of its limitations
    and know how to convert it back to a full clone if necessary.

    To create a shallow clone of the repository, run:

    .. tab-set::

        .. tab-item:: SSH

            .. code-block:: sh

                git clone --depth <number-of-commits> git@github.com:bokeh/bokeh.git

        .. tab-item:: HTTPS

            .. code-block:: sh

                git clone --depth <number-of-commits> https://github.com/bokeh/bokeh.git

    Replace ``<number-of-commits>`` with the number of commits you wish to clone.

    For example, to clone only the latest commit:

    .. tab-set::

        .. tab-item:: SSH

            .. code-block:: sh

                git clone --depth 1 git@github.com:bokeh/bokeh.git

        .. tab-item:: HTTPS

            .. code-block:: sh

                git clone --depth 1 https://github.com/bokeh/bokeh.git

    If you are only interested in the history of a specific branch,
    you can combine the --single-branch option with --depth to further limit the clone to a single branch. Run:

    .. tab-set::

        .. tab-item:: SSH

            .. code-block:: sh

                git clone --depth 1 --branch <branch-name> --single-branch git@github.com:bokeh/bokeh.git

        .. tab-item:: HTTPS

            .. code-block:: sh

                git clone --depth 1 --branch <branch-name> --single-branch https://github.com/bokeh/bokeh.git


    **Limitations of a Shallow Clone**

    While a shallow clone can be very useful, it comes with certain limitations:

        - **Limited Git Operations:** Operations that require a full history (e.g., some merging strategies, generating comprehensive logs) will not be possible.
        - **Branch Limitations:** If you have not cloned all branches (`--single-branch` option), switching between branches might not be possible without additional steps.
        - **Inaccurate Version Information:** The version information retrieved through bokeh.__version__ might display incorrect data, such as a 'dev' label, when the repository is shallowly cloned.

    **Converting a Shallow Clone to a Full Clone**

    If you find that you need access to the full history of the repository for more complex tasks,
    you can convert your shallow clone to a full clone by fetching the remaining history:

    To deepen the clone by a specific number of commits:

    .. code-block:: sh

        git fetch --deepen=<additional-commits>

    To fully convert your shallow clone into a full clone (fetch all history):

    .. code-block:: sh

        git fetch --unshallow

    This command will download the rest of the repository's history, converting your shallow clone into a regular, full clone.

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
.. _Ruff: https://github.com/astral-sh/ruff
.. _ESLint: https://eslint.org/
.. _isort: https://pycqa.github.io/isort/
.. _Bokeh's protected branches: https://github.com/bokeh/bokeh/wiki/BEP-6:-Branching-Strategy
.. _pip: https://pip.pypa.io/
.. _merge conflicts: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts
.. _source maps: https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map
.. _GitHub documentation: https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings
.. _Git config documentation: https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreautocrlf
