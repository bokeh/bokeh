""" Defines the base JSON Session type
"""
from __future__ import absolute_import

import logging
import uuid
from .. import protocol
from ..objects import PlotObject, recursively_traverse_plot_object
from .session import Session

logger = logging.getLogger(__file__)

class BaseJSONSession(Session):

    def __init__(self, plot=None):
        super(BaseJSONSession, self).__init__(plot=plot)
        self.PlotObjectEncoder = type("PlotObjectEncoder", (self._PlotObjectEncoder,), {"session": self})

    #------------------------------------------------------------------------
    # Serialization
    #------------------------------------------------------------------------

    class _PlotObjectEncoder(protocol.NumpyJSONEncoder):
        """ Helper class we'll use to encode PlotObjects

        #hugo - I don't think we should use the json encoder anymore to do
        this.  It introduces an asymmetry in our operations, because
        while you can use this mechanism to serialize, you cannot use
        this mechanism to deserialize because we need 2 stage deserialization
        in order to resolve references
        """
        session = None

        def default(self, obj):
            if isinstance(obj, PlotObject):
                return self.session.get_ref(obj)
            else:
                return protocol.NumpyJSONEncoder.default(self, obj)

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

        all = set(to_convert)
        for model in to_convert:
            children = recursively_traverse_plot_object(model)
            all.update(children)

        models = []

        for model in all:
            ref = self.get_ref(model)
            ref["attributes"] = model.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        return models

    def serialize_models(self, objects=None, **jsonkwargs):
        return self.serialize(self.convert_models(objects), **jsonkwargs)
