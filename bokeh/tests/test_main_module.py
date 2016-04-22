import sys
import subprocess
import bokeh


def test_main_module():
    """ Test the __main__.py that allow doing "python -m bokeh"
    """
    cmd = [sys.executable, '-m', 'bokeh', '--version']
    v = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
    assert v == bokeh.__version__
