'''

To display the locations of static files for use with Bokeh server,
type ``bokeh static`` on the command line. The locations will be printed
to standard output.

'''
from __future__ import absolute_import

from bokeh.settings import settings

from ..subcommand import Subcommand

class Static(Subcommand):
    ''' Subcommand to display the locations of BokehJS static files.

    '''

    name = "static"

    help = "output the locations of BokehJS static files"

    args = (
    )

    def invoke(self, args):
        print(settings.bokehjsdir()
)
