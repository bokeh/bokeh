#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from bokeh.exceptions import AuthenticationException

from .app import bokeh_app

def prune(document, temporary_docid=None, delete=False):
    if temporary_docid is not None:
        storage_id = temporary_docid
    else:
        storage_id = document.docid
    to_delete = document.prune()
    if delete:
        for obj in to_delete:
            bokeh_app.backbone_storage.del_obj(storage_id, obj)

def get_temporary_docid(request, docid):
    key = 'temporary-%s' % docid
    return request.headers.get(key, None)

class BokehServerTransaction(object):
    #hugo - is this the right name?
    """Context Manager for a req/rep response cycle of the bokeh server
    responsible for
    -  determining whether the current user can read from a document
    -  determining whether the current user can write to a bokeh document
    (or temporary document for copy on write)
    -  stitching together documents to form a copy on write view
    -  saving changes to the document

    at the start of the context manager, self.clientdoc is populated
    with an instance of bokeh.document.Document with all the data
    loaded in (including from the copy on write context if specified)
    at the end of the context manager, changed models are written
    to the appropriate storage location.  and changed models are
    written to self.changed

    currently deletes aren't really working properly with cow - but we
    don't really make use of model deletions yet
    """
    def __init__(self, server_userobj, server_docobj, mode,
                 temporary_docid=None):
        """
        bokeh_app : bokeh_app blueprint
        server_userobj : instance of bokeh.server.models.user.User - current user
          for a request
        server_docobj : instance of bokeh.server.models.docs.Doc
        mode : 'r', or 'rw', or 'auto' - auto means rw if possible, else r
        temporary_docid : temporary docid for copy on write
        """
        logger.debug(
            "created transaction with %s, %s",
            server_docobj.docid, temporary_docid
        )
        self.server_userobj = server_userobj
        self.server_docobj = server_docobj
        self.temporary_docid = temporary_docid
        can_write = bokeh_app.authentication.can_write_doc(
            self.server_docobj,
            userobj=self.server_userobj,
            temporary_docid=self.temporary_docid)
        if can_write:
            can_read = True
        else:
            can_read = bokeh_app.authentication.can_read_doc(
                self.server_docobj,
                userobj=self.server_userobj)
        docid = self.server_docobj.docid
        if mode not in {'auto', 'rw', 'r'}:
            raise AuthenticationException('Unknown Mode')
        if mode == 'auto':
            if not can_write and not can_read:
                raise AuthenticationException("could not read from %s" % docid)
            if can_write:
                mode = 'rw'
            else:
                mode = 'r'
        else:
            if mode == 'rw':
                if not can_write:
                    raise AuthenticationException("could not write to %s" % docid)
            elif mode == 'r':
                if not can_read:
                    raise AuthenticationException("could not read from %s" % docid)
        self.mode = mode
        if self.mode == 'rw':
            self.apikey = self.server_docobj.apikey
        else:
            self.apikey = self.server_docobj.readonlyapikey
    @property
    def write_docid(self):
        if self.temporary_docid:
            return self.temporary_docid
        else:
            return self.server_docobj.docid

    def load(self, gc=False):
        from .views.backbone import init_bokeh
        clientdoc = bokeh_app.backbone_storage.get_document(self.server_docobj.docid)
        if self.temporary_docid:
            temporary_json = bokeh_app.backbone_storage.pull(self.temporary_docid)
            #no events - because we're loading from datastore, so nothing is new
            clientdoc.load(*temporary_json, events='none', dirty=False)
        if gc and self.mode != 'rw':
            raise AuthenticationException("cannot run garbage collection in read only mode")
        elif gc and self.mode == 'rw':
            prune(clientdoc, delete=True)
        else:
            prune(clientdoc)
        init_bokeh(clientdoc)
        self.clientdoc = clientdoc

    def save(self):
        if self.mode != 'rw':
            raise AuthenticationException("cannot save in read only mode")
        self.changed = bokeh_app.backbone_storage.store_document(
            self.clientdoc,
            temporary_docid=self.temporary_docid
        )
        logger.debug("stored %s models", len(self.changed))
