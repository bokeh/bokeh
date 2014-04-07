""" Defines the base JSON Session type
"""
from __future__ import absolute_import

import logging
import uuid
from .. import protocol, settings
from ..objects import PlotObject, HasProps
from .session import Session

logger = logging.getLogger(__file__)

class _PlotObjectEncoder(protocol.BokehJSONEncoder):
    """ Helper class we'll use to encode PlotObjects

    #hugo - I don't think we should use the json encoder anymore to do
    this.  It introduces an asymmetry in our operations, because
    while you can use this mechanism to serialize, you cannot use
    this mechanism to deserialize because we need 2 stage deserialization
    in order to resolve references
    """
    session = None

    @classmethod
    def with_session(cls, session):
        return type("PlotObjectEncoder", (_PlotObjectEncoder,), {"session": session})

    def default(self, obj):
        if isinstance(obj, PlotObject):
            return self.session.get_ref(obj)
        elif isinstance(obj, HasProps):
            return obj.to_dict()
        else:
            return super(_PlotObjectEncoder, self).default(obj)

class BaseJSONSession(Session):

    def __init__(self, plot=None):
        super(BaseJSONSession, self).__init__(plot=plot)
        self.PlotObjectEncoder = _PlotObjectEncoder.with_session(self)

    #------------------------------------------------------------------------
    # Serialization
    #------------------------------------------------------------------------

    def get_ref(self, obj):
        return obj.get_ref()

    def make_id(self):
        return str(uuid.uuid4())

    def serialize(self, obj, **jsonkwargs):
        """ Returns a string representing the JSON encoded object.
        References to other objects/instances is ended by a "ref"
        has encoding the type and UUID of the object.

        For all HTML sessions, the serialization protocol is JSON.
        How we produce references is actually more involved, because
        it may differ between server-based models versus embedded.
        """
        return protocol.serialize_json(obj, encoder=self.PlotObjectEncoder, **jsonkwargs)

    def convert_models(self, to_convert=None):
        """ Manually convert our top-level models into dicts, before handing
        them in to the JSON encoder. We don't want to embed the call to
        ``vm_serialize()`` into the ``PlotObjectEncoder``, because that would
        cause all the attributes to be duplicated multiple times.
        """
        if to_convert is None:
            to_convert = self._models.values()

        models = []

        for obj in PlotObject.collect_plot_objects(*to_convert):
            ref = self.get_ref(obj)
            ref["attributes"] = obj.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        return models

    def serialize_models(self, objects=None, pretty=False):
        indent = 4 if settings.pretty(pretty) else None
        return self.serialize(self.convert_models(objects), indent=indent)
