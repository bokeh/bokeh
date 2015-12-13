'''
To generate a the serialized JSON represenation for a Bokeh application
from a single Python script, pass the script name to ``bokeh json`` on the
command line:

.. code-block:: sh

    bokeh json app_script.py

The resulting JSON will be output to the console ("standard out"), and will
have the keys of each block sorted alphabetically.

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
from __future__ import print_function

from ..subcommand import Subcommand
from ..util import build_single_handler_application

class JSON(Subcommand):
    ''' Subcommand to output applications as serialized JSON

    '''

    name = "json"

    help = "Emit serialized JSON for one application"

    args = (

        ('file', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            help="The app directory or script to generate JSON for",
            default=None
        )),

        ('--indent', dict(
            metavar='LEVEL',
            type=int,
            help="indentation to use when printing",
            default=None
        )),

    )

    def invoke(self, args):
        application = build_single_handler_application(args.file)

        doc = application.create_document()
        print(doc.to_json_string(indent=args.indent))