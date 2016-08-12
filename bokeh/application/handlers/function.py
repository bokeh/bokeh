from __future__ import absolute_import, print_function

from .handler import Handler
from bokeh.util.callback_manager import _check_callback

class FunctionHandler(Handler):
    """ Run a function which modifies a Document """

    def __init__(self, func):
        super(FunctionHandler, self).__init__()
        _check_callback(func, ('doc',))
        self._func = func
        self._safe_to_fork = True

    def modify_document(self, doc):
        self._func(doc)
        self._safe_to_fork = False

    @property
    def safe_to_fork(self):
        return self._safe_to_fork
