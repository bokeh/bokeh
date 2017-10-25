# -*- coding: UTF-8 -*-
# Copyright 2014 Cole Maclean
"""Unit tests for session handling."""
import unittest

try:
    # python3
    from urllib.parse import urlencode
except ImportError:
    # python2
    from urllib import urlencode

import redis
import tornado.testing
import tornado.web
from tornado.escape import json_decode
from tornado.options import options, define

from . import Session, TornadoSessionHandler, session

define("redis_test_db", default=15, help="Redis test database")
Session.store = redis.StrictRedis(host=options.redis_host,
                                  port=options.redis_port, db=options.redis_test_db)


class SessionTests(unittest.TestCase):
    """Session handling tests.
    """

    def setUp(self):
        self.session_id = '12345678'
        self.session = Session(self.session_id)

    def tearDown(self):
        Session.store.flushdb()

    def test_session_id(self):
        self.assertTrue(self.session.id)

    def test_session_save(self):
        self.session['foo'] = 'bar'
        self.session.save()

        loaded = Session.load(self.session_id)
        self.assertEqual(loaded['foo'], 'bar')

    def test_session_not_save_on_del(self):
        self.session['foo'] = 'bar'
        del self.session

        loaded = Session.load(self.session_id)
        self.assertFalse('foo' in loaded)

    def test_save_basic_types(self):
        self.session['foo'] = 123
        self.session['bar'] = {'hello': 'world'}
        self.session['baz'] = ['foo', 'bar']
        self.session.save()

        loaded = Session.load(self.session_id)
        self.assertEqual(loaded['foo'], 123)
        self.assertEqual(loaded['bar'], {'hello': 'world'})
        self.assertEqual(loaded['baz'], ['foo', 'bar'])

    def test_save_custom_types(self):
        self.session['module'] = tornado.web.RequestHandler
        self.session['func'] = json_decode
        self.session.save()

        loaded = Session.load(self.session_id)
        self.assertEqual(loaded['module'], tornado.web.RequestHandler)
        self.assertEqual(loaded['func'], json_decode)


class DictApiTests(unittest.TestCase):
    def setUp(self):
        self.session_id = '0987654321'
        self.session = Session(self.session_id)
        self.session['1'] = 2
        self.session['3'] = 4
        self.session['5'] = 6

    def tearDown(self):
        Session.store.flushdb()

    def test_all_get_methods(self):
        self.session['foo'] = 123
        self.session.save()

        loaded = Session.load(self.session_id)
        self.assertEqual(loaded.get('foo'), 123)
        self.assertEqual(loaded['foo'], 123)
        self.assertEqual(loaded.get('bar'), None)
        self.assertEqual(loaded.get('bar', 'a string'), 'a string')

    def test_delete_item(self):
        self.session['foo'] = 123
        self.session['bar'] = 456

        self.session.save()

        loaded = Session.load(self.session_id)
        del loaded['foo']
        loaded.save()

        reloaded = Session.load(self.session_id)

        self.assertEqual(reloaded.get('foo'), None)
        self.assertEqual(reloaded.get('bar'), 456)

    def test_pop(self):
        self.session['foo'] = 123
        self.session.save()

        loaded = Session.load(self.session_id)
        foo = loaded.pop('foo')
        again = loaded.get('foo')

        self.assertEqual(foo, 123)
        self.assertEqual(again, None)

    def test_pop_item(self):
        self.session['foo'] = 123
        self.session.save()

        loaded = Session.load(self.session_id)
        items = []
        while len(loaded) > 0:
            items.append(loaded.popitem())

        self.assertTrue(('foo', 123) in items)
        self.assertEqual(loaded.get('foo'), None)

    def test_len(self):
        self.assertEqual(len(self.session), 3)

    def test_in_and_not_in(self):
        self.assertTrue('1' in self.session)
        self.assertTrue('2' not in self.session)
        self.assertFalse('2' in self.session)
        self.assertFalse('1' not in self.session)

    def test_iter(self):
        for k in iter(self.session):
            self.assertTrue(k in ('1', '3', '5'))

    def test_copy(self):
        new = self.session.copy()

        self.assertEqual(new.id, self.session.id)
        self.assertEqual(new._data, self.session._data)
        self.assertEqual(new, self.session)

        new['1'] = 7
        self.assertEqual(new.id, self.session.id)
        self.assertNotEqual(new._data, self.session._data)
        self.assertNotEqual(new, self.session)

    def test_keys(self):
        self.assertTrue('1' in self.session.keys())
        self.assertFalse('2' in self.session.keys())

    def test_items(self):
        self.assertTrue(('1', 2) in self.session.items())
        self.assertFalse(('1', '5') in self.session.items())

    def test_values(self):
        self.assertTrue(2 in self.session.values())
        self.assertFalse('1' in self.session.values())


class SessionTestHandler(TornadoSessionHandler):
    def get(self):
        self.write(self.session.to_json())

    def post(self):
        args = self.request.arguments
        for arg, val in args.items():
            self.session[arg] = val[0].decode('utf-8')
        self.finish()

    def delete(self):
        self.clear_session()
        self.finish()


class SessionWrapperHandler(tornado.web.RequestHandler):
    @session
    def get(self):
        self.write(self.session.to_json())

    @session
    def post(self):
        args = self.request.arguments
        for arg, val in args.items():
            self.session[arg] = val[0].decode('utf-8')
        self.finish()

    @session
    def delete(self):
        self.session.clear()
        self.clear_cookie('session')
        self.finish()


class SessionHandlerTests(tornado.testing.AsyncHTTPTestCase):
    def get_app(self):
        settings = {
            'cookie_secret': "sdafdsklfdsfdsafkdsafjdskfjsdflksd",
            'log_function': lambda s: s,  # hide web server logs
        }
        return tornado.web.Application([
            (r"/session_test", SessionTestHandler),
        ], **settings)

    def setUp(self):
        self.test_data = {
            'foo': 'bar',
            'testing': 123
        }
        super(SessionHandlerTests, self).setUp()
        post = self.fetch('/session_test', method="POST", body=urlencode(self.test_data))
        self.cookie = post.headers['Set-Cookie']

    def tearDown(self):
        self.fetch('/session_test', method="DELETE", headers={'Cookie': self.cookie})
        super(SessionHandlerTests, self).tearDown()

    def test_session_handler(self):
        raw_resp = self.fetch('/session_test', headers={'Cookie': self.cookie})
        json = json_decode(raw_resp.body)
        self.assertEqual(self.test_data['foo'], json['foo'])
        self.assertEqual(self.test_data['testing'], int(json['testing']))


class SessionWrapperTests(SessionHandlerTests):
    def get_app(self):
        settings = {
            'cookie_secret': "sdafdsklfdsfdsafkdsafjdskfjsdflksd",
            'log_function': lambda s: s,  # hide web server logs
        }
        return tornado.web.Application([
            (r"/session_test", SessionWrapperHandler),
        ], **settings)

    def test_session_wrapper(self):
        raw_resp = self.fetch('/session_test', headers={'Cookie': self.cookie})
        json = json_decode(raw_resp.body)
        self.assertEqual(self.test_data['foo'], json['foo'])
        self.assertEqual(self.test_data['testing'], int(json['testing']))


def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(SessionTests)
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(DictApiTests))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(SessionHandlerTests))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(SessionWrapperTests))
    return suite


if __name__ == '__main__':
    all = lambda: suite()
    tornado.testing.main()

