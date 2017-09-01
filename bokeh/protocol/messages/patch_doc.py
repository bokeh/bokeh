from __future__ import absolute_import

from json import loads

from ...core.json_encoder import serialize_json
from ...document import Document
from ...model import collect_models
from ...protocol.events import (ColumnsPatchedEvent, ColumnsStreamedEvent, ModelChangedEvent,
                                RootAddedEvent, RootRemovedEvent, TitleChangedEvent)
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

        docs = { event.document for event in events }
        if len(docs) != 1:
            raise ValueError("PATCH-DOC message configured with events for more than one document")

        patch_json = create_json_patch_string(events)
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

def create_json_patch_string(events):
    ''' Create a JSON string describing a patch to be applied.

    Args:
      events : list of events to be translated into patches

    Returns:
      str :  JSON string which can be applied to make the given updates to obj

    '''

    references = set()
    json_events = []
    for event in events:

        if isinstance(event, ModelChangedEvent):
            if isinstance(event.hint, ColumnsStreamedEvent):
                json_events.append({ 'kind' : 'ColumnsStreamed',
                                     'column_source' : event.hint.column_source.ref,
                                     'data' : event.hint.data,
                                     'rollover' : event.hint.rollover })

            elif isinstance(event.hint, ColumnsPatchedEvent):
                json_events.append({ 'kind' : 'ColumnsPatched',
                                     'column_source' : event.hint.column_source.ref,
                                     'patches' : event.hint.patches })
            else:
                value = event.serializable_new

                # the new value is an object that may have
                # not-yet-in-the-remote-doc references, and may also
                # itself not be in the remote doc yet.  the remote may
                # already have some of the references, but
                # unfortunately we don't have an easy way to know
                # unless we were to check BEFORE the attr gets changed
                # (we need the old _all_models before setting the
                # property). So we have to send all the references the
                # remote could need, even though it could be inefficient.
                # If it turns out we need to fix this we could probably
                # do it by adding some complexity.
                value_refs = set(collect_models(value))

                # we know we don't want a whole new copy of the obj we're patching
                # unless it's also the new value
                if event.model != value:
                    value_refs.discard(event.model)
                references = references.union(value_refs)

                json_events.append({ 'kind' : 'ModelChanged',
                                     'model' : event.model.ref,
                                     'attr' : event.attr,
                                     'new' : value })
        elif isinstance(event, RootAddedEvent):
            references = references.union(event.model.references())
            json_events.append({ 'kind' : 'RootAdded',
                                 'model' : event.model.ref })
        elif isinstance(event, RootRemovedEvent):
            json_events.append({ 'kind' : 'RootRemoved',
                                 'model' : event.model.ref })
        elif isinstance(event, TitleChangedEvent):
            json_events.append({ 'kind' : 'TitleChanged',
                                 'title' : event.title })

    json = {
        'events'     : json_events,
        'references' : Document.references_json(references)
    }

    return serialize_json(json)
