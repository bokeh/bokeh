'''

To download the bokeh sample data sets, run ``bokeh sampledata`` on the
command line.

'''
from __future__ import absolute_import

from bokeh import sampledata

from ..subcommand import Subcommand

class Sampledata(Subcommand):
    ''' Subcommand to download bokeh sample data sets.

    '''

    name = "sampledata"

    help = "Download the bokeh sample data sets"

    args = (
    )

    def invoke(self, args):
        sampledata.download()
