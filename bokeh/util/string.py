#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions useful for string manipulations or encoding.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re
from typing import Any, Dict, Optional, Sequence
from urllib.parse import quote_plus

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'format_docstring',
    'indent',
    'nice_join',
    'snakify',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def indent(text: str, n: int = 2, ch: str = " ") -> str:
    ''' Indent all the lines in a given block of text by a specified amount.

    Args:
        text (str) :
            The text to indent

        n (int, optional) :
            The amount to indent each line by (default: 2)

        ch (char, optional) :
            What character to fill the indentation with (default: " ")

    '''
    padding = ch * n
    return "\n".join(padding + line for line in text.split("\n"))


def nice_join(seq: Sequence[str], sep: str = ", ", conjuction: str = "or") -> str:
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


def snakify(name: str, sep: str = "_") -> str:
    ''' Convert CamelCase to snake_case. '''
    name = re.sub("([A-Z]+)([A-Z][a-z])", r"\1%s\2" % sep, name)
    name = re.sub("([a-z\\d])([A-Z])", r"\1%s\2" % sep, name)
    return name.lower()


def format_docstring(docstring: Optional[str], *args: Any, **kwargs: Any) -> Optional[str]:
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


def format_url_query_arguments(url: str, arguments: Optional[Dict[str, str]] = None) -> str:
    ''' Format a base URL with optional query arguments

    Args:
        url (str) :
            An base URL to append query arguments to
        arguments (dict or None, optional) :
            A mapping of key/value URL query arguments, or None (default: None)

    Returns:
        str

    '''
    if arguments is not None:
        items = (f"{quote_plus(key)}={quote_plus(value)}" for key, value in arguments.items())
        url += "?" + "&".join(items)
    return url

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
