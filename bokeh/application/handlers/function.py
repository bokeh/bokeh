from __future__ import absolute_import, print_function

from .handler import Handler
from bokeh.util.callback_manager import _check_callback

class FunctionHandler(Handler):
    """Run a function which modifies a Document"""

    def __init__(self, func):
        super(FunctionHandler, self).__init__()
        _check_callback(func, ('doc',))
        self._func = func

    def modify_document(self, doc):
        self._func(doc)
