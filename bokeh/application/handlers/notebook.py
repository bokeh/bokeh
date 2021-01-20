#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Bokeh Application Handler to build up documents by running
the code from Jupyter notebook (``.ipynb``) files.

This handler is configured with the filename of a Jupyter notebook. When a
Bokeh application calls ``modify_doc``, the code from all the notebook cells
is collected and executed to process a new Document for a session. When the
notebook code is executed, the Document being modified will be available as
``curdoc``, and any optionally provided ``args`` will be available as
``sys.argv``.

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
import re

# Bokeh imports
from ...util.dependencies import import_required
from .code import CodeHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'NotebookHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

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


        class StripMagicsProcessor(nbconvert.preprocessors.Preprocessor):
            """
            Preprocessor to convert notebooks to Python source while stripping
            out all magics (i.e IPython specific syntax).
            """

            _magic_pattern = re.compile(r'^\s*(?P<magic>%%\w\w+)($|(\s+))')

            def strip_magics(self, source):
                """
                Given the source of a cell, filter out all cell and line magics.
                """
                filtered=[]
                for line in source.splitlines():
                    match = self._magic_pattern.match(line)
                    if match is None:
                        filtered.append(line)
                    else:
                        msg = 'Stripping out IPython magic {magic} in code cell {cell}'
                        message = msg.format(cell=self._cell_counter, magic=match.group('magic'))
                        log.warning(message)
                return '\n'.join(filtered)

            def preprocess_cell(self, cell, resources, index):
                if cell['cell_type'] == 'code':
                    self._cell_counter += 1
                    cell['source'] = self.strip_magics(cell['source'])
                return cell, resources

            def __call__(self, nb, resources):
                self._cell_counter = 0
                return self.preprocess(nb,resources)

        preprocessors=[StripMagicsProcessor()]
        filename = kwargs['filename']

        with open(filename, encoding="utf-8") as f:
            nb = nbformat.read(f, nbformat.NO_CONVERT)
            exporter = nbconvert.PythonExporter()

            for preprocessor in preprocessors:
                exporter.register_preprocessor(preprocessor)

            source, _ = exporter.from_notebook_node(nb)
            source = source.replace('get_ipython().run_line_magic', '')
            source = source.replace('get_ipython().magic', '')

            kwargs['source'] = source

        super().__init__(*args, **kwargs)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
