''' Provides ``CallbackManager`` mixin class for adding an ``on_change``
callback interface to classes.

'''
from __future__ import absolute_import

from inspect import formatargspec, getargspec, isfunction, ismethod
from types import FunctionType

def _callback_argspec(callback):
    '''Bokeh-internal function to get argspec for a callable'''
    if not callable(callback):
        raise ValueError("Callbacks must be callables")

    if isfunction(callback):
        return getargspec(callback)
    elif ismethod(callback):
        # in this case the argspec will have 'self' in the args
        return getargspec(callback)
    else:
        return getargspec(callback.__call__)

def _check_callback(callback, fargs):
    '''Bokeh-internal function to check callback signature'''
    argspec = _callback_argspec(callback)
    formatted_args = formatargspec(*argspec)
    margs = ('self',) + fargs
    if isinstance(callback, FunctionType):
        if len(argspec.args) != len(fargs):
            raise ValueError("Callbacks functions must have signature func(%s), got func%s" % (", ".join(fargs), formatted_args))

    # testing against MethodType misses callable objects, assume everything
    # else is a normal method, or __call__ here
    elif len(argspec.args) != len(margs):
        raise ValueError("Callbacks methods must have signature method(%s), got method%s" % (", ".join(margs), formatted_args))

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
        if len(callbacks) == 0:
            raise ValueError("on_change takes an attribute name and one or more callbacks, got only one parameter")
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:

            if callback in _callbacks: continue

            _check_callback(callback, ('attr', 'old', 'new'))

            _callbacks.append(callback)

    def remove_on_change(self, attr, *callbacks):
        ''' Remove a callback from this object '''
        if len(callbacks) == 0:
            raise ValueError("remove_on_change takes an attribute name and one or more callbacks, got only one parameter")
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:
            _callbacks.remove(callback)

    def trigger(self, attr, old, new):
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
            self._document._notify_change(self, attr, old, new)
            self._document._with_self_as_curdoc(invoke)
        else:
            invoke()
