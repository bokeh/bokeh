.. _devguide_testing:

Testing
=======

.. contents::
    :local:
    :depth: 2

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/bokeh/bokeh.

To run the just the python unit tests, run the command:

.. code-block:: python

    import bokeh
    bokeh.test()

To run just the BokehJS unit tests, execute:

.. code-block:: sh

    gulp test

in the `bokehjs` subdirectory of the source checkout.

Additionally, there are "examples tests" that check whether all the examples
produce outputs. This script is in the `examples` directory and can be run by
executing:

.. code-block:: sh

    test -D

You can run all available tests (python and JS unit tests and example tests)
from the top level directory by executing:

.. code-block:: sh

    nosetests

.. note::
    Currently this script does not support Windows.

To help the test script choose the appropriate test runner, there are some
naming conventions that examples should adhere to. Non-IPython notebook
example scripts that rely on the Bokeh server should have 'server' or
'animate' in their filenames.
