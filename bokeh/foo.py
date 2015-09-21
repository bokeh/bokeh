
from collections import defaultdict
from bokeh.plot_object import HasProps
from bokeh.properties import Any, Dict, String

import inspect
import types

class BokehNamespace(object):

    def __contains__(self, key):
        return key in self._data

    def __getitem__(self, key):
        return self._data[key]

    def __setitem__(self, key, value):
        # TODO (bev) add on_change
        self._data[key] = value

    def __delitem__(self, key):
        # TODO (bev) remove on_change
        del self._data[key]


class Vars(HasProps, BokehNamespace):
    _data = Dict(String, Any)

class Stores(HasProps, BokehNamespace):
    _data = Dict(String, Any) # TODO (bev) data stores



class CallbackManager(object):
    ''' A mixin class to provide an interface for registering and
    triggering callbacks.

    '''
    def __init__(self, *args, **kw):
        super(CallbackManager, self).__init__(*args, **kw)
        self._callbacks = dict()

    def on_change(self, attr, *callbacks):
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            callback (callable) : a callback function to register

        Returns:
            None

        '''
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:

            if callback in _callbacks: continue

            if not callable(callback):
                raise ValueError("Callbacks must be callables")

            argspec = inspect.getargspec(callback)
            if isinstance(callback, types.MethodType) and len(argspec.args) != 4:
                raise ValueError("Methods passed as callbacks must have signature method(self, attr, old, new), got method%s" % inspect.formatargspec(*argspec))
            if isinstance(callback, types.FunctionType) and len(argspec.args) != 3:
                raise ValueError("Functions passed as callbacks must have signature func(attr, old, new), got func%s" % inspect.formatargspec(*argspec))

            _callbacks.append(callback)

    def trigger(self, attr, old, new):
        ''' Trigger callbacks for ``attr`` on this object.

        Args:
            attr (str) :
            old (object) :
            new (object) :

        Returns:
            None

        '''
        if self._document:
            self._document.notify_change(self, attr, old, new)
        callbacks = self._callbacks.get(attr)
        if callbacks:
            for callback in callbacks:
                callback(self, attr, old, new)


class Document(object):

    def __init__(self):
        self._roots = set()

        #self._vars = Vars()     # TODO (bev) later
        #self._stores = Stores() # TODO (bev) later

        self._all_model_counts = defaultdict(int)
        self._all_models = dict()

    @property
    def roots(self):
        return set(self._roots)

    def add_root(self, model):
        ''' Add a model as a root model to this Document.

        Any changes to this model (including to other models referred to
        by it) will trigger "on_change" callbacks registered on this
        Document.

        '''
        if model in self._roots:
            return
        self._roots.insert(model)
        model.attach_document(self)

    def remove_root(self, model):
        ''' Remove a model as root model from this Document.

        Changes to this model may still trigger "on_change" callbacks
        on this Document, if the model is still referred to by other
        root models.
        '''
        if model not in self._roots:
            return # TODO (bev) ValueError?
        self._roots.remove(model)
        model.detach_document()

    # vars

    @property
    def vars(self):
        return self._vars

    # stores

    @property
    def stores(self):
        return self._stores

    def on_change(self, *callbacks):
        ''' Invoke callback if any PlotObject in the document changes

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            if not callable(callback):
                raise ValueError("Callbacks must be callables")

            argspec = inspect.getargspec(callback)
            if isinstance(callback, types.MethodType) and len(argspec.args) != 6:
                raise ValueError("Methods passed as callbacks must have signature method(self, doc, model, attr, old, new), got method%s" % inspect.formatargspec(*argspec))
            if isinstance(callback, types.FunctionType) and len(argspec.args) != 5:
                raise ValueError("Functions passed as callbacks must have signature func(doc, model, attr, old, new), got func%s" % inspect.formatargspec(*argspec))


    def _notify_change(self, model, attr, old, new):
        ''' Called by PlotObject when it changes

        '''
        for cb in self._callbacks:
            cb(self, model, attr, old, new)

    def _notify_attach(self, model):
        self._all_model_counts[model.id] += 1
        self._all_models[model.id] = model

    def _notify_detach(self, model):
        ''' Called by PlotObject once for each time the PlotObject is
        removed from the object graph. Returns True if the document is still
        attached because refcount isn't 0

        '''
        self._all_model_counts[model.id] -= 1
        refcount = self._all_model_counts[model.id]
        if refcount == 0:
            del self._all_models[model.id]
            del self._all_model_counts[model.id]
        return refcount


