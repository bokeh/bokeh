from flask import abort, request, g
from .. import serverbb
from ..models import docs
from ..models import convenience
from ..app import app
def check_read_authentication_and_create_client(func):
    def wrapper(docid, *args, **kwargs):
        doc = docs.Doc.load(app.servermodel_storage, docid)
        if convenience.can_read_from_request(doc, request, app):
            return func(docid, *args, **kwargs)            
        else:
            abort(401)
    wrapper.__name__ = func.__name__
    return wrapper

def check_write_authentication_and_create_client(func):
    def wrapper(docid, *args, **kwargs):
        doc = docs.Doc.load(app.servermodel_storage, docid)
        if convenience.can_write_from_request(doc, request, app):
            return func(docid, *args, **kwargs)            
        else:
            abort(401)
    wrapper.__name__ = func.__name__
    return wrapper

@app.route('/bokeh/login', methods=['GET'])
@app.route('/bokeh/login/', methods=['GET'])
def login_get():
    return app.authentication.login_get()

@app.route('/bokeh/login', methods=['POST'])
@app.route('/bokeh/login/', methods=['POST'])
def login_post():
    return app.authentication.login_post()

@app.route('/bokeh/register/', methods=['GET'])
@app.route('/bokeh/register', methods=['GET'])
def register_get():
    return app.authentication.register_get()

@app.route('/bokeh/register/', methods=['POST'])
@app.route('/bokeh/register', methods=['POST'])
def register_post():
    result = app.authentication.register_post()
    return result


