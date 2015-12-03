from __future__ import absolute_import, print_function

class Handler(object):
    """Subtypes of Handler describe a way to modify a Document."""

    def __init__(self, *args, **kwargs):
        self._failed = False
        self._error = None
        self._error_detail = None

    def url_path(self):
        """Returns a default URL path if the spelling specified one."""
        return None

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

    # TODO (havocp) add a way for handlers to notify when a reload
    # is required (due to file change or whatever)
