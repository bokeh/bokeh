import os
import unittest
import subprocess

class TestExamples(unittest.TestCase):

    def test_examples(self):
        script = os.path.join(os.path.dirname(__file__), "test")
        proc = subprocess.Popen(["python", script])
        self.assertEqual(proc.wait(), 0, "examples do *NOT* work properly")
