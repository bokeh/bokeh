from __future__ import absolute_import, print_function

from .handler import Handler
from .script import ScriptHandler
import os

class DirectoryHandler(Handler):
    """Load an application directory which modifies a Document"""

    def __init__(self, *args, **kwargs):
        super(DirectoryHandler, self).__init__(*args, **kwargs)
        # for now this is simply a wrapper around ScriptHandler
        # but the intent is to add more stuff over time of course
        if 'filename' in kwargs:
            src_path = kwargs['filename']
            mainpy = os.path.join(src_path, 'main.py')
            if not os.path.exists(mainpy):
                raise ValueError("No 'main.py' in %s" % (src_path))
            self._path = src_path
            self._mainpy = mainpy
            self._mainpy_handler = ScriptHandler(filename=self._mainpy)
        else:
            raise ValueError('Must pass a filename to ScriptHandler')

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.basename(self._path)

    def modify_document(self, doc):
        if self.failed:
            return
        self._mainpy_handler.modify_document(doc)

    @property
    def failed(self):
        return self._mainpy_handler.failed

    @property
    def error(self):
        return self._mainpy_handler.error

    @property
    def error_detail(self):
        return self._mainpy_handler.error_detail
