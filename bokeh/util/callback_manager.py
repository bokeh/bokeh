''' Provides ``CallbackManager`` mixin class for adding an ``on_change``
callback interface to classes.

'''
from __future__ import absolute_import

from inspect import formatargspec, getargspec
from types import FunctionType

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
        _callbacks = self._callbacks.setdefault(attr, [])
        for callback in callbacks:

            if callback in _callbacks: continue

            if not callable(callback):
                raise ValueError("Callbacks must be callables")

            argspec = getargspec(callback)
            formatted_args = formatargspec(*argspec)
            fargs = ('attr', 'old', 'new')
            margs = ('self',) + fargs
            if isinstance(callback, FunctionType):
                if len(argspec.args) != len(fargs):
                    raise ValueError("Callbacks functions must have signature func(%s), got func%s" % (", ".join(fargs), formatted_args))

            # testing against MethodType misses callable objects, assume everything
            # else is a normal method, or __call__ here
            elif len(argspec.args) != len(margs):
                raise ValueError("Callbacks methods must have signature method(%s), got method%s" % (", ".join(margs), formatted_args))

            _callbacks.append(callback)

    def trigger(self, attr, old, new):
        ''' Trigger callbacks for ``attr`` on this object.

        Args:
            attr (str) :
            old (object) :
            new (object) :

        Returns:
            None

        '''
        if self._document:
            self._document.notify_change(self, attr, old, new)
        callbacks = self._callbacks.get(attr)
        if callbacks:
            for callback in callbacks:
                callback(self, attr, old, new)
