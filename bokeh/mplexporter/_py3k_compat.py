"""
Simple fixes for Python 2/3 compatibility
"""
import sys
PY3K = sys.version_info[0] >= 3


if PY3K:
    import builtins
    import functools
    reduce = functools.reduce
    zip = builtins.zip
    xrange = builtins.range
    map = builtins.map
else:
    import __builtin__
    import itertools
    builtins = __builtin__
    reduce = __builtin__.reduce
    zip = itertools.izip
    xrange = __builtin__.xrange
    map = itertools.imap
