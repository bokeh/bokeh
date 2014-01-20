import flask
from os.path import join, dirname
import logging
from logging import Formatter
import uuid
from . import wsmanager
from .models import user, docs
from .models import convenience as mconv

class BokehBlueprint(flask.Blueprint):
    def setup(self, redis_port, start_redis, backbone_storage):
        self.backbone_storage = backbone_storage
        self.redis_port = redis_port
        self.start_redis = start_redis
        self.secret_key = str(uuid.uuid4())
        self.debugjs = None
        self.wsmanager = wsmanager.WebSocketManager()
        def auth(auth, docid):
            doc = docs.Doc.load(self.model_redis, docid)
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

app = BokehBlueprint('bokeh.server',
                     'bokeh.server',
                     static_folder='static',
                     static_url_path='/bokeh/static',
                     template_folder='templates'
                     )
bokeh_app = app
