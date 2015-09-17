from __future__ import print_function

import os
import pytest
from os.path import join
import unittest
import subprocess


@pytest.mark.js
class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        bokehjs_dir = os.path.join(os.path.dirname(__file__), os.pardir, 'bokehjs')
        os.chdir(bokehjs_dir)
        proc = subprocess.Popen([join('node_modules', '.bin', 'gulp'), "test"],
                                stdout=subprocess.PIPE)
        result = proc.wait()
        msg = proc.stdout.read().decode('utf-8', errors='ignore')
        print(msg)
        if result != 0:
            assert False

if __name__ == "__main__":
    unittest.main()
