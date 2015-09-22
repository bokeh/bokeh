from __future__ import absolute_import

import unittest

from bokeh.util.serialization import get_json, json_apply, make_id, urljoin, traverse_data

class DummyRequestCallable():
    def json(self):
        return True

class DummyRequestProperty():
    json = True

class TestMakeId(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(len(make_id()), 36)
        self.assertTrue(isinstance(make_id(), str))

    def test_simple_ids(self):
        import os
        os.environ["BOKEH_SIMPLE_IDS"] = "yes"
        self.assertEqual(make_id(), "1001")
        self.assertEqual(make_id(), "1002")
        del os.environ["BOKEH_SIMPLE_IDS"]

class TestUrlJoin(unittest.TestCase):
    def test_urljoin(self):
        result1 = urljoin('http://www.bokeh.com', 'test/')
        self.assertEqual(result1, 'http://www.bokeh.com/test/')
        result2 = urljoin('http://www.bokeh.com', 'test1/', 'test2/',
                          'test3/', 'bokeh.html')
        self.assertEqual(result2, 'http://www.bokeh.com/test1/test2/test3/bokeh.html')
        result3 = urljoin('http://www.notbokeh.com', 'http://www.bokeh.com/',
                          'test1/', 'bokeh1.squig')
        self.assertEqual(result3, 'http://www.bokeh.com/test1/bokeh1.squig')

class TestGetJson(unittest.TestCase):
    def test_with_property(self):
        self.assertTrue(get_json(DummyRequestProperty()))

    def test_with_method(self):
        self.assertTrue(get_json(DummyRequestCallable()))

class TestJsonapply(unittest.TestCase):

    def test_jsonapply(self):

        def check_func(frag):
            if frag == 'goal':
                return True

        def func(frag):
            return frag + 'ed'

        result = json_apply('goal', check_func, func)
        self.assertEqual(result, 'goaled')
        result = json_apply([[['goal', 'junk'], 'junk', 'junk']], check_func, func)
        self.assertEqual(result, [[['goaled', 'junk'], 'junk', 'junk']])
        result = json_apply({'1': 'goal', 1.5: {'2': 'goal', '3': 'junk'}}, check_func, func)
        self.assertEqual(result, {'1': 'goaled', 1.5: {'2': 'goaled', '3': 'junk'}})


class TestTraverseData(unittest.TestCase):
    testing = [[float('nan'), 3], [float('-inf'), [float('inf')]]]
    expected = [['NaN', 3.0], ['-Infinity', ['Infinity']]]

    def test_return_valid_json(self):
        self.assertTrue(traverse_data(self.testing) == self.expected)

    def test_with_numpy(self):
        self.assertTrue(traverse_data(self.testing, True) == self.expected)

    def test_without_numpy(self):
        self.assertTrue(traverse_data(self.testing, False) == self.expected)

if __name__ == "__main__":
    unittest.main()
