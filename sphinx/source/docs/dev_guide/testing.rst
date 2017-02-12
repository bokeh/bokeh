.. _devguide_testing:

Testing
=======

Before running the unit tests set, please increase the maximum number of open
file descriptors as some of our tests open many files to test the server.

.. code-block:: sh

    ulimit -n 1024

To run just the python unit tests, run either command:

.. code-block:: sh

    py.test -m 'not (js or examples or integration or quality)'

    python -c 'import bokeh; bokeh.test()'


To run just the BokehJS unit tests, execute:

.. code-block:: sh

    py.test -m js

Or, in the `bokehjs` subdirectory of the source checkout.

.. code-block:: sh

    gulp test

You can run all available tests (python and JS unit tests, as well as example
and integration tests) **from the top level directory** by executing:

.. code-block:: sh

    py.test

To learn more about marking test functions and selecting/deselecting them for
a run, please consult the pytest documentation for `custom markers`_.

To help the test script choose the appropriate test runner, there are some
naming conventions that examples should adhere to. Non-IPython notebook
example scripts that rely on the Bokeh server should have 'server' or
'animate' in their filenames.

To run any of the tests with coverage use the following:

.. code-block:: sh

  py.test --cov=bokeh

To run any of the tests without standard output captured use:

.. code-block:: sh

  py.test -s

To run a subset of tests by name:

.. code-block:: sh

  py.test -k EXPRESSION

This will run only the tests that include ``EXPRESSION`` in their names (function or class names).

See the py.test documentation at http://pytest.org/latest/ for further information on py.test and it's options.

Examples tests
--------------

To run just the examples tests, run the command:

.. code-block:: sh

    py.test -m examples --report-path=examples.html

The examples tests run through most of the bokeh examples and perform a visual
diff to check how the examples are running. To run the examples tests you need:
- phantomjs

On linux systems, ``conda install phantomjs``.
On OSX, with homebrew ``brew install phantomjs``.

After the tests have run, you will be able to see the test report at
examples.html. On your local machine, you can name the test report wherever you
want. On TravisCI, the examples report is always examples.html.

The examples tests can run slowly, to speed them up, you can parallelize them:

.. code-block:: sh

    py.test -m examples --report-path=examples.html -n 5

Where the number is the number of cores you want to use.

In addition, the examples tests generate a log file, examples.log which you
can view at ``examples.log`` in the same level you ran the tests from.

.. warning::
    Server examples do get run, but phantomJS cannot currently capture
    the output, so they are always blank in the test results

.. warning::
    The tests do not currently fail if the images are different, the test
    report must be inspected manually.

Integration tests
-----------------

The integration tests use `selenium webdriver`_ to test bokeh in the browser.

A proportion of the selenium tests run on Firefox and can be run on your local
machine. However, due to current limitations in the test suite these tests must
be run with a specific combination of dependencies. In particular, only Firefox
47 and Firefox 45 are known to work. For more information see the open issue:
https://github.com/bokeh/bokeh/issues/5559

To download a specific version of firefox go to https://ftp.mozilla.org/pub/firefox/releases/

Unzip the release and note the location of the application under ``bin``
directory.

To run just the integration tests, run the command:

.. code-block:: sh

    py.test -m integration --html=tests/pytest-report.html --driver Firefox --firefox-path /path/to/firefox/application

The --html is optional, but it will allow you to see the report that will also
be generated on TravisCI.

Many of these tests can be run locally, and you will see browser windows open
and close on your machine as you run them. When we run the tests on TravisCI we
use the selenium service SauceLabs_ which provides free testing for open source
projects.

It is strongly recommended to run ``python setup.py develop`` before running
the integration tests to make sure that the latest version of bokehjs, which you are
developing, is available for the integration tests.

Screenshot tests
~~~~~~~~~~~~~~~~

Some of the integration tests are screenshot tests that take a screenshot of
the bokehplot and compare it against a reference image that is stored in the
repository.

In addition, because all machines and browsers are slightly different, the
screenshot tests must be run on SauceLabs_ so that we can be confident that
any changes are real.

To run the integration tests on SauceLabs, run the command:

.. code-block:: sh

    py.test -m integration --driver=SauceLabs --html=tests/pytest-report.html

For this command to be successful you will need the following:
 - ``SAUCELABS_USERNAME`` environment variable
 - ``SAUCELABS_API_KEY`` environment variable
 - Sauce Connect tunnel running

To start up a Sauce Connect tunnel, download Sauce Connect from
https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect+Proxy. Extract
the files and go into the install directory. Then you can establish the tunnel with:

.. code-block:: sh

    bin/sc -u SAUCELABS_USERNAME -k SAUCELABS_API_KEY

For the ``SAUCELABS_USERNAME`` and ``SAUCELABS_API_KEY`` talk to the Bokeh Core
Developers.

Adding (or updating) a screenshot test
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you'd like to add a new screenshot test to the Bokeh repo, first make sure
you can run the existing screenshot tests. Assuming this runs, then you'll be
able to make a new screenshot test. Check-out the existing screenshot tests to
see how to set-up your new test. Ideally, tests should contain the minimal amount
of code to test specific features. This means that you should use the low-level models
interface rather than the plotting interface (i.e. don't use ``bokeh.plotting.figure``).

Once you're set up and have written your test, you need to generate a base image.

To do this add ``--set-new-base-screenshot`` to your test command. This will
generate an image in a screenshots directory with the name
``base__<name_of_your_test>.png``. You then check this image into git and all
future screenshot tests will be compared against this base.


Testing on TravisCI
-------------------

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/bokeh/bokeh.

TravisCI runs all the available test but also run most of the examples in the
repository. Running the examples tests takes a long time. If it is appropriate
to skip these examples runs (e.g. on a documentation pull request), you can disable them by
adding `[ci disable examples]` to your commit message before pushing.

The reports from the examples tests and the integration tests are uploaded to
s3 for viewing after a TravisCI run. To find the link to the test reports,
scroll to the bottom of the TravisCI test log and find the **POOR MAN LOGGER**.

The test results always take the same format
"https://s3.amazonaws.com/bokeh-travis/<travis job_id>/<report name>" The
report names currently used are: ``examples.html``, ``examples.log``,
``tests/pytest-report.html``.

The examples.log link does not get reported in the POOR MAN LOGGER. To find it,
either search for ``EXAMPLES LOG SUCCESSFULLY UPLOADED`` in the test log, or
just click on the html report and then change html for log.

.. _custom markers: http://pytest.org/latest/example/markers.html#working-with-custom-markers
.. _SauceLabs: http://saucelabs.com/
.. _selenium webdriver: http://docs.seleniumhq.org/docs/03_webdriver.jsp
