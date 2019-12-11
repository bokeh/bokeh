#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
To generate the serialized JSON representation for a Bokeh application
from a single Python script, pass the script name to ``bokeh json`` on the
command line:

.. code-block:: sh

    bokeh json app_script.py

The generated JSON will be saved in the current working directory with
the name ``app_script.json``.

Applications can also be created from directories. The directory should
contain a ``main.py`` (and any other helper modules that are required) as
well as any additional assets (e.g., theme files). Pass the directory name
to ``bokeh json`` to generate the JSON:

.. code-block:: sh

    bokeh json app_dir

By default, the generated JSON is output as one line, with no indentation.
To generate "pretty printed" JSON on multiple lines, you can specify an
indentation level with the ``--indent`` argument:

.. code-block:: sh

    bokeh json app_script.py --indent=2

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
from argparse import Namespace

# Bokeh imports
from ...document import Document
from .file_output import FileOutputSubcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'JSON',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class JSON(FileOutputSubcommand):
    ''' Subcommand to output applications as serialized JSON

    '''

    #: name for this subcommand
    name = "json"

    #: file extension for output generated by this :class:`~bokeh.command.subcommands.file_output.FileOutputSubcommand`
    extension = "json"

    help = "Create JSON files for one or more applications"

    args = (

        FileOutputSubcommand.files_arg("JSON"),

        ('--indent', dict(
            metavar='LEVEL',
            type=int,
            help="indentation to use when printing",
            default=None
        )),

    ) + FileOutputSubcommand.other_args()

    def file_contents(self, args: Namespace, doc: Document) -> str:
        '''

        '''
        return doc.to_json_string(indent=args.indent)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
