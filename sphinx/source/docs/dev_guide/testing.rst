.. _devguide_testing:

Running tests
=============

Bokeh is a large, multi-language project and relies on complex and
comprehensive tests and testing tools to help ensure consistency and
prevent regressions.

This chapter describes how to run various tests in a
:ref:`local development environment <devguide_testing_local>` and in
:ref:`Bokeh's continuous integration (CI) system on GitHub <devguide_testing_ci>`.

.. _devguide_testing_local:

Local testing
-------------

Almost all of Bokeh's tests can be run locally. However, some of the tests can
be complex to set up and run correctly on a local system. Therefore, all tests
will run in :ref:`Bokeh's CI <devguide_testing_ci>` when you
:ref:`create a Pull Request <devguide_pull_requests>` on Bokeh's GitHub
repository. **You don't need to set up and run all tests locally**.

For reference, this section provides an overview of the available tests and how
to run them locally on most systems. Generally, it makes most sense to **only
run specific tests related to what you are working on**. See
:ref:`Select specific tests <devguide_testing_local_python_select>` for
instructions on how to select and deselect specific Python tests. See
:ref:`Select specific BokehJS tests <devguide_testing_local_typescript_selecting>`
for instructions on how to select and deselect specific :term:`BokehJS` tests.

Check basic requirements
~~~~~~~~~~~~~~~~~~~~~~~~

Before attempting to run Bokeh tests locally, make sure you have successfully
completed all of the steps in the :ref:`devguide_setup` section of this
contributors guide.

Check that :ref:`Bokeh's sampledata <install_sampledata>` is installed and up to
date by running ``bokeh sampledata``. In case you are not able to install the
sampledata on your system, you have the option to
:ref:`disable those specific tests <devguide_testing_local_python_select>`.

Several tests also require `Selenium`_ and a corresponding `web driver`_ to be
available on your system. While it is possible to use other web drivers for most
tests, the recommended setup is to use Selenium with `ChromeDriver`_ and either
`Chrome`_ or `Chromium`_. See :ref:`userguide_export_dependencies` for
installation instructions and more information. In case Selenium is not
available on your system, you have the option to
:ref:`disable those specific tests <devguide_testing_local_python_select>`.

On some Unix platforms, you may also need to increase the "maximum
number of open file descriptors". Some tests open many files when testing the
server, so this number should be at least 1024.

.. code-block:: sh

    ulimit -n 1024

.. _devguide_testing_local_python:

Run Python tests
~~~~~~~~~~~~~~~~

Bokeh includes a number of tests that are focused on Bokeh's Python code.
These tests use `pytest`_ and are located in :bokeh-tree:`tests`.

These are some command line arguments for ``pytest`` that are helpful to know
when working with Bokeh tests:

* ``-k``: Provide a search string to filter for specific tests. See
  :ref:`Select specific tests <devguide_testing_local_python_select>`.
* ``-m``: Select or deselect specific test based on markers. See
  :ref:`Select specific tests <devguide_testing_local_python_select>`.
* ``-n``: Distribute testing over several CPUs/cores. Provide a number to define
  the number of cores to use. Set to ``auto`` to use all available cores. For
  example: ``pytest -n 4 tests/codebase``. See `pytest-xdist`_.
* ``-v``: Run test with more verbose output.
* ``--driver``: Use a specific web driver for Selenium-based tests
  (``"chrome"``, ``"firefox"``, or ``"safari"``). For example:
  ``pytest --driver="firefox" tests/integration/``.
* ``--no-js``: Skip any JavaScript code and only test Python code.

See the `pytest documentation`_ for more options.

Codebase tests
    The most basic set of tests are Bokeh's codebase tests. This includes
    linting with `flake8` and other tests for issues such as unused imports and
    extra white spaces.

    Run this command from the top level of the repository:

    .. code-block:: sh

        pytest tests/codebase

