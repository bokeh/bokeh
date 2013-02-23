import uuid
from . import user
from . import docs


def can_read_doc_api(doc, apikey, app):
    return apikey == doc.apikey

def can_write_doc_api(doc, apikey, app):
    return apikey == doc.apikey

def can_read_doc(doc, bokehuser):
    return bokehuser.username in doc.r_users

def can_write_doc(doc, bokehuser):
    return bokehuser.username in doc.rw_users

#api keys are r/w only, no such thing as read only api keys yet
def can_write_from_request(doc, request, app):
    if request.cookies.get('bokeh-api-key'):
        return doc.apikey == request.cookies['bokeh-api-key']
    else:
        user = app.current_user(request)
        return can_write_doc(doc, user)

def can_read_from_request(doc, request, app):
    if can_write_from_request(doc, request, app):
        return True
    else:
        user = app.current_user(request)
        return can_read_doc(doc, user)
