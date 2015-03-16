""" The document module provides the Document class, which is a container
for all Bokeh objects that mustbe reflected to the client side BokehJS
library.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

import uuid

from . import _glyph_functions as gf
from .exceptions import DataIntegrityException
from .models import PlotContext
from .plot_object import PlotObject
from .plotting_helpers import _new_xy_plot
from .util.serialization import dump

class Document(object):
    """ The Document class is a container to hold Bokeh objects that
    requires reflecting to the client BokehJS library.

    Attributes:
        autoadd (bool) :
        autostore (bool) :
        context (PlotContext) : the plot context for this document
        ref (str) : reference to the plot context for this document

    """

    def __init__(self, json_objs=None):
        self._current_plot = None
        self._hold = False
        self._models = {}

        self.docid = str(uuid.uuid4())
        self.autostore = True
        self.autoadd = True

        if json_objs:
            self.load(*json_objs, dirty=False)

        # must init context after loading JSON objs
        self._init_context()

    # properties

    @property
    def autoadd(self):
        return self._autoadd

    @autoadd.setter
    def autoadd(self, value):
        if not isinstance(value, bool):
            raise TypeError("'autoadd' must be True or False")
        self._autoadd = value

    @property
    def autostore(self):
        return self._autostore

    @autostore.setter
    def autostore(self, value):
        if not isinstance(value, bool):
            raise TypeError("'autostore' must be True or False")
        self._autostore = value

    @property
    def context(self):
        return self._context

    @context.setter
    def context(self, value):
        if not isinstance(value, PlotContext):
            raise TypeError('Document.context may only be assigned to PlotContext objects')
        try:
            if self._context:
                del self._models[self._context._id]
        except AttributeError:
            pass
        other_pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        other_pcs = [x for x in other_pcs if x._id != value._id]
        if len(other_pcs) != 0:
            raise DataIntegrityException("too many plot contexts found")
        self._add(value)
        self._add(*value.references())
        self._context = value

    @property
    def ref(self):
        return self._context.ref

    def clear(self):
        """ Remove all plots from this `Document`

        Returns:
            None

        """
        self.context.children = []
        context = self.context
        self._models = {}
        self._add(context)

    # functions for adding objects to documents

    def add(self, *objects):
        """ Add top-level objects (and any references they hold to sub-objects)
        to this Document.

        .. warning::
            This function should only be called on top level objects such
            as Plot, and Layout containers.

        Args:
            *objects (PlotObject) : objects to add to the Document

        Returns:
            None

        """
        for obj in objects:
            if obj not in self.context.children:
                self.context.children.append(obj)
                self.context._dirty = True
            self._add(*obj.references())

    def _add_all(self):
        # fix for crossfilter - we should take this out soon, and just
        # ensure that the entire graph is added before dump
        for obj in self.context.references():
            self._add(obj)
        self.prune()

    # functions for turning json objects into json models

    def load(self, *objs, **kwargs):
        """ Convert json objects to models and load them into this Document.

        Args:
            *objs (str) : json object strings to convert

        Keyword Args:
            Two optional keyword arguments are stripped from *kwargs:

            existing (str) : what objects to trigger events on (default: 'existing')
                valid values are:
                * 'none' trigger no events
                * 'all' trigger events on all models
                * 'new' trigger events only on new models
                * 'existing' trigger events on already existing models
            dirty (bool) : whether to mark models as dirty (default: False)

        Returns:
            set[Plotobject] : models loaded from json

        """
        events = kwargs.pop('events', 'existing')
        if events not in ['all', 'none', 'new', 'existing']:
            raise ValueError(
                "Invalid value for events: '%s', valid values are: 'all', 'none', 'new', 'existing'" % events
            )

        dirty = kwargs.pop('dirty', False)

        all_models = set()
        new_models = set()

        for obj in objs:
            obj_id = obj['attributes']['id'] # XXX: obj['id']
            obj_type = obj.get('subtype', obj['type'])
            obj_attrs = obj['attributes']

            if "doc" in obj_attrs:
                del obj_attrs["doc"]

            if obj_id in self._models:
                model = self._models[obj_id]
                model._block_callbacks = True
                model.load_json(obj_attrs, instance=model)
            else:
                cls = PlotObject.get_class(obj_type)
                model = cls.load_json(obj_attrs)
                if model is None:
                    raise RuntimeError('Error loading model from JSON (type: %s, id: %s)' % (obj_type, obj_id))
                self._add(model)
                new_models.add(model)

            all_models.add(model)

        for m in all_models:
            props = m.finalize(self._models)
            m.update(**props)
            m.setup_events()

        if events == 'all':
            self.execute_callback_queue(all_models)
            self.clear_callback_queue(all_models)

        if events == 'none':
            self.clear_callback_queue(all_models)

        if events == 'new':
            self.execute_callback_queue(new_models)
            self.clear_callback_queue(new_models)

        elif events == 'existing':
            self.execute_callback_queue(all_models-new_models)
            self.clear_callback_queue(new_models)

        self.enable_callbacks(all_models)

        for m in all_models:
            m._dirty = dirty

        return all_models

    def dump(self, *models):
        """ Convert models to json objects.

        Args:
            *models (PlotObject) : models to convert to json objects
                If models is empty, ``dump`` converts all models in this d
                ocument.

        Return:
            dict : json objects

        """
        self._add(*self.context.references())
        if not models:
            models = self._models.values()
        json = dump(models, docid=self.docid)
        return json

    #------------------------------------------------------------------------
    # Managing callbacks
    #------------------------------------------------------------------------

    def disable_callbacks(self, models=None):
        """ Disable callbacks on given models.

        Args:
            models (seq[PlotObject], optional) : models to disable callbacks for (default: None)
                If models is None, disables callbacks on all models in
                this Document.

        Returns:
            None

        """
        if models is None:
            models = self._models.values()
        for m in models:
            m._block_callbacks = True

    def enable_callbacks(self, models=None):
        """ Enable callbacks on given models.

        Args:
            models (seq[PlotObject], optional) : models to enable callbacks for (default: None)
                If models is None, enables callbacks on all models in
                this Document.

        Returns:
            None

        """
        if models is None:
            models = self._models.values()

        for m in models:
            m._block_callbacks = False

    def clear_callback_queue(self, models=None):
        """ Clear the callback queue on given models.

        Args:
            models (seq[PlotObject], optional) : models to clear callbacks for (default: None)
                If models is None, clears callback queue on all models
                in this Document.

        Returns:
            None

        """
        if models is None:
            models = self._models.values()
        for m in models:
            del m._callback_queue[:]

    def execute_callback_queue(self, models=None):
        """ Execute all queued callbacks on the given models.

        Args:
            models (seq[PlotObject], optional) : models to execute callbacks for (default: None)
                If models is None, executes the callback queue on all models
                in this Document.

        Returns:
            None

        """
        if models is None:
            models = self._models.values()
        for m in models:
            for cb in m._callback_queue:
                m._trigger(*cb)
            del m._callback_queue[:]

    #------------------------------------------------------------------------
    # Helper functions
    #------------------------------------------------------------------------

    def _add(self, *objects):
        """ Adds objects to this document.

        """
        for obj in objects:
            self._models[obj._id] = obj

    def _init_context(self):
        """ Initialize self.context appropriately.

        If no plotcontext exists, creates one. If one exists in self._modes
        (because we are on the server) re-use it.

        """
        pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        if len(pcs) == 0:
            self.context = PlotContext()
        elif len(pcs) == 1:
            self._context = pcs[0]
            self._add(self._context)
        else:
            raise DataIntegrityException("too many plot contexts found")

    def merge(self, json_objs):
        """Merge's json objects from another document into this one
        using the plot context id from the json_objs which are passed in
        children from this document are merged with the children from
        the json that is passed in

        Args:
            json_objs : json objects from session.pull()

        Returns:
            None
        """
        plot_contexts = [x for x in json_objs if x['type'] == 'PlotContext']
        other_objects = [x for x in json_objs if x['type'] != 'PlotContext']
        plot_context_json = plot_contexts[0]
        children = set([x['id'] for x in plot_context_json['attributes']['children']])
        for child in self.context.children:
            ref = child.ref
            if ref['id'] not in children:
                plot_context_json['attributes']['children'].append(ref)
        self.load(plot_context_json, *other_objects)
        # set the new Plot Context
        self.context = self._models[plot_context_json['id']]

    def prune(self):
        """Remove all models that are not in the plot context
        """
        all_models = self.context.references()
        to_keep = set([x._id for x in all_models])
        to_delete = set(self._models.keys()) - to_keep
        to_delete_objs = []
        for k in to_delete:
            to_delete_objs.append(self._models.pop(k))
        return to_delete_objs
