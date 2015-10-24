from __future__ import absolute_import

from .document import Document

import logging

log = logging.getLogger(__name__)

class Application(object):
    """An Application is a factory for Document instances"""

    def __init__(self):
        self._handlers = []

    # TODO (havocp) should this potentially create multiple documents?
    # or does multiple docs mean multiple Application?
    def create_document(self):
        """Loads a new document using the Application's handlers to fill it in."""
        doc = Document()
        for h in self._handlers:
            # TODO (havocp) we need to check the 'failed' flag on each handler
            # and build a composite error display.
            h.modify_document(doc)
            if h.failed:
                # TODO (havocp) this could be formatted a lot more nicely
                log.error("Error running application handler %r: %r %r ", h, h.error, h.error_detail)
        return doc

    def add(self, handler):
        """Add a handler to the pipeline used to initialize new documents."""
        self._handlers.append(handler)
