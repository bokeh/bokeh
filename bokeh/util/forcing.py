''' Provide a set of decorators useful for repeatedly driving an
a function parameter.

These decorators can be especially useful in conjunction with periodic
callbacks in a Bokeh server application.

Example:

    As an example, consider the ``bounce`` forcing function, which
    advances a sequence forwards and backwards:

    .. code-block:: python

        from bokeh.util.forcing import bounce

        @bounce([0, 1, 2])
        def update(i):
            print(i)

    If this function is repeatedly called, it will print the following
    sequence on standard out:

    .. code-block:: none

        0 1 2 2 1 1 0 0 1 2 2 1 ...

'''
from __future__ import absolute_import

from functools import partial

def _force(f, sequence):
    def wrapper(*args, **kw):
        f(next(sequence))
    return wrapper

def _advance(f):
    i = 0
    while True:
        yield f(i)
        i += 1

def sine(w, A=1, phi=0, offset=0):
    ''' Return a driver function that can advance a sequence of sine values.

    .. code-block:: none

        value = A * sin(w*i + phi) + offset

    Args:
        w (float) : a frequency for the sine driver
        A (float) : an amplitude for the sine driver
        phi (float) : a phase offset to start the sine driver with
        offset (float) : a global offset to add to the driver values

    '''
    from math import cos
    def f(i):
        return A * cos(w*i + phi) + offset
    return partial(_force, sequence=_advance(f))

def cosine(w, A=1, phi=0, offset=0):
    ''' Return a driver function that can advance a sequence of cosine values.

    .. code-block:: none

        value = A * cos(w*i + phi) + offset

    Args:
        w (float) : a frequency for the cosine driver
        A (float) : an amplitude for the cosine driver
        phi (float) : a phase offset to start the cosine driver with
        offset (float) : a global offset to add to the driver values

    '''
    from math import cos
    def f(i):
        return A * cos(w*i + phi) + offset
    return partial(_force, sequence=_advance(f))

def linear(m=1, b=0):
    ''' Return a driver function that can advance a sequence of linear values.

    .. code-block:: none

        value = m * i + b

    Args:
        m (float) : a slope for the linear driver
        x (float) : an offset for the linear driver

    '''
    from math import cos
    def f(i):
        return m * i + b
    return partial(_force, sequence=_advance(f))

def bounce(sequence):
    ''' Return a driver function that can advance a "bounced" sequence
    of values.

    .. code-block:: none

        seq = [0, 1, 2, 3]

        # => [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, ...]

    Args:
        sequence (seq) : a sequence of values for the driver to bounce

    '''
    N = len(sequence)
    def f(i):
        if (i // N) % 2:
            return sequence[i%N]
        else:
            return sequence[N-i%N-1]
    return partial(_force, sequence=_advance(f))

def repeat(sequence):
    ''' Return a driver function that can advance a repeated of values.

    .. code-block:: none

        seq = [0, 1, 2, 3]

        # => [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, ...]

    Args:
        sequence (seq) : a sequence of values for the driver to bounce

    '''
    N = len(sequence)
    def f(i):
        return sequence[i%N]
    return partial(_force, sequence=_advance(f))

def count():
    ''' Return a driver function that can advance a simple count.

    '''
    return partial(_force, sequence=_advance(lambda x: x*step))


