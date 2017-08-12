''' Provide a Bokeh Application Handler to build up documents by running
the code from Jupyter notebook (``.ipynb``) files.

This handler is configured with the filename of a Jupyter notebook. When a
Bokeh application calls ``modify_doc``, the code from all the notebook cells
is collected and executed to process a new Document for a session. When the
notebook code is executed, the Document being modified will be available as
``curdoc``, and any optionally provided ``args`` will be available as
``sys.argv``.

'''
from __future__ import absolute_import, print_function

from bokeh.util.dependencies import import_required

from .code import CodeHandler

class NotebookHandler(CodeHandler):
    ''' A Handler that uses code in a Jupyter notebook for modifying Bokeh
    Documents.

    '''

    _logger_text = "%s: call to %s() ignored when running notebooks with the 'bokeh' command."

    _origin = "Notebook"

    def __init__(self, *args, **kwargs):
        '''

        Keywords:
            filename (str) : a path to a Jupyter notebook (".ipynb") file

        '''
        nbformat = import_required('nbformat', 'The Bokeh notebook application handler requires Jupyter Notebook to be installed.')
        nbconvert = import_required('nbconvert', 'The Bokeh notebook application handler requires Jupyter Notebook to be installed.')

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to NotebookHandler')
        filename = kwargs['filename']

        with open(filename) as f:
            nb = nbformat.read(f, nbformat.NO_CONVERT)
            exporter = nbconvert.PythonExporter()
            source, meta = exporter.from_notebook_node(nb)
            kwargs['source'] = source

        super(NotebookHandler, self).__init__(*args, **kwargs)
