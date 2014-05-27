""" Defines the Document type
"""
from __future__ import absolute_import

import copy
import logging
import uuid

from six import string_types

from . import _glyph_functions as gf
from .exceptions import DataIntegrityException
from .objects import PlotContext
from .properties import HasProps
from .plot_object import PlotObject
from .plotting_helpers import _new_xy_plot
from .utils import json_apply, convert_references, get_ref, dump

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

    def get_ref(self):
        return get_ref(self._plotcontext)

    def _set_context(self, plotcontext):
        """sets the plot context.
        unsets the context first if one is present
        """
        self.unset_context()
        pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        if len(pcs) != 0:
            raise DataIntegrityException("too many plot contexts found")
        self._add(plotcontext)
        self._plotcontext = plotcontext

    def _autoset_context(self):
        """autosets context from what's already in this document
        If no plotcontext exists, creates one
        """
        pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        if len(pcs) == 0:
            plotcontext = PlotContext()
            self._plotcontext = plotcontext
        elif len(pcs) == 1:
            self._plotcontext = pcs[0]
        else:
            raise DataIntegrityException("too many plot contexts found")
        self._add(self._plotcontext)

    def set_context(self, plotcontext=None):
        """finds the plot context and sets it
        if a plotcontext is passed in, the plot context will
        be unset
        """
        if plotcontext:
            self._set_context(plotcontext)
        else:
            self._autoset_context()

    def unset_context(self):
        """unset the plot context and remove it from the document
        """
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
        '''Adds objects to the session
        '''
        for obj in objects:
            self._models[obj._id] = obj

    def add(self, *objects):
        ''' Add top level objects to this Document.  Also traverses
        references and adds those as well.  This function should only
        be called on top level objects.  lower level objects are
        added using _add

        Args:
            *objects (PlotObject) : objects to add to the Document

        Returns:
            None
        '''
        for obj in objects:
            if obj not in self._plotcontext.children:
                self._plotcontext.children.append(obj)
                self._plotcontext._dirty = True
            self._add(*obj.references())

    def add_all(self):
        """ensures everything in a plot context is added to the
        session and ready to be pushed/stored/etc...
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
        elif isinstance(obj_or_id, string_types):
            del self._models[obj_or_id]
        else:
            raise ValueError("obj_or_id must be PlotObject or string(id)")


    # functions for turning json objects into json models
    def load(self, *attrs, **kwargs):
        """loads json attributes into models.

        Args:

            *attrs : any attributes to load
            **kwargs : the only kwarg here is events, which can be set to
                'existing' or None. 'existing' means trigger events only
                for existing (not new objects). None means don't trigger any events.

        Returns:
            models that were loaded, as models, not as json

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
        """ Manually convert our top-level models into json objects

        Args:
            *to_store : models that we want to dump.  If this is empty
                we dump everything in the document
        """
        self.add_all()
        if not to_store:
            to_store = self._models.values()
        return dump(to_store, docid=self.docid)

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


def merge(basedocument, document):
    """add objects from document into basedocument
    includes adding top level objs to plot context children

    Args:
        basedocument (document) : original document.  Changes will
            merged into this one
        document (document) : new document.  Changes come from this document
    """
    for m in document._plotcontext.children:
        if m not in basedocument._plotcontext.children:
            basedocument._plotcontext.children.append(m)
    basedocument._plotcontext._dirty = True
    for k, v in document._models.items():
        basedocument._models[k] = v
    del basedocument._models[document._plotcontext._id]

