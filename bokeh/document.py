""" Defines the Document type
"""
from __future__ import absolute_import

from .  import _glyph_functions
from .objects import Instance, List
from .plot_object import PlotObject
from .plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)

import logging
import warnings

logger = logging.getLogger(__file__)

class Document(object):

    def __init__(self):
        self._current_plot = None
        self._next_figure_kwargs = dict()
        self._hold = False
        self._models = {}
        self._plotcontext = PlotContext()
        
    def __enter__(self):
        return self

    def __exit__(self, e_ty, e_val, e_tb):
        pass

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
        
    def add(self, *objects):
        for obj in objects:
            self._models[obj._id] = obj
                
    def merge(self, document):
        for m in document._plotcontext.children:
            if m not in self._plotcontext.children:
                self._plotcontext.children.append(m)
        self._plotcontext._dirty = True
        for k,v in document._models.iteritems():
            self._models[k] = v
        
    # functions for turning json objects into json models
    def load(self, *attrs, events='existing'):
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
        return models

    # functions for turning models into json objects
    def dump(self, *to_store):
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
