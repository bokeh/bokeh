'''

To display the locations of static files for use with Bokeh server,
type ``bokeh info`` on the command line. The locations will be printed
to standard output.

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
