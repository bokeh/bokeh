""" Functions useful for string manipulations or encoding.

"""
from __future__ import absolute_import

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