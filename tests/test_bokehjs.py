from __future__ import print_function

import os
import pytest
import unittest
import subprocess

@pytest.mark.js
class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        os.chdir('bokehjs')
        proc = subprocess.Popen(["node", "gulpfile.js", "test"], stdout=subprocess.PIPE)
        out, errs = proc.communicate()
        msg = out.decode('utf-8', errors='ignore')
        os.chdir('..')
        print(msg)
        if proc.returncode != 0:
            assert False

if __name__ == "__main__":
    unittest.main()
