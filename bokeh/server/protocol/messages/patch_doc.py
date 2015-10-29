'''

'''
from __future__ import absolute_import

from bokeh.plot_object import PlotObject
from bokeh.document import Document, ModelChangedEvent, RootAddedEvent, RootRemovedEvent
from json import loads
from ...exceptions import ProtocolError
from ..message import Message
from . import register

@register
class patch_doc_1(Message):
    '''

    '''

    msgtype  = 'PATCH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(patch_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, events, **metadata):
        '''

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

    def should_suppress_on_change(self, event):
        '''Checks whether the patch caused an on_change for the given event'''
        if isinstance(event, ModelChangedEvent):
            for event_json in self.content['events']:
                if event_json['kind'] == 'ModelChanged' and \
                   event_json['model']['id'] == event.model._id and \
                   event_json['attr'] == event.attr:
                    patch_new = event_json['new']
                    if isinstance(event.new, PlotObject):
                        if patch_new is not None and 'id' in patch_new and patch_new['id'] == event.new._id:
                            return True
                    else:
                        if patch_new == event.new:
                            return True
        elif isinstance(event, RootAddedEvent):
            for event_json in self.content['events']:
                if event_json['kind'] == 'RootAdded' and \
                   event_json['model']['id'] == event.model._id:
                    return True
        elif isinstance(event, RootRemovedEvent):
            for event_json in self.content['events']:
                if event_json['kind'] == 'RootRemoved' and \
                   event_json['model']['id'] == event.model._id:
                    return True
        else:
            raise RuntimeError("should_suppress_on_change needs to handle " + repr(event))

        return False

    def apply_to_document(self, doc):
        doc.apply_json_patch(self.content)
