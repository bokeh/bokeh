from flask import abort, request, g
from .. import serverbb
from ..models import docs
from ..models import convenience
from ..app import bokeh_app
def check_read_authentication_and_create_client(func):
    def wrapper(docid, *args, **kwargs):
        doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
        if convenience.can_read_from_request(doc, request, bokeh_app):
            return func(docid, *args, **kwargs)            
        else:
            abort(401)
    wrapper.__name__ = func.__name__
    return wrapper

def check_write_authentication_and_create_client(func):
    def wrapper(docid, *args, **kwargs):
        doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
        if convenience.can_write_from_request(doc, request, bokeh_app):
            return func(docid, *args, **kwargs)            
        else:
            abort(401)
    wrapper.__name__ = func.__name__
    return wrapper

@bokeh_app.route('/bokeh/login', methods=['GET'])
def login_get():
    return bokeh_app.authentication.login_get()

@bokeh_app.route('/bokeh/login', methods=['POST'])
def login_post():
    return bokeh_app.authentication.login_post()

@bokeh_app.route('/bokeh/loginfromapikey', methods=['GET'])
def login_from_apikey():
    return bokeh_app.authentication.login_from_apikey()

@bokeh_app.route('/bokeh/register', methods=['GET'])
def register_get():
    return bokeh_app.authentication.register_get()

@bokeh_app.route('/bokeh/register', methods=['POST'])
def register_post():
    result = bokeh_app.authentication.register_post()
    return result


@bokeh_app.route('/bokeh/logout')
def logout():
    result = bokeh_app.authentication.logout()
    return result


