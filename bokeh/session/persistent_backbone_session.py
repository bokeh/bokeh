""" Defines the base PlotSession and some example session types.
"""
from __future__ import absolute_import

import logging

from ..objects import PlotObject

logger = logging.getLogger(__file__)

class PersistentBackboneSession(object):

    @property
    def plotcontext(self):
        if hasattr(self, "_plotcontext"):
            return self._plotcontext
        else:
            return None

    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def get_ref(self, obj):
        return obj.get_ref()

    #------------------------------------------------------------------------
    # functions for loading json into models
    # we have 2 types of json data, if all the models are of one type, then
    # we just have a list of model attributes
    # otherwise, we have what we refer to as broadcast_json, which are of the form
    # {'type':typename, 'attributes' : attrs}
    #------------------------------------------------------------------------

    def load_attrs(self, typename, attrs, events='existing'):
        """converts attrs into broadcast_json, and then loads that
        """
        broadcast_attrs = [dict(type=typename, attributes=x) for x in attrs]
        return self.load_broadcast_attrs(broadcast_attrs, events=events)

    def load_broadcast_attrs(self, attrs, events='existing'):
        """loads broadcast attrs into models.
        events can be 'existing', or None. 'existing' means
        trigger events only for existing (not new objects).
        None means don't trigger any events.
        """
        models = []
        created = set()
        for attr in attrs:
            typename = attr['type']
            attr = attr['attributes']
            logger.debug('type: %s', typename)
            #logger.debug('attrs: %s', attr)
            _id = attr['id']
            if _id in self._models:
                m = self._models[_id]
                m._block_callbacks = True
                m.load_json(attr, instance=m)
            else:
                cls = PlotObject.get_class(typename)
                m = cls.load_json(attr)
                if m is None:
                    raise RuntimeError('Error loading object from JSON')
                self.add(m)
                created.add(m)
            models.append(m)
        for m in models:
            m.finalize(self._models)
        if events is None:
            self.clear_callback_queue(models)
        elif events is 'existing':
            non_created = [x for x in models if x not in created]
            self.execute_callback_queue(models=non_created)
            self.clear_callback_queue(models=created)
        self.enable_callbacks(models)
        return models

    def attrs(self, to_store):
        """converts to_store (list of models) into attributes
        """
        attrs = []
        for m in to_store:
            attr = m.vm_serialize()
            attr['doc'] = self.docid
            attr['id'] = m._id
            attrs.append(attr)
        return attrs

    def broadcast_attrs(self, to_store):
        """converts to_store(list of models) into broadcast attributes
        """
        models = []
        for m in to_store:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            # FIXME: Is it really necessary to add the id and doc to the
            # attributes dict? It shows up in the bbclient-based JSON
            # serializations, but I don't understand why it's necessary.
            ref["attributes"].update({"doc": self.docid})
            models.append(ref)
        return models

    #------------------------------------------------------------------------
    # Storing models
    #------------------------------------------------------------------------

    def store_obj(self, obj, ref=None):
        """store single object
        """
        return self.store_objs([obj])

    def store_objs(self, to_store):
        """store list of objects
        """
        models = self.broadcast_attrs(to_store)
        self.store_broadcast_attrs(models)
        for m in to_store:
            m._dirty = False

    def store_all(self):
        """store all dirty models, by calling store_objs
        """
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_dirty') and x._dirty]
        self.store_objs(to_store)
        return to_store

    def store_broadcast_attrs(self, attrs):
        """stores broadcast attrs on the server, persistent store, etc..
        """
        raise NotImplementedError

    #------------------------------------------------------------------------
    # Loading models
    #------------------------------------------------------------------------

    def load_all(self, asdict=False):
        """
        normally:
        you get back a list of models, and they are loaded into this session
        usually in self._models

        if asdict is True:
        you get a list of broadcast_json.  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError

    def load_type(self, typename, asdict=False):
        """ loads all objects of a given type
        normally:
        you get back a list of models, and they are loaded into this session
        usually in self._models

        if asdict is True:
        you get a list of json (not broadcast_json).  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError

    def load_obj(self, ref, asdict=False):
        """ loads one objects of matching the reference
        normally:
        you get a model, and it is loaded into this session

        if asdict is True:
        you get the json of the model.  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError

    #------------------------------------------------------------------------
    # Loading callbacks
    #------------------------------------------------------------------------

    def callbacks_json(self, to_store):
        """extracts callbacks  that need to be stored from
        a list of models
        """
        all_data = []
        for m in to_store:
            data = self.get_ref(m)
            data['callbacks'] = m._callbacks
            all_data.append(data)
        return all_data

    def load_callbacks_json(self, callback_json):
        """given a list of callback specifications,
        binds existing models with those callbacks
        """
        for data in callback_json:
            m = self._models[data['id']]
            m._callbacks = {}
            for attrname, callbacks in data['callbacks'].items():
                for callback in callbacks:
                    obj = self._models[callback['obj']['id']]
                    callbackname = callback['callbackname']
                    m.on_change(attrname, obj, callbackname)

    def load_all_callbacks(self, get_json=False):
        """retrieves callback specification for all models
        and loads them into the models.

        get_json = return json of callbacks, rather than
        loading them into models
        """
        raise NotImplementedError

    #------------------------------------------------------------------------
    # Storing callbacks
    #------------------------------------------------------------------------

    def store_callbacks(self, to_store):
        """store callbacks from a bunch of models
        """
        raise NotImplementedError

    def store_all_callbacks(self):
        """extract callbacks from models, and then store them using
        self.store_callbacks
        """
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_callbacks_dirty') and x._callbacks_dirty]
        self.store_callbacks(to_store)
        return to_store

    #------------------------------------------------------------------------
    # Managing callbacks
    #------------------------------------------------------------------------

    def disable_callbacks(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            m._block_callbacks = True

    def enable_callbacks(self, models=None):
        if models is None:
            models = self._models.values()

        for m in models:
            m._block_callbacks = False

    def clear_callback_queue(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            del m._callback_queue[:]

    def execute_callback_queue(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            for cb in m._callback_queue:
                m._trigger(*cb)
            del m._callback_queue[:]

    #------------------------------------------------------------------------
    # Deleting callbacks
    #------------------------------------------------------------------------

    def del_obj(self, obj):
        self.del_objs([obj])

    def del_objs(self, to_del):
        raise NotImplementedError
