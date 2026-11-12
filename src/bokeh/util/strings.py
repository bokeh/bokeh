#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions useful for string manipulations or encoding.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import re
from typing import Any, Iterable, overload
from urllib.parse import quote_plus

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'append_docstring',
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
        text: The text to indent

        n: The amount to indent each line by

        ch: What character to fill the indentation with

    '''
    padding = ch * n
    return "\n".join(padding + line for line in text.split("\n"))


def nice_join(seq: Iterable[Any], *, sep: str = ", ", conjunction: str | None = "or") -> str:
    ''' Join together sequences of strings into English-friendly phrases using
    the conjunction ``or`` when appropriate.

    Args:
        seq: a sequence of values to nicely join
        sep: a sequence delimiter to use
        conjunction: a conjunction to use for the last
            two items, or None to reproduce basic join behavior

    Returns:
        a joined string

    Examples:
        >>> nice_join(["a", "b", "c"])
        'a, b or c'

    '''
    seq = [str(x) for x in seq]

    if len(seq) <= 1 or conjunction is None:
        return sep.join(seq)
    else:
        return f"{sep.join(seq[:-1])} {conjunction} {seq[-1]}"


def snakify(name: str, sep: str = "_") -> str:
    ''' Convert CamelCase to snake_case. '''
    name = re.sub("([A-Z]+)([A-Z][a-z])", rf"\1{sep}\2", name)
    name = re.sub("([a-z\\d])([A-Z])", rf"\1{sep}\2", name)
    return name.lower()

def append_docstring(docstring: str | None, extra: str) -> str | None:
    ''' Safely append to docstrings.

    When Python is executed with the ``-OO`` option, doc strings are removed and
    replaced the value ``None``. This function guards against appending the
    extra content in that case.

    Args:
        docstring: The docstring to format, or None
        extra: the content to append if docstring is not None

    Returns:
        str or None

    '''
    return None if docstring is None else docstring + extra

@overload
def format_docstring(docstring: None, *args: Any, **kwargs: Any) -> None: ...
@overload
def format_docstring(docstring: str, *args: Any, **kwargs: Any) -> str: ...

def format_docstring(docstring: str | None, *args: Any, **kwargs: Any) -> str | None:
    ''' Safely format docstrings.

    When Python is executed with the ``-OO`` option, doc strings are removed and
    replaced the value ``None``. This function guards against applying the string
    formatting options in that case.

    Args:
        docstring: The docstring to format, or ``None``
        args: string formatting arguments for the docstring
        kwargs: string formatting arguments for the docstring

    Returns:
        str or None

    '''
    return None if docstring is None else docstring.format(*args, **kwargs)


def format_url_query_arguments(url: str, arguments: dict[str, str] | None = None) -> str:
    ''' Format a base URL with optional query arguments

    Args:
        url:
            An base URL to append query arguments to
        arguments:
            A mapping of key/value URL query arguments, or None

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
