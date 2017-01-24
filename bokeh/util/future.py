''' Utilities for Py2/Py3 interop.

'''

def with_metaclass(meta, *bases):
    """ Add metaclasses in both Python 2 and Python 3.

    Function from jinja2/_compat.py. License: BSD.

    Use it like this::

        class BaseForm(object):
            pass

        class FormType(type):
            pass

        class Form(with_metaclass(FormType, BaseForm)):
            pass

    This requires a bit of explanation: the basic idea is to make a
    dummy metaclass for one level of class instantiation that replaces
    itself with the actual metaclass.  Because of internal type checks
    we also need to make sure that we downgrade the custom metaclass
    for one level to something closer to type (that's why __call__ and
    __init__ comes back from type etc.).

    This has the advantage over six.with_metaclass of not introducing
    dummy classes into the final MRO.
    """
    class metaclass(meta):
        __call__ = type.__call__
        __init__ = type.__init__
        def __new__(cls, name, this_bases, d):
            if this_bases is None:
                return type.__new__(cls, name, (), d)
            return meta(name, bases, d)
    return metaclass('temporary_class', None, {})


# There is a problem with using @wraps decorator in combination with functools.partial.
# This issue is not present in Python 3.
# This redefinition will be triggered only if issue affects user,
# otherwise regular definition of @wraps will be used.
#
# this code snippet was originally posted in following stack overflow discussion:
# http://stackoverflow.com/a/28752007

from functools import wraps, partial, WRAPPER_ASSIGNMENTS

try:
    wraps(partial(wraps))(wraps)
except AttributeError:
    @wraps(wraps)
    def wraps(obj, attr_names=WRAPPER_ASSIGNMENTS, wraps=wraps):
        return wraps(obj, assigned=(name for name in attr_names if hasattr(obj, name)))

del partial, WRAPPER_ASSIGNMENTS
