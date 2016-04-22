from __future__ import absolute_import, print_function

class Handler(object):
    """Subtypes of Handler describe a way to modify a Document."""

    def __init__(self, *args, **kwargs):
        self._failed = False
        self._error = None
        self._error_detail = None
        self._static = None

    def url_path(self):
        """Returns a default URL path if the spelling specified one."""
        return None

    def static_path(self):
        """Returns a path to app-specific static resources, if applicable."""
        if self.failed:
            return None
        else:
            return self._static

    def modify_document(self, doc):
        """Modifies the application document however the spelling specifies."""
        pass

    @property
    def failed(self):
        """True if the handler failed to modify the doc"""
        return self._failed

    @property
    def error(self):
        """Error message if the handler failed"""
        return self._error

    @property
    def error_detail(self):
        """Traceback or other details if the handler failed"""
        return self._error_detail

    def on_server_loaded(self, server_context):
        pass

    def on_server_unloaded(self, server_context):
        pass

    def on_session_created(self, session_context):
        pass

    def on_session_destroyed(self, session_context):
        pass
