from __future__ import absolute_import

from .document import Document

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
            h.modify_document(doc)
        return doc

    def add(self, handler):
        """Add a handler to the pipeline used to initialize new documents."""
        self._handlers.append(handler)
