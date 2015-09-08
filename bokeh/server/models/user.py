#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import uuid

from bokeh.exceptions import DataIntegrityException, UnauthorizedException
from six import string_types
from werkzeug import generate_password_hash, check_password_hash

from .docs import Doc
from .server_model import ServerModel

def apiuser_from_request(app, request):
    apikey = request.headers.get('BOKEHUSER-API-KEY')
    if not apikey:
        return None
    username = request.headers['BOKEHUSER']
    bokehuser = User.load(app.servermodel_storage, username)
    if bokehuser is None:
        return None
    if bokehuser.apikey == apikey:
        return bokehuser
    else:
        return None

def new_user(client, username, password, apikey=None, docs=None):
    """there is probably a race condition here if the same user
    is registered at the same time since redis doesn't have transactions
    """
    if apikey is None:
        apikey = str(uuid.uuid4())
    passhash = generate_password_hash(password, method='sha1')
    user = User(username, passhash, apikey, docs=docs)
    user.create(client)
    return user

def auth_user(client, username, password=None, apikey=None):
    user = User.load(client, username)
    if user is None:
        raise UnauthorizedException
    if password and check_password_hash(user.passhash, password):
        return user
    elif apikey and user.apikey == apikey:
        return user
    else:
        raise UnauthorizedException

class User(ServerModel):
    idfield = 'username'
    typename = 'user'
    #we're using username as the id for now...
    def __init__(self, username, passhash, apikey, docs=None):
        self.apikey = apikey
        self.username = username
        self.passhash = passhash
        if docs is None:
            docs = []
        self.docs = docs

    @classmethod
    def load(cls, client, objid):
        attrs = cls.load_json(client, objid)
        if attrs is None:
            return None
        changed = False
        if not attrs.get('apikey'):
            attrs['apikey'] = str(uuid.uuid4())
            changed = True
        docs = attrs.get('docs')
        newdocs = []
        for doc in docs:
            if isinstance(doc, string_types):
                doc = Doc.load(client, doc)
                newdocs.append({
                    'title' : doc.title,
                    'docid' : doc.docid
                })
                changed = True
            else:
                newdocs.append(doc)
        attrs['docs'] = newdocs
        obj = cls.from_json(attrs)
        if changed:
            obj.save(client)
        return obj

    def add_doc(self, docid, title):
        matching = [x for x in self.docs if x.get('title') == title]
        if len(matching) > 0:
            raise DataIntegrityException('title already exists')
        self.docs.append({'docid' : docid, 'title' : title})

    def remove_doc(self, docid):
        matching = [x for x in self.docs if x.get('docid') == docid]
        if len(matching) == 0:
            raise DataIntegrityException('no document found')
        self.docs = [x for x in self.docs if x.get('docid') != docid]


    def to_public_json(self):
        return {
            'username' : self.username,
            'docs'     : self.docs
        }

    def to_json(self):
        return {
            'username' : self.username,
            'passhash' : self.passhash,
            'apikey'   : self.apikey,
            'docs'     : self.docs,
        }

    @staticmethod
    def from_json(obj):
        return User(
            obj['username'],
            obj['passhash'],
            obj['apikey'],
            obj['docs'],
        )
