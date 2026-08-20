.. _contributor_guide_setup:

Setting up a development environment
====================================

The Bokeh project consists of two major components: the Bokeh package source
code, written in Python, and the :term:`BokehJS` client-side library, written in
TypeScript.

The repository's Pixi workspace manages the Python and TypeScript toolchains
together. This chapter walks you through the steps to set up that development
environment.

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

Install or update Pixi
~~~~~~~~~~~~~~~~~~~~~~

Working on the Bokeh codebase requires installing several software packages that
are not Python packages. For example, `Node.js`_ for TypeScript development or
`Selenium`_ for testing and exporting.

To manage Python and non-Python dependencies in one place, Bokeh uses `Pixi`_.
Pixi is a single executable available for Windows, macOS, and Linux. It creates
and manages isolated environments, so you don't need to install Python,
Node.js, Conda, or tools such as ``venv`` separately.

Install Pixi by following the `Pixi installation`_ instructions.

.. note::
    Bokeh requires the Pixi version range declared in ``pixi.toml``. Pixi
    checks this requirement before installing an environment. To check your
    installed version, run:

    .. code-block:: sh

        pixi --version

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
.. _contributor_guide_setup_creating_pixi_env:

3. Install the Pixi environment
-------------------------------

The Bokeh repository contains its development environment definitions in
``pixi.toml`` and exact dependency versions in ``pixi.lock``. From the
root of your *source checkout*, install the default environment with:

.. code-block:: sh

    pixi install --locked

There is no activation step. Prefix commands with ``pixi run`` to execute them
in the environment. If you prefer an activated shell, run ``pixi shell``.

.. note::
    Run ``pixi install --locked`` again after pulling dependency changes or
    switching branches. Pixi updates the local environment to match the
    committed lockfile.

Bokeh also defines environments for its supported Python versions and focused
test configurations. For example, use ``pixi run -e test-py312 <command>`` to
run a command with Python 3.12. See
:ref:`contributor_guide_testing_ci_environments` for more information.

.. _contributor_guide_setup_installing_node_packages:

4. Install Node packages
------------------------

Building BokehJS also requires JavaScript dependencies from the
`Node Package Manager (npm) <npm_>`_. The Pixi environment supplies the
required versions of Node.js and npm. From the root of the *source checkout*,
install the JavaScript dependencies with:

.. code-block:: sh

    pixi run js-install

This command installs the necessary packages into the ``node_modules``
subdirectory.

.. note::
    ``pixi run setup`` also installs the JavaScript dependencies. Run either
    command again whenever ``bokehjs/package-lock.json`` changes.

.. _contributor_guide_setup_pre-commit:

5. Set up pre-commit
--------------------

Bokeh uses `pre-commit`_ to help you prevent some common mistakes in your
commits.

To set up pre-commit locally, run the following command from the top level of
your *source checkout* directory:

.. code-block:: sh

    pixi run python tools/hooks/install.py

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

    pixi run python tools/hooks/uninstall.py

.. _contributor_guide_setup_install_locally:

6. Build and install locally
----------------------------

Once Pixi has installed the environment, set up an editable Bokeh checkout with:

.. code-block:: sh

    pixi run setup

This installs the locked JavaScript dependencies, builds BokehJS, and uses
`pip`_ to install the local Python package in editable mode. The command passes
``--no-deps`` to pip because third-party dependencies are managed by Pixi and
``pixi.lock``.

There are two ways to install a local development version of Bokeh with ``pip``:

``pixi run python -m pip install --no-deps -e .``
    Bokeh will be installed to refer to your local source directory. Any changes
    you make to the Python source code will be available immediately without
    any additional steps. **This is the recommended mode when working on the
    Bokeh codebase.**

``pixi run python -m pip install --no-deps .``
    Bokeh will be installed in your local Python ``site-packages`` directory.
    In this mode, any changes to the Python source code will have no effect
    until you run the installation command again.

Running either of those two commands also builds and installs a local version of
:term:`BokehJS`. If you want to skip building a new version of BokehJS and use a
different local version instead, set the ``BOKEHJS_ACTION`` environment variable:
``BOKEHJS_ACTION="install" pixi run python -m pip install --no-deps -e .``

