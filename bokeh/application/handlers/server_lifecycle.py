from __future__ import absolute_import, print_function

import codecs
import os

from .handler import Handler
from .code_runner import _CodeRunner

from bokeh.util.callback_manager import _check_callback

def _do_nothing(ignored):
    pass

class ServerLifecycleHandler(Handler):
    """ Load a script which contains server lifecycle callbacks. """

    def __init__(self, *args, **kwargs):
        super(ServerLifecycleHandler, self).__init__(*args, **kwargs)

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to ServerLifecycleHandler')
        filename = kwargs['filename']
        argv = kwargs.get('argv', [])

        source = codecs.open(filename, 'r', 'UTF-8').read()

        self._runner = _CodeRunner(source, filename, argv)

        self._on_server_loaded = _do_nothing
        self._on_server_unloaded = _do_nothing
        self._on_session_created = _do_nothing
        self._on_session_destroyed = _do_nothing

        if not self._runner.failed:
            # unlike ScriptHandler, we only load the module one time
            self._module = self._runner.new_module()

            def extract_callbacks():
                contents = self._module.__dict__
                if 'on_server_loaded' in contents:
                    self._on_server_loaded = contents['on_server_loaded']
                if 'on_server_unloaded' in contents:
                    self._on_server_unloaded = contents['on_server_unloaded']
                if 'on_session_created' in contents:
                    self._on_session_created = contents['on_session_created']
                if 'on_session_destroyed' in contents:
                    self._on_session_destroyed = contents['on_session_destroyed']

                _check_callback(self._on_server_loaded, ('server_context',), what="on_server_loaded")
                _check_callback(self._on_server_unloaded, ('server_context',), what="on_server_unloaded")
                _check_callback(self._on_session_created, ('session_context',), what="on_session_created")
                _check_callback(self._on_session_destroyed, ('session_context',), what="on_session_destroyed")

            self._runner.run(self._module, extract_callbacks)

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._runner.path))[0]

    def on_server_loaded(self, server_context):
        return self._on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        return self._on_server_unloaded(server_context)

    def on_session_created(self, session_context):
        return self._on_session_created(session_context)

    def on_session_destroyed(self, session_context):
        return self._on_session_destroyed(session_context)

    def modify_document(self, doc):
        # we could support a modify_document function, might be weird though.
        pass

    @property
    def failed(self):
        return self._runner.failed

    @property
    def error(self):
        return self._runner.error

    @property
    def error_detail(self):
        return self._runner.error_detail
