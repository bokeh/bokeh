""" The document module provides the Document class, which is a container
for all Bokeh objects that mustbe reflected to the client side BokehJS
library.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)

import uuid

from six import string_types

from . import _glyph_functions as gf
from .exceptions import DataIntegrityException
from .objects import PlotContext
from .plot_object import PlotObject
from .plotting_helpers import _new_xy_plot
from .utils import dump

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
        self._next_figure_kwargs = dict()
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
        pcs = [x for x in self._models.values() if x.__view_model__ == 'PlotContext']
        if len(pcs) != 0:
            raise DataIntegrityException("too many plot contexts found")
        self._add(value)
        self._add(*value.references())
        self._context = value

    @property
    def ref(self):
        return self._context.ref

    # "current plot" related functions

    def hold(self, value=True):
        """ Set the hold value for this Document.

        Args:
            value (bool, optional) : whether hold should be turned on or off (default: True)

        Returns:
            None

        """
        self._hold = value

    def figure(self, **kwargs):
        """ Create a new figure for the next rendering.

        Returns:
            None

        """
        self._current_plot = None
        self._next_figure_kwargs = kwargs

    def curplot(self):
        """ Return the current plot of this Document.

        The "current plot" is the plot that is acted on by all the
        rendering methods, e.g.``doc.circle(...)`` will render a
        circle on the current plot.

        Returns:
            plot : the current plot_kwargs

        """
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

        for attr in objs:
            typename = attr['type']
            attr = attr['attributes']
            if attr['id'] in self._models:
                m = self._models[attr['id']]
                m._block_callbacks = True
                m.load_json(attr, instance=m)
            else:
                cls = PlotObject.get_class(typename)
                m = cls.load_json(attr)
                if m is None:
                    raise RuntimeError(
                        'Error loading model from JSON (type: %s, id: %s)' % (typename, attr['id'])
                    )
                self._add(m)
                new_models.add(m)
            all_models.add(m)

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
        return dump(models, docid=self.docid)

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

    def _get_plot(self, kwargs):
        """ Return the current plot, creating a new one if needed.

        """
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
