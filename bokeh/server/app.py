
import flask
from os import walk
from os.path import join

from bokeh.settings import settings

from .models import convenience as mconv
from .models import docs

class BokehBlueprint(flask.Blueprint):

    def __init__(self, *args, **kwargs):
        super(BokehBlueprint, self).__init__(*args, **kwargs)
        self.debugjs = None

    def setup(self, backend, backbone_storage, servermodel_storage,
              authentication, datamanager):
        self.datamanager = datamanager
        self.backend = backend
        self.backbone_storage = backbone_storage
        self.servermodel_storage = servermodel_storage
        self.authentication = authentication

        def auth(auth, docid):
            doc = docs.Doc.load(self.servermodel_storage, docid)
            status = mconv.can_write_doc_api(doc, auth, self)
            return status
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
