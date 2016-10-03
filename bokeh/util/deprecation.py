import six
import warnings

class BokehDeprecationWarning(DeprecationWarning):
    """ A specific ``DeprecationWarning`` subclass for Bokeh deprecations.
    Used to selectively filter Bokeh deprecations for unconditional display.

    """

def warn(message, stacklevel=2):
    warnings.warn(message, BokehDeprecationWarning, stacklevel=stacklevel)

def deprecated(since_or_msg, old=None, new=None, extra=None):
    """ Issue a nicely formatted deprecation warning. """

    if isinstance(since_or_msg, tuple):
        if old is None or new is None:
            raise ValueError("deprecated entity and a replacement are required")

        since = "%d.%d.%d" % since_or_msg
        message = "%(old)s was deprecated in Bokeh %(since)s and will be removed, use %(new)s instead."
        message = message % dict(old=old, since=since, new=new)
        if extra is not None:
            message += " " + extra.trim()
    elif isinstance(since_or_msg, six.string_types):
        if not (old is None and new is None and extra is None):
            raise ValueError("deprecated(message) signature doesn't allow extra arguments")

        message = since_or_msg
    else:
        raise ValueError("expected a version tuple or string message")

    warn(message)
