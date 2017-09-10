from __future__ import absolute_import

from json import loads

from ...core.json_encoder import serialize_json
from ...document.util import references_json
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
    def create(cls, events, use_buffers=True, **metadata):
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

        docs = { event.document for event in events }
        if len(docs) != 1:
            raise ValueError("PATCH-DOC message configured with events for more than one document")

        # this roundtrip is fortunate, but is needed because there are type conversions
        # in BokehJSONEncoder which keep us from easily generating non-string JSON
        patch_json, buffers = process_document_events(events, use_buffers)
        content = loads(patch_json)

        msg = cls(header, metadata, content)

        for (header, payload) in buffers:
            msg.add_buffer(header, payload)

        return msg

    def apply_to_document(self, doc, setter=None):
        '''

        '''
        doc.apply_json_patch(self.content, setter)

def process_document_events(events, use_buffers=True):
    ''' Create a JSON string describing a patch to be applied as well as
    any optional buffers.

    Args:
      events : list of events to be translated into patches

    Returns:
      str, list :
        JSON string which can be applied to make the given updates to obj
        as well as any optional buffers

    '''

    json_events = []
    references = set()

    buffers = [] if use_buffers else None

    for event in events:
        json_events.append(event.generate(references, buffers))

    json = {
        'events'     : json_events,
        'references' : references_json(references),
    }

    return serialize_json(json), buffers if use_buffers else []