.. note::
    You need to **rebuild BokehJS each time the BokehJS source code changes**.
    This can be necessary because you made changes yourself or because you
    pulled updated code from GitHub. Re-run ``pixi run setup`` to build and
    install BokehJS.

    Occasionally, the **list of JavaScript dependencies also changes**. If this
    happens, you will need to re-run the instructions in the
    :ref:`contributor_guide_setup_installing_node_packages` section above before
    rebuilding BokehJS. ``pixi run setup`` performs both steps.

.. _contributor_guide_setup_environment_variables:

7. Set environment variables
----------------------------

Bokeh uses :ref:`environment variables <ug_settings>` to control several
aspects of how the different parts of the library operate and interact.

To learn about all environment variables available in Bokeh, see
:ref:`bokeh.settings` in the reference guide.

Only set the environment variables in this section for the command or terminal
session that needs them. In particular, avoid making them permanent settings in
your shell profile or Pixi manifest, because different development tasks need
different resource configuration:

* To run examples or local applications with your locally built BokehJS, set
  ``BOKEH_RESOURCES`` for that command or terminal session.
* To run tests, leave ``BOKEH_RESOURCES`` and ``BOKEH_DEV`` unset. Bokeh's test
  suite selects the resources it needs, and some tests fail during collection if
  ``BOKEH_RESOURCES`` is set.
* To build the documentation, follow the
  :ref:`documentation build instructions <contributor_guide_documentation_build>`.
  Documentation builds use ``GOOGLE_API_KEY`` and, when needed,
  ``BOKEH_DOCS_CDN`` instead of ``BOKEH_RESOURCES``.

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

Note that ``BOKEH_RESOURCES`` should only be set when running examples or
local applications where you need to load your local BokehJS build. When you
run tests or build the docs, you should not set this variable (or unset it if
it is already set) or you might get an error.

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
the variable ``BOKEH_DEV``. Use ``BOKEH_DEV`` when you are developing examples
or applications, or when you need to run the local resource server for
``BOKEH_RESOURCES=server-dev``. Do not leave ``BOKEH_DEV`` enabled when running
the test suite, because it implies ``BOKEH_RESOURCES=server``.

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

    pixi run python -m bokeh info

You should see output similar to:

.. code-block:: sh

    Python version        :  3.13.5 | packaged by conda-forge | (main, Jun 16 2025, 08:12:13) [Clang 18.1.8]
    IPython version       :  9.3.0
    Tornado version       :  6.5.1
    NumPy version         :  2.3.1
    Bokeh version         :  4.0.0.dev1
    BokehJS static path   :  /path/to/bokeh/src/bokeh/server/static
    node.js version       :  v24.3.0
    npm version           :  11.4.2
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

            BOKEH_RESOURCES=inline pixi run python examples/basic/data/transform_markers.py

    .. tab-item:: Windows (PS)
        :sync: ps

        .. code-block:: powershell

            $Env:BOKEH_RESOURCES = "inline"
            pixi run python .\examples\basic\data\transform_markers.py

    .. tab-item:: Windows (CMD)
        :sync: cmd

        .. code-block:: doscon

            set BOKEH_RESOURCES=inline
            pixi run python examples\basic\data\transform_markers.py

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

            BOKEH_DEV=false pixi run python -m bokeh serve --show examples/server/app/sliders.py

    .. tab-item:: Windows (PS)
        :sync: ps

        .. code-block:: powershell

            $Env:BOKEH_DEV = "False"
            pixi run python -m bokeh serve --show .\examples\server\app\sliders.py

    .. tab-item:: Windows (CMD)
        :sync: cmd

        .. code-block:: doscon

            set BOKEH_DEV=false
            pixi run python -m bokeh serve --show examples\server\app\sliders.py

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
:ref:`Pixi environment <contributor_guide_setup_creating_pixi_env>`,
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

    If you keep getting errors after updating an older environment, run
    ``pixi clean`` followed by ``pixi run setup``. This recreates the managed
    environments and local package installation from the committed lockfile.

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
.. _Bokeh's contributor Slack: https://slack-invite.bokeh.org/
.. _Pixi: https://pixi.prefix.dev/
.. _Pixi installation: https://pixi.prefix.dev/latest/installation/
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
