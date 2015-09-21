""" The document module provides the Document class, which is a container
for all Bokeh objects that mustbe reflected to the client side BokehJS
library.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

from collections import defaultdict
from inspect import formatargspec, getargspec
from types import FunctionType

class Document(object):

    def __init__(self):
        self._roots = set()

        # TODO (bev) add vars, stores

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

    def on_change(self, *callbacks):
        ''' Invoke callback if any PlotObject in the document changes

        '''
        for callback in callbacks:

            if callback in self._callbacks: continue

            if not callable(callback):
                raise ValueError("Callbacks must be callables")

            argspec = getargspec(callback)
            formatted_args = formatargspec(*argspec)
            fargs = ('doc', 'model', 'attr', 'old', 'new')
            margs = ('self',) + fargs
            if isinstance(callback, FunctionType):
                if len(argspec.args) != len(fargs):
                    raise ValueError("Callbacks functions must have signature func(%s), got func%s" % (", ".join(fargs), formatted_args))

            # testing against MethodType misses callable objects, assume everything
            # else is a normal method, or __call__ here
            elif len(argspec.args) != len(margs):
                raise ValueError("Callbacks methods must have signature method(%s), got method%s" % (", ".join(margs), formatted_args))


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
        removed from the object graph. Returns the attach_count

        '''
        self._all_model_counts[model.id] -= 1
        attach_count = self._all_model_counts[model.id]
        if attach_count == 0:
            del self._all_models[model.id]
            del self._all_model_counts[model.id]
        return attach_count


