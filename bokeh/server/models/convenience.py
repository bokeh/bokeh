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
    if request.headers.get('BOKEH-API-KEY'):
        return doc.apikey == request.headers['BOKEH-API-KEY']
    else:
        user = app.current_user(request)
        if not user: return False
        return can_write_doc(doc, user)

def can_read_from_request(doc, request, app):
    if can_write_from_request(doc, request, app):
        return True
    else:
        if request.headers.get('BOKEH-API-KEY'):
            return doc.readonlyapikey == request.headers['BOKEH-API-KEY']
        else:
            user = app.current_user(request)
            if not user: return False
            return can_read_doc(doc, user)
