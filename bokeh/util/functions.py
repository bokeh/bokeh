"""
utilities for working with functions
"""
import inspect

class cached_property(object):
    """ A property that is only computed once per instance and then replaces
        itself with an ordinary attribute. Deleting the attribute resets the
        property.

        Source: https://github.com/bottlepy/bottle/commit/fa7733e075da0d790d809aa3d2f53071897e6f76
        """

    def __init__(self, func):
        self.__doc__ = getattr(func, '__doc__')
        self.func = func

    def __get__(self, obj, cls):
        if obj is None:
            return self
        value = obj.__dict__[self.func.__name__] = self.func(obj)
        return value

def arg_filter(func, input_dict):
    arg_names, vararg_name, keyword_name, defaults = inspect.getargspec(func)
    result = {}
    for k in arg_names:
        result[k] = input_dict.get(k)
    return result