Unit tests
    To run Bokeh's Python unit tests, use the following command at the top
    level of the repository:

    .. code-block:: sh

        pytest -m "not selenium" tests/unit

    .. note::
        This command will exclude unit tests that require `Selenium`_. Because
        Selenium can be difficult to set up and because some unit tests require
        both `geckodriver`_ and `ChromeDriver`_ to be available on your system,
        using ``-m "not selenium"`` is the recommended way to run unit tests
        locally. Once you :ref:`create a Pull Request <devguide_pull_requests>`,
        :ref:`Bokeh's CI <devguide_testing_ci>` will run all tests, including
        Selenium-based unit tests. In case Selenium with both geckodriver and
        ChromeDriver is available on your system, you can run all unit tests
        with ``pytest tests/unit``.

.. _devguide_testing_local_python_integration:

Integration tests
    To run Bokeh's Python-focused integration tests, use this command from the
    top level of the repository:

    .. code-block:: sh

        pytest tests/integration

    These tests mostly simulate UI interactions. Therefore, they require
    `Chrome`_ or `Chromium`_ and `Selenium`_ with the `ChromeDriver`_ web
    driver.

Code coverage
    To create a coverage report, use ``pytest`` with the command line options
    ``--cov=bokeh`` and ``--cov-config=tests/.coveragerc``:

    .. code-block:: sh

        pytest --cov=bokeh --cov-config=tests/.coveragerc

    You also have the option to add
    ``--cov=bokeh --cov-config=tests/.coveragerc`` when running a specific
    subset of tests. This adds a coverage report to the test results. For
    example:

    .. code-block:: sh

        pytest --cov=bokeh --cov-config=tests/.coveragerc tests/codebase

    .. seealso::
        Coverage reports use the pytest plugin `pytest-cov`_. For more
        information, see the `documentation for pytest-cov`_.

