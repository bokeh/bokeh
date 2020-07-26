.. _devguide_testing:

Testing
=======

Bokeh is a large, multi-language project, and relies on varied and extensive
tests and testing tools in order to maintain capability and prevent
regressions. This chapter describes how to run various tests locally in
a development environment, guidelines for writing tests, and information
regarding the continuous testing infrastructure.

.. contents::
    :local:
    :depth: 2

Running Tests Locally
---------------------

Before attempting to run Bokeh tests, make sure you have successfully run
through all of the instructions in the :ref:`devguide_setup` section of the
Developer's Guide.

Test Selection
~~~~~~~~~~~~~~

Additionally, on some platforms you may need to increase the maximum number
of open file descriptors as some tests open many files to test the server.

.. code-block:: sh

    ulimit -n 1024

To run all the basic python unit tests, run the following command at the top
level of the repository:

.. code-block:: sh

    pytest tests/unit

Note that this includes unit tests that require Selenium as well as appropriate
web drivers (e.g. chromedriver and geckodriver) to be installed. To exclude
those unit tests, you can run the command:

.. code-block:: sh

    pytest -m "not selenium" tests/unit

To run just the BokehJS unit tests, execute:

.. code-block:: sh

    pytest tests/test_bokehjs.py

Alternatively, you can also navigate to the `bokehjs` subdirectory of the
source checkout and execute:

.. code-block:: sh

    node make test

You can run all available tests (python and JS unit tests, as well as example
and integration tests) **from the top-level directory** by executing:

.. code-block:: sh

    pytest

To learn more about marking test functions and selecting/deselecting them for
a run, please consult the pytest documentation for `custom markers`_. The list
of currently defined test markers is below:

* ``sampledata``: a test for requiring ``bokeh.sampledata`` be downloaded
* ``selenium``: a test requiring selenium

Code Coverage
~~~~~~~~~~~~~

To run any of the tests with coverage, use the following:

.. code-block:: sh

  pytest --cov=bokeh

To report on a subset of the Bokeh package, pass e.g. ``-cov=bokeh/models``.

Other Options
~~~~~~~~~~~~~

To run any of the tests without standard output captured use:

.. code-block:: sh

  pytest -s

See the `pytest`_ documentation for further information on ``pytest`` and
its options.

Examples Tests
~~~~~~~~~~~~~~

The ``examples`` tests run a selection of the Bokeh examples and generate
images to compare against previous releases. A report is generated that
displays the current and previous images, as well as any image difference.

.. note::
    The tests do not currently fail if the images are different, the test
    report must be inspected manually.

To run just the examples tests, run the command:

.. code-block:: sh

    pytest --report-path=examples.html test_examples.py

After the tests have run, you will be able to see the test report at
``examples.html``. Running locally, you can name the test report whatever
you want.

The examples tests can run slowly, to speed them up, you can parallelize them:

.. code-block:: sh

    pytest --report-path=examples.html -n 5 test_examples.py

Where ``n`` is the number of cores you want to use.

In addition, the examples tests generate a log file, examples.log which you
can view at ``examples.log`` in the same directory that you the tests
were run from.

Integration Tests
~~~~~~~~~~~~~~~~~

Writing Tests
-------------

In order to help keep Bokeh maintainable, all Pull Requests that touch code
should normally be accompanied by relevant tests. While exceptions may be
made for specific circumstances, the default assumption should be that a
Pull Request without tests may not be merged.

Python Unit Tests
~~~~~~~~~~~~~~~~~

Python unit tests maintain the basic functionality of the Python portion of
the Bokeh library. A few general guidelines will help you write Python unit
tests:

absolute imports
    In order to ensure that Bokeh's unit tests as relocatable and unambiguous
    as possible, always prefer absolute imports in test files. When convenient,
    import and use the entire module under test:

    * **GOOD**: ``import bokeh.models.transforms as bmt``
    * **GOOD**: ``from bokeh.embed import components``
    * **BAD**: ``from ..document import Document``

pytest
    All new tests should use and assume `pytest`_ for test running, fixtures,
    parameterized testing, etc. New tests should *not* use the ``unittest``
    module of the Python standard library.

JavaScript Unit Tests
~~~~~~~~~~~~~~~~~~~~~

These tests maintain the functionality of the BokehJS portion of the Bokeh
project. The BokehJS tests are located in :bokeh-tree:`bokehjs/test`. They
are written using Chai "expect" style. If new test files are added, an
appropriate entry in the directory ``index`` file should be added.

Integration Tests
~~~~~~~~~~~~~~~~~

To add a new screenshot integration test, first make sure you can run
existing screenshot tests, for example
:bokeh-tree:`tests/integration/annotations/test_whisker.py`. New screenshot
tests should follow these general guidelines:

* Be as simple as possible (only include things under test and nothing extra)

* Prefer the ``bokeh.models`` API

Once a new test is written, a base image for comparison is needed. To create
a new base image, add ``--set-new-base-screenshot`` to your the standard
``pytest`` command to run the test. This will generate an image with the name
``base__<name_of_your_test>.png`` in the appropriate directory. Use ``git``
to check this image into the repository, and then all future screenshot tests
will be compared against this base image.

Continuous Integration
----------------------

Every push to the `master` branch or any Pull Request branch on GitHub
automatically triggers a full test build on the `GithubCI`_ continuous
integration service.

You can see the list of all current and previous builds at this URL:
https://github.com/bokeh/bokeh/actions

Configuration
~~~~~~~~~~~~~

There are a number of files that affect the build configuration:

* :bokeh-tree:`conda.recipe/meta.yaml`
    Instructions for building a conda noarch package for Bokeh. This
    file is the single source of truth for build and test (but not
    runtime) dependencies.

* :bokeh-tree:`setup.py`
    Used to build sdist packages and "dev" installs. This file is also
    the single source of truth for runtime dependencies.

* :bokeh-tree:`setup.cfg`
    Contains some global configuration for build and test tools such as
    ``versioneer`` and ``pytest``.

Etiquette
~~~~~~~~~

CI services provide finite free build workers to Open Source projects. A few
considerations will help you be considerate of others needing these limited
resources:

* Group commits into meaningful chunks of work before pushing to GitHub (i.e.
  don't push on every commit).

* If expensive ``examples`` tests are not needed (e.g. for a docs-only Pull
  Request), they may be disabled by adding the text

  .. code-block:: none

    [ci disable examples]

  to your commit message.

.. _contact the developers: https://discourse.bokeh.org/c/development
.. _custom markers: http://pytest.org/latest/example/markers.html#working-with-custom-markers
.. _pytest: https://docs.pytest.org
.. _selenium webdriver: http://docs.seleniumhq.org/docs/03_webdriver.jsp
.. _GithubCI: https://github.com/bokeh/bokeh/actions
