#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

def can_read_doc_api(doc, apikey):
    if can_write_doc_api(doc, apikey):
        return True
    return apikey == doc.readonlyapikey

def can_write_doc_api(doc, apikey):
    return apikey == doc.apikey

def can_read_doc(doc, bokehuser):
    return bokehuser.username in doc.r_users

def can_write_doc(doc, bokehuser):
    return bokehuser.username in doc.rw_users

#api keys are r/w only, no such thing as read only api keys yet
def can_write_from_request(doc, request, user, temporary_docid=None):
    # temporary_docid is a uuid - we're not too concerned about auth around it
    # since it's a UUID and disposable

    # hack - temporary workaround for multiuser server and bokeh applets,
    # to be removed once bokeh applet infrastructure uses copy on write functionality
    if temporary_docid:
        return can_read_from_request(doc, request, user)
    if request.headers.get('BOKEH-API-KEY'):
        return doc.apikey == request.headers['BOKEH-API-KEY']
    else:
        if not user: return False
        return can_write_doc(doc, user)

def can_read_from_request(doc, request, user):
    # No temporary docid here - temporary docid is about read-write permissions,
    # and has no impact on read permissions
    if doc.published:
        return True
    if can_write_from_request(doc, request, user):
        return True
    else:
        if request.headers.get('BOKEH-API-KEY'):
            return doc.readonlyapikey == request.headers['BOKEH-API-KEY']
        else:
            if not user: return False
            return can_read_doc(doc, user)
