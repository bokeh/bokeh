''' Provide a subcommand to generate standalone HTML files for specified
Bokeh applications.

'''
from __future__ import absolute_import

from bokeh.io import output_file, save, show

from ..subcommand import Subcommand
from ..util import build_single_handler_applications

class HTML(Subcommand):
    ''' Subcommand to output applications as standalone HTML files.

    '''

    name = "html"

    help = "Create standalone HTML files for one or more applications"

    def __init__(self, **kwargs):
        super(HTML, self).__init__(**kwargs)

        self.parser.add_argument(
            'files',
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help="The app directories or scripts to generate HTML for",
            default=None
        )

        self.parser.add_argument(
            '--show',
            action='store_true',
            help="Open generated file(s) in a browser"
        )

    def func(self, args):
        applications = build_single_handler_applications(args.files)

        for (route, app) in applications.items():
            doc = app.create_document()

            if route == "/":
                filename = "index.html"
            else:
                filename = route[1:] + ".html"

            output_file(filename)

            if args.show:
                show(doc, new='tab')
            else:
                save(doc)