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

from bokeh.util.dependencies import import_required, import_optional

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
        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to NotebookHandler')
        filename = kwargs['filename']

        preprocessors = self._preprocessors()
        try:
            source, meta = self.export_python(filename, preprocessors)
        except:
            # If any preprocessors resulted in an exception, convert without them
            source, meta = self.export_python(filename, preprocessors=[])

        kwargs['source'] = source
        super(NotebookHandler, self).__init__(*args, **kwargs)


    def export_python(self, filename, preprocessors):
        '''
        Given an .ipynb notebook, convert to plain Python syntax using
        the supplied list of nbconvert preprocessors.
        '''
        nbformat = import_required('nbformat', 'The Bokeh notebook application handler requires Jupyter Notebook to be installed.')
        nbconvert = import_required('nbconvert', 'The Bokeh notebook application handler requires Jupyter Notebook to be installed.')

        with open(filename) as f:
            nb = nbformat.read(f, nbformat.NO_CONVERT)
            exporter = nbconvert.PythonExporter()
            for preprocessor in preprocessors:
                exporter.register_preprocessor(preprocessor)
            return exporter.from_notebook_node(nb)


    def _preprocessors(self):
        '''
        Returns a list of suitable nbconvert preprocessors. Attempts to
        apply HoloViews preprocessors that convert HoloViews magics to
        pure Python equivalents.
        '''
        holoviews = import_optional('holoviews')
        if holoviews is None:
            return []

        elif holoviews.__version__.release < (1,8,0):
            return []
        try:
            from holoviews.ipython.preprocessors import (OptsMagicProcessor,
                                                         OutputMagicProcessor,
                                                         StripMagicsProcessor)
            return [OptsMagicProcessor(), OutputMagicProcessor(), StripMagicsProcessor()]
        except:
            return []
