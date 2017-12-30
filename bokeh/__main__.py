#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Enable execution of the "bokeh" command line program with the ``-m``
switch. For example:

.. code-block:: sh

    python -m bokeh serve --show app.py

is equivalent to

.. code-block:: sh

    bokeh serve --show app.py

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

__all__ = (
    'main',
)

def main():
    ''' Execute the "bokeh" command line program.

    '''
    import sys
    from bokeh.command.bootstrap import main as _main

   # Main entry point (see setup.py)
    _main(sys.argv)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

if __name__ == "__main__":
    main()
