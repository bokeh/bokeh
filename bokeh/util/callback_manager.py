''' Provides ``PropertyCallbackManager`` and ``EventCallbackManager``
mixin classes for adding ``on_change`` and ``on_event`` callback
interfaces to classes.
'''
from __future__ import absolute_import

from ..events import Event
from ..util.future import get_param_info, format_signature, signature

def _check_callback(callback, fargs, what="Callback functions"):
    '''Bokeh-internal function to check callback signature'''
    sig = signature(callback)
    formatted_args = format_signature(sig)
    error_msg = what + " must have signature func(%s), got func%s"

    all_names, default_values = get_param_info(sig)

    if len(all_names) - len(default_values) != len(fargs):
        raise ValueError(error_msg % (", ".join(fargs), formatted_args))

class EventCallbackManager(object):
    ''' A mixin class to provide an interface for registering and
    triggering event callbacks on the Python side.

    '''
    def __init__(self, *args, **kw):
        super(EventCallbackManager, self).__init__(*args, **kw)
        self._event_callbacks = dict()

    def on_event(self, event, *callbacks):
        if not isinstance(event, str) and issubclass(event, Event):
            event = event.event_name

        for callback in callbacks:
            _check_callback(callback, ('event',), what='Event callback')

        if event not in self._event_callbacks:
            self._event_callbacks[event] = [cb for cb in callbacks]
        else:
            self._event_callbacks[event].extend(callbacks)

        if event not in self.subscribed_events:
            self.subscribed_events.append(event)

    def _trigger_event(self, event):
        for callback in self._event_callbacks.get(event.event_name,[]):
            if event._model_id is not None and self._id == event._model_id:
                callback(event)

    def _update_event_callbacks(self):
        if self.document is None:
            return

        for key in self._event_callbacks:
            self.document._subscribed_models[key].add(self)


class PropertyCallbackManager(object):
    ''' A mixin class to provide an interface for registering and
    triggering callbacks.

    '''

    def __init__(self, *args, **kw):
        super(PropertyCallbackManager, self).__init__(*args, **kw)
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
