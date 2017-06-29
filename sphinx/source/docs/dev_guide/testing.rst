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

    py.test -m unit

Note that this includes unit tests that require Selenium to be installed. To
exclude those unit tests, you can run the command:

.. code-block:: sh

    py.test -m "unit and not selenium"

To run just the BokehJS unit tests, execute:

.. code-block:: sh

    py.test -m js

Alternatively, you can also navigate to the `bokehjs` subdirectory of the
source checkout and execute:

.. code-block:: sh

    gulp test

You can run all available tests (python and JS unit tests, as well as example
and integration tests) **from the top level directory** by executing:

.. code-block:: sh

    py.test

To learn more about marking test functions and selecting/deselecting them for
a run, please consult the pytest documentation for `custom markers`_. The list
of currently defined test markers is below:

* ``examples``: an examples image-diff test
* ``integration``: an integration test that runs on `SauceLabs`_
* ``js``: a javascript test
* ``quality``: a code quality test
* ``selenium``: a test requiring selenium
* ``unit``: a python unit test (implicitly assigned for tests otherwise unmarked)

Code Coverage
~~~~~~~~~~~~~

To run any of the tests with coverage use the following:

.. code-block:: sh

  py.test --cov=bokeh

To report on a subset of the Bokeh package, pass e.g. ``-cov=bokeh/models``.

Other Options
~~~~~~~~~~~~~

To run any of the tests without standard output captured use:

.. code-block:: sh

  py.test -s

See the `pytest`_ documentation for further information on ``py.test`` and
its options.

Examples tests
~~~~~~~~~~~~~~

The ``examples`` tests run a selection of the Bokeh examples and generate
images to compare against previous releases. A report is generated that
displays the current and previous images, as well as any image difference.

.. note::
    The tests do not currently fail if the images are different, the test
    report must be inspected manually.

To run just the examples tests, run the command:

.. code-block:: sh

    py.test -m examples --report-path=examples.html

After the tests have run, you will be able to see the test report at
``examples.html``. Running locally, you can name the test report whatever
you want. On TravisCI, the examples report is always ``examples.html``.

The examples tests can run slowly, to speed them up, you can parallelize them:

.. code-block:: sh

    py.test -m examples --report-path=examples.html -n 5

Where ``n`` is the number is the number of cores you want to use.

In addition, the examples tests generate a log file, examples.log which you
can view at ``examples.log`` in the same directory that you the tests
were run from.

.. warning::
    Server examples do get run, but phantomJS cannot currently capture
    the output, so they are always blank in the test results

Integration tests
~~~~~~~~~~~~~~~~~

Integration tests use the `selenium webdriver`_ to test bokeh in the browser.
Some of the selenium tests run on Firefox and can be run locally.

.. note::
    Only Firefox 47 and Firefox 45 are currently known to work. For more
    information see the :bokeh-issue:`5559`.

To download a specific version of Firefox, go to
https://ftp.mozilla.org/pub/firefox/releases/
Unzip the release and note the location of the application under ``bin``
directory.

To run just the integration tests, run the command:

.. code-block:: sh

    py.test -m integration                  \
        --driver Firefox                    \
        --firefox-path /path/to/firefox/app \
        --html=tests/pytest-report.html

The ``--html`` is optional, but it will allow you to see the same report that
is generated on TravisCI.

Many of these tests can be run locally, and you will see browser windows open
and close on your machine as you run them. When we run the tests on TravisCI we
use the selenium service SauceLabs_ which provides free testing for open source
projects.

It is strongly recommended to run ``python setup.py develop`` before running
the integration tests to ensure that the latest version of BokehJS (with any
changes you may have made), is available for the integration tests.

----

Some of the integration tests are screenshot tests that take a screenshot of
the bokehplot and compare it against a reference image that is stored in the
repository. These tests must be run on SauceLabs_ so that comparisons can be
made consistently.

To run the integration tests on SauceLabs, run the command:

.. code-block:: sh

    py.test -m integration --driver=SauceLabs --html=tests/pytest-report.html

For this command to be successful you must have the following:

* ``SAUCELABS_USERNAME`` environment variable

* ``SAUCELABS_API_KEY`` environment variable

* Sauce Connect tunnel running

To start up the tunnel, first download `Sauce Connect`_. Next, extract the
files and navigate to the install directory. Then you can establish the tunnel
by running:

.. code-block:: sh

    bin/sc -u SAUCELABS_USERNAME -k SAUCELABS_API_KEY

To obtain the ``SAUCELABS_USERNAME`` and ``SAUCELABS_API_KEY`` please
`contact the developers`_.

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

markers
    By default any unmarked test is considered part of the ``unit`` group. If
    a unit test needs an additional mark (e.g. ``selenium``) then the ``unit``
    marker must be supplied explicitly:

    .. code-block:: python

        @pytest.mark.unit
        @pytest.mark.selenium
        def test_basic_script(capsys):
            # test code here

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

