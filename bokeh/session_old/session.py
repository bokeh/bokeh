""" Defines the base Session type
"""
from __future__ import absolute_import

import warnings
import logging
logger = logging.getLogger(__file__)

class Session(object):
    """ Sessions provide a sandbox or facility in which to manage the 'live'
    object state for a Bokeh plot.

    Many use cases for Bokeh have a client-server separation between the
    plot and data model objects and the view layer objects and controllers.
    For instance, we may have data and plot definitions in an interactive
    Python session, while the rendering layer and its objects may be in
    Javascript running in a web browser (even a remote browser).

    Even a rich client scenario benefits from the session concept, as it
    clearly demarcates responsibilities between plot specification and
    managing interactive state.  For inter-process or inter-language cases,
    it provides a central place to manage serialization (and related
    persistence issues).

    Sessions can be used as ContextManagers, but they can be created
    around a PlotObject manually the PlotObject and its related objects
    will be associated with the given session.
    """

    plotcontext = None

    def __init__(self, plot=None):
        """ Initializes this session from the given PlotObject. """
        # Has the plot model changed since the last save?
        self._dirty = True
        # This stores a reference to all models in the object graph.
        # Eventually consider making this be weakrefs?
        self._models = {}

    def __enter__(self):
        pass

    def __exit__(self, e_ty, e_val, e_tb):
        pass

    def add(self, *objects):
        """ Associates the given object to this session.  This means
        that changes to the object's internal state will be reflected
        in the persistence layer and trigger event that propagate
        across to the view(s).
        """
        for obj in objects:
            if obj is None:
                warnings.warn("Null object passed to Session.add()")
            else:
                obj.session = self
                self._models[obj._id] = obj

    def add_plot(self, *plots):
        """ Add a plot to this session. """
        ### XXX: remove this
        for plot in plots:
            plot.session = self
        ###

        self.plotcontext.children.extend(plots)
        self.plotcontext._dirty = True

    def view(self):
        """ Triggers the OS to open a web browser pointing to the file
        that is connected to this session.
        """
        raise NotImplementedError
