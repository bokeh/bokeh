import flask
from os.path import join, dirname
import logging
from logging import Formatter
import uuid
from . import wsmanager
from .models import convenience as mconv
from .models import docs
"""bokeh_app is actually a flask blueprint
"""
class BokehBlueprint(flask.Blueprint):
    def __init__(self, *args, **kwargs):
        super(BokehBlueprint, self).__init__(*args, **kwargs)
        self.debugjs = None
        
    def setup(self, redis_port, start_redis, 
              backbone_storage,
              servermodel_storage,
              authentication
              ):
        self.backbone_storage = backbone_storage
        self.servermodel_storage = servermodel_storage
        self.authentication = authentication
        self.redis_port = redis_port
        self.start_redis = start_redis
        self.wsmanager = wsmanager.WebSocketManager()
        def auth(auth, docid):
            doc = docs.Doc.load(self.servermodel_storage, docid)
            status = mconv.can_write_doc_api(doc, auth, self)
            return status
        self.wsmanager.register_auth("bokehplot", auth)
        if self.debugjs:
            basedir = dirname(dirname(dirname(__file__)))
            self.bokehjsdir = join(basedir, "bokehjs", "build")
            self.bokehjssrcdir = join(basedir, "bokehjs", "src")
        else:
            self.bokehjsdir = join(dirname(__file__), 'static')
            self.bokehjssrcdir = None
            
    def current_user(self):
        return self.authentication.current_user()

app = BokehBlueprint('bokeh.server',
                     'bokeh.server',
                     static_folder='static',
                     static_url_path='/bokeh/static',
                     template_folder='templates'
                     )
bokeh_app = app
