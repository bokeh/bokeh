''' Functions useful for string manipulations or encoding.

'''
from __future__ import absolute_import

import re

def encode_utf8(u):
    ''' Encode a UTF-8 string to a sequence of bytes.

    Args:
        u (str) : the string to encode

    Returns:
        bytes

    '''
    import sys
    if sys.version_info[0] == 2:
        u = u.encode('utf-8')
    return u

def decode_utf8(u):
    ''' Decode a sequence of bytes to a UTF-8 string

    Args:
        u (str) : the bytes to decode

    Returns:
        UTF-8 string

    '''
    import sys
    if sys.version_info[0] == 2:
        u = u.decode('utf-8')
    return u

# based on `html` stdlib module (3.2+)
def escape(s, quote=("'", '"')):
    ''' Perform HTML-safe escaping.

    Replaces special characters "&", "<" and ">" to HTML-safe sequences, and
    optionally translates quote characters.

    Args:
        s (str): a string to escape

        quote (seq[str], optional) : which quote characters to replace
            (default: ("'", '"'))

    Returns:
        str

    '''
    s = s.replace("&", "&amp;")
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        if '"' in quote:
            s = s.replace('"', "&quot;")
        if "'" in quote:
            s = s.replace("'", "&#x27;")
    return s

def indent(text, n=2, ch=" "):
    ''' Indent all the lines in a given block of text by a specified ammount.

    Args:
        text (str) :
            The text to indent

        n (int, optional) :
            The amount to indent each line by (default: 2)

        ch (char, optional) :
            What character to fill the indentation with (default: " ")

    '''
    padding = ch * n
    return "\n".join(padding+line for line in text.split("\n"))

def nice_join(seq, sep=", ", conjuction="or"):
    ''' Join together sequences of strings into English-friendly phrases using
    the conjunction ``or`` when appropriate.

    Args:
        seq (seq[str]) : a sequence of strings to nicely join
        sep (str, optional) : a sequence delimiter to use (default: ", ")
        conjunction (str or None, optional) : a conjuction to use for the last
            two items, or None to reproduce basic join behaviour (default: "or")

    Returns:
        a joined string

    Examples:
        >>> nice_join(["a", "b", "c"])
        'a, b or c'

    '''
    seq = [str(x) for x in seq]

    if len(seq) <= 1 or conjuction is None:
        return sep.join(seq)
    else:
        return "%s %s %s" % (sep.join(seq[:-1]), conjuction, seq[-1])

def snakify(name, sep='_'):
    ''' Convert CamelCase to snake_case. '''
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
