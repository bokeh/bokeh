import tempfile

from mock import patch
import pytest

import bokeh.command.util as util

def test_die(capsys):
    with pytest.raises(SystemExit):
        util.die("foo")
    out, err = capsys.readouterr()
    assert err == "foo\n"
    assert out == ""

def test_build_single_handler_application_unknown_file():
    with pytest.raises(ValueError):
        f = tempfile.NamedTemporaryFile(suffix=".bad")
        util.build_single_handler_application(f.name)

DIRSTYLE_MAIN_WARNING_COPY = """
It looks like you might be running the main.py of a directory app directly.
If this is the case, to enable the features of directory style apps, you must
call "bokeh serve" on the directory instead. For example:

    bokeh serve my_app_dir/

If this is not the case, renaming main.py will supress this warning.
"""

@patch('warnings.warn')
def test_build_single_handler_application_main_py(mock_warn):
    f = tempfile.NamedTemporaryFile(suffix="main.py")
    util.build_single_handler_application(f.name)
    assert mock_warn.called
    assert mock_warn.call_args[0] == (DIRSTYLE_MAIN_WARNING_COPY,)
