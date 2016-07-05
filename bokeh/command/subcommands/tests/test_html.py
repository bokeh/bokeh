from __future__ import absolute_import

import argparse
import pytest
import os
import sys

is_python2 = sys.version_info[0] == 2

import bokeh.command.subcommands.html as schtml
from bokeh.command.bootstrap import main
from bokeh.util.testing import TmpDir, WorkingDir, with_directory_contents

from . import basic_scatter_script

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = schtml.HTML(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert schtml.HTML.name == "html"

def test_help():
    assert schtml.HTML.help == "Create standalone HTML files for one or more applications"

def test_args():
    assert schtml.HTML.args == (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help="The app directories or scripts to generate HTML for",
            default=None,
        )),

        (
            '--show', dict(
            action='store_true',
            help="Open generated file(s) in a browser"
        )),

        (('-o', '--output'), dict(
            metavar='FILENAME',
            action='append',
            type=str,
            help="Name of the output file or - for standard output."
        )),

        ('--args', dict(
            metavar='COMMAND-LINE-ARGS',
            nargs=argparse.REMAINDER,
            help="Any command line arguments remaining are passed on to the application handler",
        )),

    )

def test_no_script(capsys):
    with (TmpDir(prefix="bokeh-html-no-script")) as dirname:
        with WorkingDir(dirname):
            with pytest.raises(SystemExit):
                main(["bokeh", "html"])
        out, err = capsys.readouterr()
        if is_python2:
            too_few = "too few arguments"
        else:
            too_few = "the following arguments are required: DIRECTORY-OR-SCRIPT"
        assert err == """usage: bokeh html [-h] [--show] [-o FILENAME] [--args ...]
                  DIRECTORY-OR-SCRIPT [DIRECTORY-OR-SCRIPT ...]
bokeh html: error: %s
""" % (too_few)
        assert out == ""

def test_basic_script(capsys):
    def run(dirname):
        with WorkingDir(dirname):
            main(["bokeh", "html", "scatter.py"])
        out, err = capsys.readouterr()
        assert err == ""
        assert out == ""

        assert set(["scatter.html", "scatter.py"]) == set(os.listdir(dirname))

    with_directory_contents({ 'scatter.py' : basic_scatter_script },
                            run)

def test_basic_script_with_output_after(capsys):
    def run(dirname):
        with WorkingDir(dirname):
            main(["bokeh", "html", "scatter.py", "--output", "foo.html"])
        out, err = capsys.readouterr()
        assert err == ""
        assert out == ""

        assert set(["foo.html", "scatter.py"]) == set(os.listdir(dirname))

    with_directory_contents({ 'scatter.py' : basic_scatter_script },
                            run)

def test_basic_script_with_output_before(capsys):
    def run(dirname):
        with WorkingDir(dirname):
            main(["bokeh", "html", "--output", "foo.html", "scatter.py"])
        out, err = capsys.readouterr()
        assert err == ""
        assert out == ""

        assert set(["foo.html", "scatter.py"]) == set(os.listdir(dirname))

    with_directory_contents({ 'scatter.py' : basic_scatter_script },
                            run)
