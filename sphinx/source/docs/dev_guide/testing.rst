.. _devguide_testing:

Testing
=======

.. contents::
    :local:
    :depth: 2

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/bokeh/bokeh.

To run the just the python unit tests, run the command:

.. code-block:: sh

    py.test -m 'not (js or examples)' 


To run just the examples, run the command:

.. code-block:: sh

    py.test -m examples 

To run just the BokehJS unit tests, execute:

.. code-block:: sh

    py.test -m js


Or, in the `bokehjs` subdirectory of the source checkout.

.. code-block:: sh

    gulp test


You can run all available tests (python and JS unit tests and example tests)
from the top level directory by executing:

.. code-block:: sh

    py.test

.. note::
    Currently this script does not support Windows.

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
