""" Functions useful for string manipulations or encoding.

"""
from __future__ import absolute_import

import re

def encode_utf8(u):
    """ Encode a UTF-8 string to a sequence of bytes.

    Args:
        u (str) : the string to encode

    Returns:
        bytes

    """
    import sys
    if sys.version_info[0] == 2:
        u = u.encode('utf-8')
    return u

def decode_utf8(u):
    """ Decode a sequence of bytes to a UTF-8 string

    Args:
        u (str) : the bytes to decode

    Returns:
        UTF-8 string

    """
    import sys
    if sys.version_info[0] == 2:
        u = u.decode('utf-8')
    return u

def nice_join(seq, sep=", "):
    """ Join together sequences of strings into English-friendly phrases using
    the conjunction ``or`` when appropriate.

    Args:
        seq (seq[str]) : a sequence of strings to nicely join
        sep (str, optional) : a sequence delimiter to use (default: ", ")

    Returns:
        a joined string

    Examples:
        >>> nice_join(["a", "b", "c"])
        'a, b or c'

    """
    seq = [str(x) for x in seq]

    if len(seq) <= 1:
        return sep.join(seq)
    else:
        return "%s or %s" % (sep.join(seq[:-1]), seq[-1])

def snakify(name, sep='_'):
    """ Convert CamelCase to snake_case. """
    name = re.sub("([A-Z]+)([A-Z][a-z])", r"\1%s\2" % sep, name)
    name = re.sub("([a-z\\d])([A-Z])", r"\1%s\2" % sep, name)
    return name.lower()

def format_docstring(docstring, *args, **kwargs):
    ''' Safely format docstrings.

    When Python is executed with the ``-OO`` option, doc strings are removed and
    replaced the value ``None``. This function guards against applying the string
    formatting options in that case.

    Args:
        docstring (str or None) : The docstring to format, or ``None``
        args (tuple) : string formatting arguments for the docsring
        kwargs (dict) : string formatting arguments for the docsring

    Returns:
        str or None

    '''
    return None if docstring is None else docstring.format(*args, **kwargs)
