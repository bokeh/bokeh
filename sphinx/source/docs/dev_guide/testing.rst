.. _devguide_testing:

Running tests
=============

Bokeh is a large, multi-language project, and relies on varied and extensive
tests and testing tools in order to maintain capability and prevent
regressions. This chapter describes how to run various tests locally in
a development environment.


Check basic requirements
------------------------

Before attempting to run Bokeh tests, make sure you have successfully run
through all of the instructions in the :ref:`devguide_setup` section of the
Developer's Guide.

Test Selection
--------------

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
-------------

To run any of the tests with coverage, use the following:

.. code-block:: sh

  pytest --cov=bokeh

To report on a subset of the Bokeh package, pass e.g. ``-cov=bokeh/models``.

Other Options
-------------

To run any of the tests without standard output captured use:

.. code-block:: sh

  pytest -s

See the `pytest`_ documentation for further information on ``pytest`` and
its options.

Examples Tests
--------------

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

.. _custom markers: http://pytest.org/latest/example/markers.html#working-with-custom-markers
.. _pytest: https://docs.pytest.org
.. _selenium webdriver: http://docs.seleniumhq.org/docs/03_webdriver.jsp
