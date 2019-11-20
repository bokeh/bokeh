#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
To generate standalone SVGs for a Bokeh application from a single
Python script, pass the script name to ``bokeh svg`` on the command
line:

.. code-block:: sh

    bokeh svg app_script.py

The generated SVGs will be saved in the current working directory with
the name ``app_script.svg``. If there are multiple SVGs within an application,
the subsequent ones will be named ``app_script_1.svg``, ``app_script_2.svg``,
etc.

It is also possible to run the same commmand with jupyter notebooks:

.. code-block:: sh

    bokeh svg app_notebook.ipynb

This will generate SVG files named ``app_notebook_{n}.svg`` just like
with a python script.

Applications can also be created from directories. The directory should
contain a ``main.py`` (and any other helper modules that are required) as
well as any additional assets (e.g., theme files). Pass the directory name
to ``bokeh svg`` to generate the SVG:

.. code-block:: sh

    bokeh svg app_dir

It is possible to generate SVG files for multiple applications at once:

.. code-block:: sh

    bokeh svg app_script.py app_dir

For all cases, it's required to explicitly add a Bokeh layout to
``bokeh.io.curdoc`` for it to appear in the output.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import io

# External imports

# Bokeh imports
from ...io.export import get_svgs, create_webdriver, terminate_webdriver

from ..util import set_single_plot_width_height

from .file_output import FileOutputSubcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'SVG',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class SVG(FileOutputSubcommand):
    ''' Subcommand to output applications as standalone SVG files.

    '''

    #: name for this subcommand
    name = "svg"

    #: file extension for output generated by this :class:`~bokeh.command.subcommands.file_output.FileOutputSubcommand`
    extension = "svg"

    help = "Create standalone SVG files for one or more applications"

    args = (

        FileOutputSubcommand.files_arg("SVG"),

        ('--height', dict(
            metavar='HEIGHT',
            type=int,
            help="The desired height of the exported layout obj only if it's a Plot instance",
            default=None,
        )),

        ('--width', dict(
            metavar='WIDTH',
            type=int,
            help="The desired width of the exported layout obj only if it's a Plot instance",
            default=None,
        )),

    ) + FileOutputSubcommand.other_args()

    def invoke(self, args):
        '''

        '''
        self.driver = create_webdriver()
        try:
            super().invoke(args)
        finally:
            terminate_webdriver(self.driver)

    def write_file(self, args, filename, doc):
        '''

        '''
        contents = self.file_contents(args, doc)
        for i, svg in enumerate(contents):
            if filename == '-':
                print(svg)
            else:
                if i == 0:
                    filename = filename
                else:
                    idx = filename.find(".svg")
                    filename = filename[:idx] + "_{}".format(i) + filename[idx:]
                with io.open(filename, "w", encoding="utf-8") as f:
                    f.write(svg)
            self.after_write_file(args, filename, doc)

    def file_contents(self, args, doc):
        '''

        '''
        set_single_plot_width_height(doc, width=args.width, height=args.height)
        return get_svgs(doc, driver=self.driver)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
