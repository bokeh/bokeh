import unittest
from unittest import skipIf

from mock import patch

from ..utils import is_py3, is_pypy


def skipIfPy3(message):
    return skipIf(is_py3(), message)


def skipIfPyPy(message):
    return skipIf(is_pypy(), message)


class DummyRequestCallable():
    def json(self):
        return True


class DummyRequestProperty():
    json = True


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
        from bokeh.utils import get_json
        self.assertTrue(get_json(DummyRequestProperty()))

    def test_with_method(self):
        from bokeh.utils import get_json
        self.assertTrue(get_json(DummyRequestCallable()))

class TestJsonapply(unittest.TestCase):

    def test_jsonapply(self):
        from bokeh.plot_object import json_apply

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


class TestResolveJson(unittest.TestCase):

    @patch('bokeh.utils.logging')
    def test_resolve_json(self, mock_logging):
        from bokeh.plot_object import resolve_json

        models = {'foo': 'success', 'otherfoo': 'othersuccess'}
        fragment = [{'id': 'foo', 'type': 'atype'}, {'id': 'foo', 'type': 'atype'}, {'id': 'otherfoo', 'type': 'othertype'}]
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess'])
        fragment.append({'id': 'notfoo', 'type': 'badtype'})
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess', None])
        self.assertTrue(mock_logging.error.called)
        self.assertTrue('badtype' in repr(mock_logging.error.call_args))

if __name__ == "__main__":
    unittest.main()
