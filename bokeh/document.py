""" Defines the Document type
"""
from __future__ import absolute_import
import uuid
from .utils import json_apply
from .  import _glyph_functions
from .objects import Instance, List, PlotContext
from .properties import HasProps
from .plot_object import PlotObject
from .plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)

import logging
import warnings
import copy

logger = logging.getLogger(__file__)

class Document(object):

    def __init__(self, json_objs=None):
        self._current_plot = None
        self._next_figure_kwargs = dict()
        self._hold = False
        self._autostore = True
        self._models = {}
        self.docid = str(uuid.uuid4())
        self._plotcontext = None
        if json_objs:
            self.load(*json_objs)
        self.set_context()

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
    def autostore(self, value=True):
        self._autostore = value
    def hold(self, value=True):
        self._hold = value

    def figure(self, **kwargs):
        self._current_plot = None
        self._next_figure_kwargs = kwargs

    def curplot(self):
        return self._current_plot;

    annular_wedge     = _glyph_functions.annular_wedge
    annulus           = _glyph_functions.annulus
    arc               = _glyph_functions.arc
    asterisk          = _glyph_functions.asterisk
    bezier            = _glyph_functions.bezier
    circle            = _glyph_functions.circle
    circle_cross      = _glyph_functions.circle_cross
    circle_x          = _glyph_functions.circle_x
    cross             = _glyph_functions.cross
    diamond           = _glyph_functions.diamond
    diamond_cross     = _glyph_functions.diamond_cross
    image             = _glyph_functions.image
    image_rgba        = _glyph_functions.image_rgba
    image_url         = _glyph_functions.image_url
    inverted_triangle = _glyph_functions.inverted_triangle
    line              = _glyph_functions.line
    multi_line        = _glyph_functions.multi_line
    oval              = _glyph_functions.oval
    patch             = _glyph_functions.patch
    patches           = _glyph_functions.patches
    quad              = _glyph_functions.quad
    quadratic         = _glyph_functions.quadratic
    ray               = _glyph_functions.ray
    rect              = _glyph_functions.rect
    segment           = _glyph_functions.segment
    square            = _glyph_functions.square
    square_cross      = _glyph_functions.square_cross
    square_x          = _glyph_functions.square_x
    text              = _glyph_functions.text
    triangle          = _glyph_functions.triangle
    wedge             = _glyph_functions.wedge
    x                 = _glyph_functions.x


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
        """adds objects to the document
        """
        for obj in objects:
            self._models[obj._id] = obj

    def add(self, *objects):
        """adds top level objects to the document
        """
        for obj in objects:
            self._plotcontext.children.append(obj)
            self._add(*obj.references())

    def remove(self, obj_or_id):
        """obj_or_id - can be an object, or an ID of an object
        """
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
            try:
                typename = attr['type']
            except:
                import pdb;pdb.set_trace()
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
        if dirty:
            for x in models:
                x._dirty = True
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
        for obj in PlotObject.collect_plot_objects(*to_store):
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
    for k,v in document._models.iteritems():
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

