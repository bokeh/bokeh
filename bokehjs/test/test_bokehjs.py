import unittest
import subprocess

class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        proc = subprocess.Popen(["grunt"])
        self.assertEqual(proc.wait(), 0)

