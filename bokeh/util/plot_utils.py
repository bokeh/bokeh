from six import string_types

from ..model import Model


class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)

    def __dir__(self):
        if len(set(type(x) for x in self)) == 1:
            return dir(self[0])
        else:
            return dir(self)


def _select_helper(args, kwargs):
    """
    Allow flexible selector syntax.
    Returns:
        a dict
    """
    if len(args) > 1:
        raise TypeError("select accepts at most ONE positional argument.")

    if len(args) > 0 and len(kwargs) > 0:
        raise TypeError("select accepts EITHER a positional argument, OR keyword arguments (not both).")

    if len(args) == 0 and len(kwargs) == 0:
        raise TypeError("select requires EITHER a positional argument, OR keyword arguments.")

    if args:
        arg = args[0]
        if isinstance(arg, dict):
            selector = arg
        elif isinstance(arg, string_types):
            selector = dict(name=arg)
        elif issubclass(arg, Model):
            selector = {"type": arg}
        else:
            raise RuntimeError("Selector must be a dictionary, string or plot object.")

    else:
        selector = kwargs
    return selector
