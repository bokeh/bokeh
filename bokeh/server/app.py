
import flask
from os.path import join, dirname, abspath

from . import wsmanager
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
        self.wsmanager = wsmanager.WebSocketManager()

        def auth(auth, docid):
            doc = docs.Doc.load(self.servermodel_storage, docid)
            status = mconv.can_write_doc_api(doc, auth, self)
            return status
        self.wsmanager.register_auth("bokehplot", auth)

        server_dir = dirname(abspath(__file__))
        if self.debugjs:
            basedir = dirname(dirname(server_dir))
            self.bokehjsdir = join(basedir, "bokehjs", "build")
            self.bokehjssrcdir = join(basedir, "bokehjs", "src")
        else:
            self.bokehjsdir = join(server_dir, 'static')
            self.bokehjssrcdir = None

    def current_user(self):
        return self.authentication.current_user()

bokeh_app = BokehBlueprint(
    'bokeh.server',
    'bokeh.server',
    static_folder='static',
    static_url_path='/bokeh/static',
    template_folder='templates'
)