Examples tests
    The ``examples`` tests run a selection of the examples in the Bokeh
    repository and generate images to compare against images generated by
    previous releases.

    The example tests use a specialized testing framework, including a custom
    configuration of Chrome. Therefore, it is **recommended to not run those
    tests locally**. Instead, :ref:`Bokeh's CI <devguide_testing_ci>` runs all
    examples tests once you :ref:`create a Pull Request <devguide_pull_requests>`.

    Running these tests also generates a report that displays
    the current and previous images, as well as any image difference.

    .. note::
        The tests currently don't fail if the images are different. You need to
        inspect the test report manually.

    To run the examples tests, you first need to start a customized headless
    version of Chrome in the background. This headless browser needs to be
    started from the ``bokehjs`` folder. Use the following commands from the top
    level of your *source checkout* directory:

    .. code-block:: sh

        cd bokehjs
        node make test:spawn:headless

    [TBD not working on Win10?]

    Next, return to the top level directory and run the tests:

    .. code-block:: sh

        cd ..
        pytest tests/test_examples.py

    [TBD: pytest --report-path=examples.html parameter not recognized?]

    After the tests have run, the results are available in
    ``examples-report.html``. This file is located in the same directory that
    you ran the tests from:

    .. image:: /_images/examples_test_report.png
        :class: image-border
        :alt: Screenshot of a browser window displaying an examples test report
            consisting of various plots.

    In addition, the examples tests generate a log file called ``examples.log``
    in the same directory.

    The examples tests can run slowly. To speed them up, you can parallelize
    them with the command line option `-n`. The number you supply to `-n` is
    the number of cores you want to use. For example:

    .. code-block:: sh

        pytest -n 5 test_examples.py

    [TBD: Running with ``n`` leads to several test now failing ("Cannot start
    Bokeh server, port 5006 is already in use") - does the headless browser need
    a multi-thread argument when spawned to allow multiple connections?]

Run all available tests
    You can run all available tests (Python and TypeScript unit tests, examples,
    and integration tests) by running the following command from the top-level
    directory:

    .. code-block:: sh

        pytest

.. _devguide_testing_local_python_select:

Select specific tests
    To test a subset of the Bokeh package, pass a path to ``pytest``:

    .. code-block:: sh

        pytest tests/unit/bokeh/models/

    Similarly, you can run a specific test by passing a specific file to
    ``pytest``:

    .. code-block:: sh

        pytest tests/unit/bokeh/models/test_grids.py

    Another way to select or deselect specific tests is to use markers.
    Currently, Bokeh's tests use the following two markers:

    * ``sampledata``: a test that requires ``bokeh.sampledata`` to be downloaded
    * ``selenium``: a test that requires selenium

    For more information on setting your own markers, see
    `Working with custom markers` in the `pytest documentation`_. To learn more
    about pytest's various options to select specific tests, see
    `Specifying which tests to run`_.

.. seealso::
    For more information on adding and updating Python tests, see
    :ref:`devguide_writing_tests_python`.

.. _devguide_testing_local_typescript:

Run TypeScript tests
~~~~~~~~~~~~~~~~~~~~

Most of the TypeScript-based tests for :term:`BokehJS` use a custom-made testing
framework. This framework **requires Google Chrome or Chromium**. You need a
recent version of one of these browsers available on your system to run those
tests locally.

Run all BokehJS tests
'''''''''''''''''''''

You can use ``pytest`` to run all available tests for BokehJS:

.. code-block:: sh

    pytest tests/test_bokehjs.py

This is a shortcut to run all BokehJS tests. You can run the same set of tests
directly with ``node make``, from the `bokehjs` subdirectory
of the source checkout:

.. code-block:: sh

    node make test

This runs a combination of codebase, defaults, unit, and integration test
suites.

.. _devguide_testing_local_typescript_selecting:

Select specific BokehJS tests
'''''''''''''''''''''''''''''

You also have the option to run these test suites individually, using
``node make test:suite_name`` in the `bokehjs` subdirectory of the source
checkout:

* ``node make test:codebase``: Codebase tests checking file size limits
* ``node make test:defaults``: Tests checking whether the defaults in Bokeh’s
  Python models match those of Bokeh’s TypeScript models
* ``node make test:unit``: Unit tests for BokehJS
* ``node make test:integration``: Visual integration tests comparing locally
  generated plots against a set of baseline files

You can combine the last two test suites by running ``node make test:lib``.

Additionally, you can use search strings to select individual tests or groups
of tests. Use the ``-k`` argument to supply your search string. The search
string is case-sensitive. The BokehJS testing framework tries to match your
search string to the strings defined in the tests' ``describe()`` and
``it()`` functions. For example:

.. code-block:: sh

    $ node make test:integration -k "Legend"

This will only run integration tests that contain the string "Legend".

.. note::
    Unit and integration tests require a recent version of Chrome or Chromium.
    The BokehJS testing framework starts the browser automatically with the
    right settings to guarantee consistent test results.

.. _devguide_testing_local_typescript_devtools:

Testing with devtools server
''''''''''''''''''''''''''''

In addition to running BokehJS tests from the command line, you can also use
BokehJS's devtools server. Use this system to run tests and review the visual
tests' output.

First, start the devtools server with the following command:

.. code-block:: sh

    $ node test/devtools server
    listening on 127.0.0.1:5777

You can now use the devtools server for the following operations:

Inspecting visual test results
    After running integration tests, you can use the devtools server to
    compare your local results with the baseline images. Open the displayed
    server URL in a web browser and append ``/integration/report``. This will
    open a comparison view of any tests where your locally rendered plot is
    different from the baseline file. For example:

    .. image:: /_images/bokehjs_devtools_report.png
        :class: image-border
        :alt: Screenshot of devtool displaying a locally rendered image, an
            image diff and a baseline image.

Initiate test runs
    You can also use the devtools server to initiate test runs. You have two options:

    * Run tests from a JavaScript console
        Open one of these three endpoints in your web browser:

        * ``/unit``
        * ``/defaults``
        * ``/integration``

        This loads BokehJS and the tests. To run the tests, issue
        ``Tests.run_all()`` in your browser's JavaScript console. This allows
        you to set breakpoints before running code. You can also pass a
        search string, list of strings, or regular expression as the function's
        ``query`` parameter to only run specific tests. For example:

        .. code-block:: TypeScript

            Tests.run_all(query=RegExp("[Ll]egend", 'g'));

        [TBD: only works with Chrome? or also firefox? Also: opens http://stuff.com/baz.html and others??!]

    * Use endpoint to run tests
        Initiate test runs by accessing one of the following endpoints with your
        browser:

        * ``/unit/run``
        * ``/defaults/run``
        * ``/integration/run``

        .. image:: /_images/bokehjs_devtools_test_run.png
            :class: image-border
            :alt: Screenshot of devtool displaying various plots as a result of
                running integration tests.

To only run or view specific tests, append ``?k=some%20text`` to the URL. This
will filter tests by keyword.

To only run or view tests for a specific platform, append either
``platform=linux``, ``platform=macos``, or ``platform=windows`` to the URL.

.. seealso::
    For more information on adding and updating BokehJS tests, see
    :ref:`devguide_writing_tests_bokehjs`.

.. _devguide_testing_ci:

Continuous Integration (CI)
---------------------------

Every time you start a :ref:`Pull Request <devguide_pull_requests>` or add new
commits to an existing Pull Request branch on Bokeh's GitHub repository,
`Bokeh's Continuous Integration (CI) <GithubCI>`_ will run all available tests
on your branch.

You can see the list of all current and previous CI runs at this URL:
https://github.com/bokeh/bokeh/actions

.. _devguide_testing_ci_environments:

Environment files
~~~~~~~~~~~~~~~~~

Bokeh's CI runs tests on Linux, macOS, and Windows. It also runs tests with
different versions of Python. The various testing environments are defined
in their respective YAML files in the :bokeh-tree:`ci`. In case you add or
change dependencies, you also need to update these files, in addition to
:bokeh-tree:`environment.yml` in the *source checkout* directory.

Additional configuration
~~~~~~~~~~~~~~~~~~~~~~~~

In addition to testing, Bokeh's CI is also used to build new Bokeh
`releases <Release Management>`_.

There are a number of files that affect the build configuration:

* :bokeh-tree:`conda.recipe/meta.yaml`
    Instructions for building a conda noarch package for Bokeh. This
    file is the single source of truth for build (but not
    runtime) dependencies.

* :bokeh-tree:`setup.py`
    Used to build sdist packages and "dev" installs. This file is also
    the single source of truth for runtime dependencies.

* :bokeh-tree:`setup.cfg`
    Contains global configuration for build and test tools such as
    ``versioneer`` and ``pytest``.

Etiquette
~~~~~~~~~

CI services provide finite free build workers to Open Source projects. Please
group your commits into meaningful chunks of work before pushing to GitHub
instead of pushing every commit individually. This will help you be considerate
of others who require access to these limited resources.

.. _pytest: https://pytest.org/
.. _pytest-xdist: https://github.com/pytest-dev/pytest-xdist
.. _flake8: https://gitlab.com/pycqa/flake8
.. _Selenium: https://www.selenium.dev/documentation/en/
.. _web driver: https://www.selenium.dev/documentation/en/webdriver/
.. _ChromeDriver: https://chromedriver.chromium.org/
.. _Chrome: https://www.google.com/chrome/
.. _Chromium: https://www.chromium.org/Home
.. _geckodriver: https://firefox-source-docs.mozilla.org/testing/geckodriver/Usage.html
.. _pytest-cov: https://github.com/pytest-dev/pytest-cov
.. _Specifying which tests to run: https://docs.pytest.org/en/latest/how-to/usage.html#specifying-which-tests-to-run
.. _documentation for pytest-cov: https://pytest-cov.readthedocs.io/en/latest/
.. _GithubCI: https://github.com/bokeh/bokeh/actions
.. _Working with custom markers: http://pytest.org/latest/example/markers.html#working-with-custom-markers
.. _pytest documentation: https://docs.pytest.org
.. _Release Management: https://github.com/bokeh/bokeh/wiki/BEP-2:-Release-Management
