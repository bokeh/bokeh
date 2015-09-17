#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from bokeh.exceptions import AuthenticationException
from bokeh.models.plots import Plot
from bokeh.session import TestSession as Session
from werkzeug.exceptions import Unauthorized

from bokeh.server.app import app, bokeh_app
from bokeh.server.models.user import User, new_user
from bokeh.server.models.docs import Doc
from bokeh.server.serverbb import BokehServerTransaction
from bokeh.server.views.bbauth import handle_auth_error
from bokeh.server.views.main import _makedoc
from bokeh.util.testing import FlaskClientTestCase


class AuthTestCase(FlaskClientTestCase):
    options = {'multi_user' : True}
    def test_handle_auth_error_decorator(self):
        @handle_auth_error
        def helper1():
            return 'foo'
        @handle_auth_error
        def helper2():
            raise AuthenticationException('bad!')
        assert helper1() == 'foo'
        self.assertRaises(Unauthorized, helper2)

    def test_write_auth_checks_rw_users_field(self):
        user = User('test1', 'sdfsdf', 'sdfsdf')
        user2 = User('test2', 'sdfsdf', 'sdfsdf')
        doc = Doc('docid', 'title', ['test1'], [], None,
                  None, None, False)
        with app.test_request_context("/"):
            BokehServerTransaction(user, doc, 'rw')
        with app.test_request_context("/"):
            self.assertRaises(AuthenticationException, BokehServerTransaction,
                              user2, doc, 'rw')

    def test_write_auth_ignores_r_users_field(self):
        user2 = User('test2', 'sdfsdf', 'sdfsdf')
        doc = Doc('docid', 'title', ['test1'], ['test'], None,
                  None, None, False)
        with app.test_request_context("/"):
            self.assertRaises(AuthenticationException, BokehServerTransaction,
                              user2, doc, 'rw')

    def test_read_auth_checks_both_fields(self):
        user2 = User('test2', 'sdfsdf', 'sdfsdf')
        user = User('test1', 'sdfsdf', 'sdfsdf')
        doc = Doc('docid', 'title', ['test1'], ['test2'], None,
                  None, None, False)
        with app.test_request_context("/"):
            BokehServerTransaction(user, doc, 'r')
        with app.test_request_context("/"):
            BokehServerTransaction(user2, doc, 'r')

    def test_permissions_with_temporary_docid(self):
        user = User('test1', 'sdfsdf', 'sdfsdf')
        doc = Doc('docid', 'title', [], ['test2'], None,
                  None, None, False)
        # with temporary docid, a user must be able to read in order to get write access
        # this call should fail
        with app.test_request_context("/"):
            self.assertRaises(AuthenticationException, BokehServerTransaction,
                              user, doc, 'rw', temporary_docid="foobar")

class TransactionManagerTestCase(FlaskClientTestCase):
    options = {'multi_user' : True}
    def setUp(self):
        super(TransactionManagerTestCase, self).setUp()
        self.user = new_user(bokeh_app.servermodel_storage, "test1",
                        "password")
        self.server_docobj = _makedoc(
            bokeh_app.servermodel_storage, self.user, 'testdoc1'
        )
        #create 2 views
        original_doc = bokeh_app.backbone_storage.get_document(self.server_docobj.docid)
        plot1 = Plot(title='plot1')
        original_doc.add(plot1)
        bokeh_app.backbone_storage.store_document(original_doc)

    def transaction(self, temporary_docid, mode='rw'):
        context = BokehServerTransaction(
            self.user,
            self.server_docobj,
            mode,
            temporary_docid=temporary_docid)
        return context

    def test_transaction_with_anonymous_user(self):
        self.server_docobj.published = True
        with app.test_request_context("/"):
            self.assertRaises(
                AuthenticationException,
                BokehServerTransaction,
                None, self.server_docobj, 'rw'
            )
        with app.test_request_context("/"):
            doc = BokehServerTransaction(None, self.server_docobj, 'rw',
                                         temporary_docid='temp')
            assert doc

    def test_base_object_exists_in_cow_context(self):
        with app.test_request_context("/"):
            t = self.transaction('test1')
            t.load()
            assert t.clientdoc.context.children[0].title == 'plot1'

    def test_writing_in_cow_context_persists(self):
        with app.test_request_context("/"):
            t = self.transaction('test1')
            t.load()
            t.clientdoc.add(Plot(title='plot2'))
            t.save()

            t = self.transaction('test1')
            t.load()
            assert len(t.clientdoc.context.children) == 2
            assert t.clientdoc.context.children[1].title == 'plot2'

    def test_writing_in_cow_context_does_not_modify_original(self):
        with app.test_request_context("/"):
            t = self.transaction('test1')
            t.load()
            t.clientdoc.add(Plot(title='plot2'))
            t.save()

            t = self.transaction('test1')
            t.load()
            assert len(t.clientdoc.context.children) == 2

            t = self.transaction(None)
            t.load()
            assert len(t.clientdoc.context.children) == 1

    def test_cannot_save_to_read_only_context(self):
        with app.test_request_context("/"):
            t = self.transaction(None, mode='r')
            t.load()
            t.clientdoc.add(Plot(title='plot2'))
            self.assertRaises(AuthenticationException, t.save)

    def test_cannot_gc_read_only_context(self):
        with app.test_request_context("/"):
            t = self.transaction(None, mode='r')
            self.assertRaises(AuthenticationException, t.load, gc=True)

class PublishTestCase(FlaskClientTestCase):
    options = {'multi_user' : True}
    def test_publish(self):
        sess = Session(client=app.test_client())
        sess.register('testuser', 'testpassword')
        sess.use_doc('test_cow')
        sess.publish()
        doc = Doc.load(bokeh_app.servermodel_storage, sess.docid)
        assert doc.title == 'test_cow'
        assert doc.published == True

    def test_publish_fails_for_invalid_auth(self):
        sess = Session(client=app.test_client())
        sess.register('testuser', 'testpassword')
        sess.use_doc('test_cow')
        sess2 = Session(client=app.test_client())
        sess2.register('testuser2', 'testpassword')
        sess2.docid = sess.docid
        self.assertRaises(Exception, sess2.publish)
