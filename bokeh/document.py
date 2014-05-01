""" Defines the Document type
"""
from __future__ import absolute_import

import copy
import logging
import uuid

from . import _glyph_functions as gf
from .objects import PlotContext
from .properties import HasProps
from .plot_object import PlotObject
from .plotting_helpers import _new_xy_plot
from .utils import json_apply

logger = logging.getLogger(__file__)

class Document(object):

    def __init__(self, json_objs=None):
        self._current_plot = None
        self._next_figure_kwargs = dict()
        self._hold = False
        self._autostore = True
        self._autoadd = True
        self._models = {}
        self.docid = str(uuid.uuid4())
        self._plotcontext = None
        if json_objs:
            self.load(*json_objs, dirty=False)
        self.set_context()

    def get_context(self):
        return self._plotcontext

    def get_context_ref(self):
        return get_ref(self._plotcontext)

    def set_context(self, plotcontext=None):
        """finds the plot context and sets it
        """
        pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        if plotcontext:
            assert len(pcs) == 0, "You already have a plot context, must unset it"
            self._plotcontext = plotcontext
            self._add(self._plotcontext)
        else:
            if len(pcs) == 1:
                logger.debug("setting plot context")
                self._plotcontext = pcs[0]
            elif len(pcs) == 0:
                logger.debug("no plot context found, creating one")
                self._plotcontext = PlotContext()
                self._add(self._plotcontext)
            else:
                logger.debug("too many plot context found, there can be only one")

    def unset_context(self):
        if self._plotcontext:
            self.remove(self._plotcontext)
            self._plotcontext = None

    def __enter__(self):
        return self

    def __exit__(self, e_ty, e_val, e_tb):
        pass

    def autoadd(self, value=True):
        self._autoadd = value

    def autostore(self, value=True):
        self._autostore = value

    def hold(self, value=True):
        ''' Set the hold value for this Document.

        Args:
            value (bool, optional) : whether hold should be turned on or off (default: True)

        Returns:
            None

        '''
        self._hold = value

    def figure(self, **kwargs):
        ''' Create a new figure for the next rendering.

        Returns:
            None

        '''
        self._current_plot = None
        self._next_figure_kwargs = kwargs

    def curplot(self):
        ''' Return the current plot of this Document.

        The "current plot" is the plot that is acted on by all the
        rendering methods, e.g.``doc.circle(...)`` will render a
        circle on the current plot.

        Returns:
            plot : the current plot_kwargs

        '''
        return self._current_plot;

    annular_wedge     = gf.annular_wedge
    annulus           = gf.annulus
    arc               = gf.arc
    asterisk          = gf.asterisk
    bezier            = gf.bezier
    circle            = gf.circle
    circle_cross      = gf.circle_cross
    circle_x          = gf.circle_x
    cross             = gf.cross
    diamond           = gf.diamond
    diamond_cross     = gf.diamond_cross
    image             = gf.image
    image_rgba        = gf.image_rgba
    image_url         = gf.image_url
    inverted_triangle = gf.inverted_triangle
    line              = gf.line
    multi_line        = gf.multi_line
    oval              = gf.oval
    patch             = gf.patch
    patches           = gf.patches
    quad              = gf.quad
    quadratic         = gf.quadratic
    ray               = gf.ray
    rect              = gf.rect
    segment           = gf.segment
    square            = gf.square
    square_cross      = gf.square_cross
    square_x          = gf.square_x
    text              = gf.text
    triangle          = gf.triangle
    wedge             = gf.wedge
    x                 = gf.x


    def _get_plot(self, kwargs):
        plot = kwargs.pop("plot", None)
        if not plot:
            if self._hold and self._current_plot:
                plot = self._current_plot
            else:
                plot_kwargs = self._next_figure_kwargs
                self._next_figure_kwargs = dict()
                plot_kwargs.update(kwargs)
                plot = _new_xy_plot(**plot_kwargs)
        self._current_plot = plot
        return plot

    def _add(self, *objects):
        for obj in objects:
            self._models[obj._id] = obj

    def add(self, *objects):
        ''' Add top level objects to this Document

        Args:
            *objects (PlotObject) : objects to add to the Document

        Returns:
            None
        '''
        for obj in objects:
            assert obj not in self._plotcontext.children
            self._plotcontext.children.append(obj)
            self._add(*obj.references())

    def add_all(self):
        """ensures everything in a plot context is stored and ready to
        be pushed
        """
        objs = self._plotcontext.references()
        self._add(*objs)

    def remove(self, obj_or_id):
        ''' Remove and object from this Document.

        Args:
            obj_or_id (PlotObject or str) : a PlotObject, or ID of a PlotObject, remove

        Returns:
            None

        Raises:
            ValueError
        '''
        if isinstance(obj_or_id, PlotObject):
            del self._models[obj_or_id._id]
        elif isinstance(obj_or_id, basestring):
            del self._models[obj_or_id]
        else:
            raise ValueError, "obj_or_id must be PlotObject or string(id)"


    # functions for turning json objects into json models
    def load(self, *attrs, **kwargs):
        """loads broadcast attrs into models.
        events can be 'existing', or None. 'existing' means
        trigger events only for existing (not new objects).
        None means don't trigger any events.
        """
        events = kwargs.pop('events', 'existing')
        dirty = kwargs.pop('dirty', False)
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
                self._add(m)
                created.add(m)
            models.append(m)
        for m in models:
            props = m.finalize(self._models)
            m.update(**props)
            m.setup_events()
        if events is None:
            self.clear_callback_queue(models)
        elif events is 'existing':
            non_created = [x for x in models if x not in created]
            self.execute_callback_queue(models=non_created)
            self.clear_callback_queue(models=created)
        self.enable_callbacks(models)
        for x in models:
            x._dirty = dirty
        return models

    def dump(self, *to_store):
        """ Manually convert our top-level models into dicts, before handing
        them in to the JSON encoder. We don't want to embed the call to
        ``vm_serialize()`` into the ``PlotObjectEncoder``, because that would
        cause all the attributes to be duplicated multiple times.
        """
        if not to_store:
            to_store = self._models.values()

        models = []
        for obj in to_store:
            ref = get_ref(obj)
            ref["attributes"] = obj.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": self.docid})
            models.append(ref)
        models = convert_references(models)
        return models


    #------------------------------------------------------------------------
    # Managing callbacks
    #------------------------------------------------------------------------

    def disable_callbacks(self, models=None):
        ''' Disable callbacks on given models.

        Args:
            models (list, optional) : models to disable callbacks for
                If models is None, disables callbacks on all models in
                this Document

        Returns:
            None

        '''
        if models is None:
            models = self._models.values()
        for m in models:
            m._block_callbacks = True

    def enable_callbacks(self, models=None):
        ''' Enable callbacks on given models.

        Args:
            models (list, optional) : models to enable callbacks for
                If models is None, enables callbacks on all models in
                this Document

        Returns:
            None

        '''
        if models is None:
            models = self._models.values()

        for m in models:
            m._block_callbacks = False

    def clear_callback_queue(self, models=None):
        ''' Clear the callback queue on given models.

        Args:
            models (list, optional) : models to clear callbacks for
                If models is None, clears callback queue on all models
                in this Document

        Returns:
            None

        '''
        if models is None:
            models = self._models.values()
        for m in models:
            del m._callback_queue[:]

    def execute_callback_queue(self, models=None):
        ''' Execute all queued callbacks on given models.

        Args:
            models (list, optional) : models to execute callbacks for
                If models is None, executes the callback queue on all
                models in this Document

        Returns:
            None

        '''
        if models is None:
            models = self._models.values()
        for m in models:
            for cb in m._callback_queue:
                m._trigger(*cb)
            del m._callback_queue[:]

def get_ref(obj):
    return obj.get_ref()

def merge(basedocument, document):
    """add objects from document into basedocument
    includes adding top level objs to plot context children
    """
    for m in document._plotcontext.children:
        if m not in basedocument._plotcontext.children:
            basedocument._plotcontext.children.append(m)
    basedocument._plotcontext._dirty = True
    for k, v in document._models.iteritems():
        basedocument._models[k] = v
    del basedocument._models[document._plotcontext._id]

def convert_references(json_obj):

    def convert(obj):
        if isinstance(obj, PlotObject):
            return get_ref(obj)
        elif isinstance(obj, HasProps):
            return obj.to_dict()
        else:
            return obj

    def helper(json_obj):
        if isinstance(json_obj, list):
            for idx, x in enumerate(json_obj):
                json_obj[idx] = convert(x)
        if isinstance(json_obj, dict):
            for k, x in json_obj.iteritems():
                json_obj[k] = convert(x)
    json_obj = copy.deepcopy(json_obj)
    json_apply(json_obj, helper)
    return json_obj

