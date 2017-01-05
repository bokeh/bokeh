from __future__ import absolute_import, print_function

from .code import CodeHandler

class ScriptHandler(CodeHandler):
    """ Run a script which modifies a Document

    Keywords:
        filename (str) : a path to a Python source (".py") file

    """

    _logger_text = "%s: call to %s() ignored when running scripts with the 'bokeh' command."

    _origin = "Script"

    def __init__(self, *args, **kwargs):
        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to ScriptHandler')
        filename = kwargs['filename']

        with open(filename, 'r') as f:
            kwargs['source'] = f.read()

        super(ScriptHandler, self).__init__(*args, **kwargs)
