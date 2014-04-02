import unittest
from unittest import skipIf

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


if __name__ == "__main__":
    unittest.main()
