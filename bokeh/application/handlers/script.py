''' Provide a Bokeh Application Handler to build up documents by running
the code from Python script (``.py``) files.

This handler is configured with the filename of a Python module. When a
Bokeh application calls ``modify_doc``, the contents of the module are run to
process a new Document for a session. When the script code is executed, the
Document being modified will be available as ``curdoc``, and any optionally
provided ``args`` will be available as ``sys.argv``.

As an example, consider the following Python module ``myapp.py``

.. code-block:: python

    # myapp.py

    import sys

    from bokeh.io import cudoc
    from bokeh.plotting import figure

    p = figure(x_range=(10, 10), y_range=(10, 10), title=sys.argv[1])

    curdoc().add_root(p)

The a ``ScriptHandler`` configured with this script will modify new Bokeh
Documents by adding an empty plot with a title taken from ``args``.

'''
from __future__ import absolute_import, print_function

from .code import CodeHandler
import io

class ScriptHandler(CodeHandler):
    ''' Modify Bokeh documents by executing code from Python scripts.

    '''

    _logger_text = "%s: call to %s() ignored when running scripts with the 'bokeh' command."

    _origin = "Script"

    def __init__(self, *args, **kwargs):
        '''

        Keywords:
            filename (str) : a path to a Python source (".py") file

        '''
        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to ScriptHandler')
        filename = kwargs['filename']

        with io.open(filename, 'r', encoding='utf-8') as f:
            kwargs['source'] = f.read()

        super(ScriptHandler, self).__init__(*args, **kwargs)
