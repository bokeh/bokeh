#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Server-side model of a document.

We also use the same object the clients use to represent docs,
and that is from bokeh.document.  That is referred to here as
clientdoc.

"""

from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import uuid

from bokeh.models import PlotContext

from .server_model import ServerModel

def new_doc(flaskapp, docid, title, clientdoc, rw_users=None, r_users=None,
            apikey=None, readonlyapikey=None):
    if not apikey: apikey = str(uuid.uuid4())
    if not readonlyapikey: readonlyapikey = str(uuid.uuid4())
    plot_context = PlotContext()
    clientdoc.context = plot_context
    if rw_users is None: rw_users = []
    if r_users is None: r_users = []
    doc = Doc(docid, title, rw_users, r_users,
              plot_context.ref, apikey, readonlyapikey, False)
    doc.save(flaskapp.servermodel_storage)
    return doc

class Doc(ServerModel):
    typename = 'doc'
    idfield = 'docid'

    def __init__(self, docid, title, rw_users, r_users,
                 plot_context_ref, apikey, readonlyapikey, published):

        self.published = published
        self.docid = docid
        self.title = title
        self.rw_users = rw_users
        self.r_users = r_users
        self.plot_context_ref = plot_context_ref
        self.apikey = apikey
        self.readonlyapikey = readonlyapikey

    def to_json(self):
        return {'docid' : self.docid,
                'title' : self.title,
                'rw_users' : self.rw_users,
                'r_users' : self.r_users,
                'plot_context_ref' : self.plot_context_ref,
                'apikey' : self.apikey,
                'readonlyapikey' : self.readonlyapikey,
                'published' : self.published
                }

    @classmethod
    def load(cls, client, objid):
        attrs = cls.load_json(client, objid)
        #adding readonly api key if it's not there
        if 'readonlyapikey' not in attrs:
            attrs['readonlyapikey'] = str(uuid.uuid4())
        if 'published' not in attrs:
            attrs['published'] = False
        obj = cls.from_json(attrs)
        obj.save(client)
        return obj

    @staticmethod
    def from_json(obj):
        return Doc(obj['docid'], obj['title'],
                   obj['rw_users'], obj['r_users'],
                   obj['plot_context_ref'], obj['apikey'],
                   obj['readonlyapikey'],
                   obj['published']
        )
