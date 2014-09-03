import unittest
from unittest import skipIf

from mock import patch

import bokeh.utils as utils


def skipIfPy3(message):
    return skipIf(utils.is_py3(), message)


def skipIfPyPy(message):
    return skipIf(utils.is_pypy(), message)


class DummyRequestCallable():
    def json(self):
        return True


class DummyRequestProperty():
    json = True


class TestMakeId(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(len(utils.make_id()), 36)
        self.assertTrue(isinstance(utils.make_id(), str))

    def test_simple_ids(self):
        import os
        os.environ["BOKEH_SIMPLE_IDS"] = "yes"
        self.assertEqual(utils.make_id(), "1001")
        self.assertEqual(utils.make_id(), "1002")
        del os.environ["BOKEH_SIMPLE_IDS"]

class TestScaleDelta(unittest.TestCase):
    def test_nonzero(self):
       self.assertEqual(utils.scale_delta(10), (10, "s") )
       self.assertEqual(utils.scale_delta(1), (1, "s") )
       self.assertEqual(utils.scale_delta(0.1), (100, "ms") )
       self.assertEqual(utils.scale_delta(0.001), (1, "ms") )
       self.assertEqual(utils.scale_delta(0.0001), (100, "us") )
       self.assertEqual(utils.scale_delta(0.000001), (1, "us") )
       self.assertEqual(utils.scale_delta(0.0000001), (100, "ns") )
       self.assertEqual(utils.scale_delta(0.000000001), (1, "ns") )
       self.assertEqual(utils.scale_delta(0.0000000001), (0.1, "ns") )

    def test_zero(self):
       self.assertEqual(utils.scale_delta(0), (0, "ns") )

class TestUrlJoin(unittest.TestCase):
    def test_urljoin(self):
        from bokeh.utils import urljoin
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
        self.assertTrue(utils.get_json(DummyRequestProperty()))

    def test_with_method(self):
        self.assertTrue(utils.get_json(DummyRequestCallable()))

class TestJsonapply(unittest.TestCase):

    def test_jsonapply(self):

        def check_func(frag):
            if frag == 'goal':
                return True

        def func(frag):
            return frag + 'ed'

        result = utils.json_apply('goal', check_func, func)
        self.assertEqual(result, 'goaled')
        result = utils.json_apply([[['goal', 'junk'], 'junk', 'junk']], check_func, func)
        self.assertEqual(result, [[['goaled', 'junk'], 'junk', 'junk']])
        result = utils.json_apply({'1': 'goal', 1.5: {'2': 'goal', '3': 'junk'}}, check_func, func)
        self.assertEqual(result, {'1': 'goaled', 1.5: {'2': 'goaled', '3': 'junk'}})


class TestResolveJson(unittest.TestCase):

    @patch('bokeh.utils.logging')
    def test_resolve_json(self, mock_logging):

        models = {'foo': 'success', 'otherfoo': 'othersuccess'}
        fragment = [{'id': 'foo', 'type': 'atype'}, {'id': 'foo', 'type': 'atype'}, {'id': 'otherfoo', 'type': 'othertype'}]
        self.assertEqual(utils.resolve_json(fragment, models), ['success', 'success', 'othersuccess'])
        fragment.append({'id': 'notfoo', 'type': 'badtype'})
        self.assertEqual(utils.resolve_json(fragment, models), ['success', 'success', 'othersuccess', None])
        self.assertTrue(mock_logging.error.called)
        self.assertTrue('badtype' in repr(mock_logging.error.call_args))

if __name__ == "__main__":
    unittest.main()
