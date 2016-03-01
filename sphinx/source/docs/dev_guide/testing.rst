.. _devguide_testing:

Testing
=======

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/bokeh/bokeh.

TravisCI runs all the available test but also run most of the examples in the
repository. If you want to skip these examples runs, you can disable them just
adding `[ci disable examples]` to your last commit message before pushing.

Additionally, there is a `diff` machinery in place to let you know, quickly and
broadly, how your changes impact on the examples available for testing. You will
find the link to the `diff` machinery report in the TravisCI log, for instance,
you can see report here: https://travis-ci.org/bokeh/bokeh/jobs/90594568#L1150
Finally, the `diff` machinery is only run on python 2, so you will find the
report in the 4th job of any build (labeled as `GROUP=examples_flake_docs`).

You can run all available tests (python and JS unit tests, as well as example
and integration tests) **from the top level directory** by executing:

.. code-block:: sh

    py.test

.. note::
    Currently this script does not support Windows.

To run just the python unit tests, run either command:

.. code-block:: sh

    py.test -m 'not (js or examples or integration)'

    python -c 'import bokeh; bokeh.test()'

To run just the examples, run the command:

.. code-block:: sh

    py.test -m examples

To run just the integration tests, run the command:

.. code-block:: sh

    py.test -m integration

To run just the BokehJS unit tests, execute:

.. code-block:: sh

    py.test -m js

Or, in the `bokehjs` subdirectory of the source checkout.

.. code-block:: sh

    gulp test

To learn more about marking test functions and selecting/deselecting them for
a run, please consult the pytest documentation about `custom markers
<http://pytest.org/latest/example/markers.html#working-with-custom-markers>`_.

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

See the py.test documentation at http://pytest.org/latest/ for further information on py.test and it's options.

Selenium Testing
----------------

The tests that run with the ``-m integration`` run on selenium. By default,
these will run locally using firefox, but you can also run them against
SauceLabs. You will need a SauceLabs account and the environment variables
``SAUCELABS_USERNAME`` and ``SAUCELABS_API_KEY`` set. In addition, you will
need to be running an instance of SauceConnect:
https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect

To run with SauceLabs use ``--driver=SauceLabs``. If you are using the
SauceLabs driver, you can also use the ``--cross-browser`` command line
argument to run the integration tests against a combination of browsers and
platforms.
