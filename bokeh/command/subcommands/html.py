'''
To generate a standalone HTML page for a Bokeh application from a single
Python script, pass the script name to ``bokeh html`` on the command
line:

.. code-block:: sh

    bokeh html app_script.py

The generated HTML will be saved in the current working directory with
the name ``app_script.html``.

It is also possible to run the same commmand with jupyter notebooks:

.. code-block:: sh

    bokeh html app_notebook.ipynb

This will generate an HTML file named ``app_notebook.html`` just like
with a python script.

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

from bokeh.resources import Resources
from bokeh.embed import file_html

from .file_output import FileOutputSubcommand

class HTML(FileOutputSubcommand):
    ''' Subcommand to output applications as standalone HTML files.

    '''

    name = "html"

    extension = "html"

    help = "Create standalone HTML files for one or more applications"

    args = (

        FileOutputSubcommand.files_arg("HTML"),

        (
            '--show', dict(
            action='store_true',
            help="Open generated file(s) in a browser"
        )),

    ) + FileOutputSubcommand.other_args()

    def after_write_file(self, args, filename, doc):
        if args.show:
            from bokeh.util.browser import view
            view(filename)

    def file_contents(self, args, doc):
        resources = Resources(mode="cdn", root_dir=None)
        return file_html(doc, resources)