To add a new screen shot integration test, first make sure you can run
existing screen shot tests, for example
:bokeh-tree:`tests/integration/annotations/test_whisker.py`. New screen
shot tests should follow the general guidelines:

* Be as simple as possible (only include things under test and nothing extra)

* Prefer the ``bokeh.models`` API

Once a new test is written, a base image for comparison is needed. To create
a new base image, add ``--set-new-base-screenshot`` to your the standard
``py.test`` command to run the test. This will generate an image with the name
``base__<name_of_your_test>.png`` in the appropriate directory. Use ``git``
to check this image into the repository, and then all future screen shot tests
will be compared against this base image.

Continuous Integration
----------------------

Every push to the `master` branch or any Pull Request branch on GitHub
automatically triggers a full test build on the `TravisCI`_ continuous
integration service. This is most often useful for running the full Bokeh
test suite continuously, but also triggers automated scripts for publishing
releases when a tagged branch is pushed.

You can see the list of all current and previous builds at this URL:
https://travis-ci.org/bokeh/bokeh

From there you can navigate to the build page for any specific build (e.g.
for the latest merge to master, or a particular Pull Request). A typical
build page looks like the image below:

.. figure:: /_images/travisci.png
    :align: center
    :width: 85%

As seen, the status of all build stages and jobs can be quickly inspected.
When everything is running smoothly, all jobs will have a green check mark.

Configuration
~~~~~~~~~~~~~

There are a number of files that affect the build configuration:

* :bokeh-tree:`.travis.yml`
    Defines the build matrix and global configurations for the stages
    described below.

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

Build Stages
~~~~~~~~~~~~

Build
'''''

The ``Build`` stage has a single job that is responsible for creating a
``noarch`` conda package for Bokeh. This ensures both that the BokehJS can
be built correctly, and that important release packaging machinery is
always functional. Additionally artifacts from this build, such as the conda
package, and the BokehJS build directory, are saved to be re-used by future
jobs, speeding up the entire build.

The controlling script is :bokeh-tree:`scripts/ci/build`

Test
''''

The ``Test`` stage is comprised of several jobs that run all the various
Bokeh tests.

The controlling script is :bokeh-tree:`scripts/ci/test`, which calls a
separate ``test:<GROUP>`` script for each of the following test groups:

``examples``
    This job executes a large portion of the Bokeh examples to ensure that
    they run without any Python or JavaScript errors. Additionally, the job
    for ``PYTHON=2.7`` generates images for the examples and a report that
    compares the images to previous versions.

``integration``
    This job executes the integration tests on `SauceLabs`_. Additionally
    a report is uploaded to see the detailed results.

``js``
    This job runs all the JavaScript unit tests (i.e. ``gulp test``)


``unit``
    This job runs all the Python unit tests (i.e. ``py.test -m unit``). The
    tests are run on different jobs for Python versions 2.7 and 3.4+.

``docs``
    This job runs the documentation build. For more information about building
    or contributing documentation see the :ref:`devguide_documentation` section
    of the Developer's guide.

``quality``
    This job runs tests that maintain code quality and package integrity.

Deploy
''''''

The ``Deploy`` stage has a single job that is responsible for executing all
the work necessary to complete a Bokeh release. This includes tasks such as:

* Building and publishing conda and sdist packages
* Making BokehJS assets available on CDN
* Building and deploying the Bokeh documentation site
* Generating and uploading Bokeh examples tarballs
* Publishing BokehJS NPM packages

All of these steps are performed for full releases, however some may be omitted
for dev builds and release candidates.

The controlling script is :bokeh-tree:`scripts/ci/deploy`


Etiquette
~~~~~~~~~

TravisCI provides five free build workers to Open Source projects. A few
considerations will help you be considerate of others needing these limited
resources:

* Group commits into meaningful chunks of work before pushing to GitHub (i.e.
  don't push on every commit).

* If you must make multiple commits in succession, navigate to TravisCI and
  cancel all but the last build, in order to free up build workers.

* If expensive ``examples`` tests are not needed (e.g. for a docs-only Pull
  Request), they may be disabled by adding the text

  .. code-block:: none

    [ci disable examples]

  to your commit message.

.. _contact the developers: http://bokehplots.com/pages/contact.html
.. _custom markers: http://pytest.org/latest/example/markers.html#working-with-custom-markers
.. _pytest: https://docs.pytest.org
.. _SauceLabs: http://saucelabs.com/
.. _Sauce Connect: https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect+Proxy
.. _selenium webdriver: http://docs.seleniumhq.org/docs/03_webdriver.jsp
.. _TravisCI: https://travis-ci.org/
