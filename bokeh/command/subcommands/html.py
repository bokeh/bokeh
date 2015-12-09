'''
To generate a standalone HTML page for a Bokeh application from a single
Python script, pass the script name to ``bokeh html`` on the command
line:

.. code-block:: sh

    bokeh html app_script.py

The generated HTML will be saved in the current working directory with
the name ``app_script.html``.

Applications can also be created from directories. The directory should
contain a ``main.py`` (and any other helper modules that are required) as
well as any additional assets (e.g., theme files). Pass the directory name
to ``bokeh html`` to generate the HTML:

.. code-block:: sh

    bokeh html app_dir

It is possible to generate HTML pages for multiple applications at once:

.. code-block:: sh

    bokeh html app_script.py app_dir

If you would like to automatically open a browser to display the HTML
page(s), you can pass the ``--show`` option on the command line:

.. code-block:: sh

    bokeh html app_script.py app_dir --show

This will open two pages, for ``app_script.html`` and ``app_dir.html``,
respectively.

.. warning::
    Applications that use ``on_change`` callbacks require using the Bokeh
    server to execute the callback code. Though the application may render,
    the callbacks will not function. See :ref:`userguide_cli_serve` for
    more information on using ``bokeh serve``.

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

    args = (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help="The app directories or scripts to generate HTML for",
            default=None,
        )),

        (
            '--show', dict(
            action='store_true',
            help="Open generated file(s) in a browser"
        )),

    )

    def invoke(self, args):
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