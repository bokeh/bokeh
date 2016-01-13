'''

To display information about Bokeh and Bokeh server configuration,
type ``bokeh info`` on the command line.

.. code-block:: sh

    bokeh info

This will print general information to standard output, such as Python and Bokeh versions:

.. code-block:: none

    Python version      :  2.7.11
    IPython version     :  4.0.1
    Bokeh version       :  0.11.0
    BokehJS static path :  /opt/anaconda/lib/python3.4/site-packages/bokeh/server/static

Sometimes it can be useful to get just paths to the BokehJS static files in order
to configure other servers or processes. To do this, use the ``--static`` option

.. code-block:: sh

    bokeh info --static

This will produce output like what is shown below

.. code-block:: none

    /opt/anaconda/lib/python3.4/site-packages/bokeh/server/static



'''
from __future__ import absolute_import

import sys

from bokeh import __version__
from bokeh.settings import settings

from ..subcommand import Subcommand

class Info(Subcommand):
    ''' Subcommand to print information about Bokeh and Bokeh server configuration.

    '''

    name = "info"

    help = "print information about Bokeh and Bokeh server configuration"

    args = (

        ('--static', dict(
            action='store_true',
            help="Print the locations of BokehJS static files",
        )),

    )

    def invoke(self, args):
        if args.static:
            print(settings.bokehjsdir())
        else:
            try:
                import IPython
                ipy_version = IPython.__version__
            except ImportError:
                ipy_version = "Not installed"
            print("Python version      :  %s" % sys.version.split('\n')[0])
            print("IPython version     :  %s" % ipy_version)
            print("Bokeh version       :  %s" % __version__)
            print("BokehJS static path :  %s" % settings.bokehjsdir())
