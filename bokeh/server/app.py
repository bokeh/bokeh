from __future__ import absolute_import

import flask
from os import walk
from os.path import join

from bokeh.settings import settings

class BokehBlueprint(flask.Blueprint):

    def __init__(self, *args, **kwargs):
        super(BokehBlueprint, self).__init__(*args, **kwargs)
        self.debugjs = None

    def setup(self, backend, backbone_storage, servermodel_storage,
              authentication):
        self.backend = backend
        self.backbone_storage = backbone_storage
        self.servermodel_storage = servermodel_storage
        self.authentication = authentication
        self.bokehjsdir = settings.bokehjsdir()
        self.bokehjssrcdir = settings.bokehjssrcdir()

    def current_user(self):
        return self.authentication.current_user()

    def js_files(self):
        bokehjsdir = self.bokehjsdir
        js_files = []
        for root, dirnames, files in walk(bokehjsdir):
            for fname in files:
                if fname.endswith(".js") and 'vendor' not in root:
                    js_files.append(join(root, fname))
        return js_files

bokeh_app = BokehBlueprint(
    'bokeh.server',
    'bokeh.server',
    static_folder='static',
    static_url_path='/bokeh/static',
    template_folder='templates'
)

app = flask.Flask("bokeh.server")
