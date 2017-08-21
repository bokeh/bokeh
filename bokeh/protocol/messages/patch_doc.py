from __future__ import absolute_import

from json import loads
from ..message import Message
from . import register

@register
class patch_doc_1(Message):
    ''' Define the ``PATCH-DOC`` message (revision 1) for sending Document
    patch events between remote documents.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'events'     : <protocol document events>
            'references' : <model references>
        }

    '''

    msgtype  = 'PATCH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(patch_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, events, **metadata):
        ''' Create a ``PATCH-DOC`` message

        Args:
            events (list) :
                A list of patch events to apply to a document

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header()

        if not events:
            raise ValueError("PATCH-DOC message requires at least one event")
        document = events[0].document

        patch_json = document.create_json_patch_string(events)
        # this is a total hack, the need for it is because we have magic
        # type conversions in our BokehJSONEncoder which keep us from
        # easily generating non-string JSON.
        content = loads(patch_json)

        msg = cls(header, metadata, content)

        return msg

    def apply_to_document(self, doc, setter=None):
        '''

        '''
        doc.apply_json_patch(self.content, setter)
