''' Make the `bokeh.command` package executable.

The ``bokeh`` command can be run by executing:

.. code-block:: python

    python -m bokeh.command <args>

'''
from __future__ import absolute_import

import sys

from .bootstrap import main

main(sys.argv)