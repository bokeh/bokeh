from __future__ import absolute_import

import bokeh.command.subcommands as sc

def test_all():
    assert hasattr(sc, 'all')
    assert type(sc.all) is list

def test_all_types():
    from bokeh.command.subcommand import Subcommand

    assert all(issubclass(x, Subcommand) for x in sc.all)

def test_all_count():
    from os.path import dirname
    from os import listdir

    files = listdir(dirname(sc.__file__))
    pyfiles = [x for x in files if x.endswith(".py")]

    # the -2 accounts for __init__.py and file_output.py
    assert len(sc.all) == len(pyfiles) - 2
