#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides ``PropertyCallbackManager`` and ``EventCallbackManager``
mixin classes for adding ``on_change`` and ``on_event`` callback
interfaces to classes.
'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import signature

# Bokeh imports
from ..events import Event
from ..util.functions import get_param_info

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EventCallbackManager',
    'PropertyCallbackManager',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class EventCallbackManager:
    ''' A mixin class to provide an interface for registering and
    triggering event callbacks on the Python side.

    '''
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self._event_callbacks = dict()

    def on_event(self, event, *callbacks):
        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        for callback in callbacks:
            if _nargs(callback) != 0:
                _check_callback(callback, ('event',), what='Event callback')

        if event not in self._event_callbacks:
            self._event_callbacks[event] = [cb for cb in callbacks]
        else:
            self._event_callbacks[event].extend(callbacks)

        if event not in self.subscribed_events:
            self.subscribed_events.append(event)

    def _trigger_event(self, event):
        def invoke():
            for callback in self._event_callbacks.get(event.event_name,[]):
                if event._model_id is not None and self.id == event._model_id:
                    if _nargs(callback) == 0:
                        callback()
                    else:
                        callback(event)

        # TODO: here we might mirror the property callbacks and have something
        # like Document._notify_event which creates an *internal* Bokeh event
        # (for the user event, confusing!) that then dispatches in the document
        # and applies curdoc wrapper there. However, most of that machinery is
        # to support the bi-directionality of property changes. Currently (user)
        # events only run from client to server. Would like to see if some of the
        # internal eventing can be reduced or simplified in general before
        # plugging more into it. For now, just handle the curdoc bits here.
        if hasattr(self, '_document') and self._document is not None:
            self._document._with_self_as_curdoc(invoke)
        else:
            invoke()

    def _update_event_callbacks(self):
        if self.document is None:
            return

        for key in self._event_callbacks:
            self.document._subscribed_models[key].add(self)


class PropertyCallbackManager:
    ''' A mixin class to provide an interface for registering and
    triggering callbacks.

    '''

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self._callbacks = dict()

    def on_change(self, attr, *callbacks):
        ''' Add a callback on this object to trigger when ``attr`` changes.

        Args:
            attr (str) : an attribute name on this object
            callback (callable) : a callback function to register

        Returns:
            None

        '''
        if len(callbacks) == 0:
            raise ValueError("on_change takes an attribute name and one or more callbacks, got only one parameter")

        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:

            if callback in _callbacks:
                continue

            _check_callback(callback, ('attr', 'old', 'new'))

            _callbacks.append(callback)

    def remove_on_change(self, attr, *callbacks):
        ''' Remove a callback from this object '''
        if len(callbacks) == 0:
            raise ValueError("remove_on_change takes an attribute name and one or more callbacks, got only one parameter")
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:
            _callbacks.remove(callback)

    def trigger(self, attr, old, new, hint=None, setter=None):
        ''' Trigger callbacks for ``attr`` on this object.

        Args:
            attr (str) :
            old (object) :
            new (object) :

        Returns:
            None

        '''
        def invoke():
            callbacks = self._callbacks.get(attr)
            if callbacks:
                for callback in callbacks:
                    callback(attr, old, new)
        if hasattr(self, '_document') and self._document is not None:
            self._document._notify_change(self, attr, old, new, hint, setter, invoke)
        else:
            invoke()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _nargs(fn):
    sig = signature(fn)
    all_names, default_values = get_param_info(sig)
    return len(all_names) - len(default_values)

def _check_callback(callback, fargs, what="Callback functions"):
    '''Bokeh-internal function to check callback signature'''
    sig = signature(callback)
    formatted_args = str(sig)
    error_msg = what + " must have signature func(%s), got func%s"

    all_names, default_values = get_param_info(sig)

    nargs = len(all_names) - len(default_values)
    if nargs != len(fargs):
        raise ValueError(error_msg % (", ".join(fargs), formatted_args))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
