import uuid
from . import user
from . import docs


def can_read_doc_api(docid, apikey, app):
    doc = docs.Doc.load(app.model_redis, docid)
    return apikey == doc.apikey

def can_write_doc_api(docid, apikey, app):
    doc = docs.Doc.load(app.model_redis, docid)
    return apikey == doc.apikey

def can_read_doc(doc, bokehuser):
    return bokehuser.username in doc.r_users

def can_write_doc(doc, bokehuser):
    return bokehuser.username in doc.rw_users

def can_write_from_request(docid, request, app):
    doc = docs.Doc.load(app.model_redis, docid)
    if request.cookies.get('bokeh-api-key'):
        return doc.apikey == request.cookies['bokeh-api-key']
    else:
        user = app.current_user(request)
        return can_write_doc(doc, user)
