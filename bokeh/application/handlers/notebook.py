from __future__ import absolute_import, print_function

import nbformat
from nbconvert import PythonExporter

from .code import CodeHandler

class NotebookHandler(CodeHandler):
    """ Run a notebook which modifies a Document

    Keywords:
        filename (str) : a path to a Jupyter notebook (".ipynb") file

    """

    _logger_text = "%s: call to %s() ignored when running notebooks with the 'bokeh' command."

    _origin = "Notebook"

    def __init__(self, *args, **kwargs):
        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to NotebookHandler')

        with open(kwargs['filename']) as f:
            nb = nbformat.read(f, nbformat.NO_CONVERT)
            exporter = PythonExporter()
            source, meta = exporter.from_notebook_node(nb)
            kwargs['source'] = source

        super(NotebookHandler, self).__init__(*args, **kwargs)