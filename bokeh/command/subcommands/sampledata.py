''' Download the Bokeh sample data sets to local disk.

To download the Bokeh sample data sets, execute

.. code-block:: sh

    bokeh sampledata

on the command line.

Executing this command is equivalent to running the Python code

.. code-block:: python

    import bokeh.sampledata

    bokeh.sampledata.download()

'''
from __future__ import absolute_import

from bokeh import sampledata

from ..subcommand import Subcommand

class Sampledata(Subcommand):
    ''' Subcommand to download bokeh sample data sets.

    '''

    #: name for this subcommand
    name = "sampledata"

    help = "Download the bokeh sample data sets"

    args = (
    )

    def invoke(self, args):
        '''

        '''
        sampledata.download()
