from os import chdir, pardir
from os.path import abspath, join, split
from subprocess import PIPE, Popen

import pytest

TOP_PATH = abspath(join(split(__file__)[0], pardir))

@pytest.mark.quality
def test_flake8():
    chdir(TOP_PATH)

    proc = Popen(["flake8"], stdout=PIPE, stderr=PIPE)
    out, err = proc.communicate()

    assert proc.returncode == 0, "Flake8 issues:\n%s" % out.decode("utf-8")
