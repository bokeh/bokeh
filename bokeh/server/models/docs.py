import uuid
from .. import models 
from ...objects import PlotObject, recursively_traverse_plot_object
from ...session import PlotContext
import logging
log = logging.getLogger(__name__)

def prune_and_get_valid_models(session, delete=False):
    """retrieve all models that the plot_context points to.
    if delete is True,
    wipe out any models that are orphaned.  Also call transform_models, which
    performs any backwards compatability data transformations.  
    """
    objs = recursively_traverse_plot_object(session.plotcontext)
    print("num models", len(objs))
    if delete:
        for obj in session._models.values():
            if obj not in objs:
                #not impl yet...
                session.del_obj(obj)
    return objs

def new_doc(flaskapp, docid, title, session, rw_users=None, r_users=None,
            apikey=None, readonlyapikey=None):
    if not apikey: apikey = str(uuid.uuid4())
    if not readonlyapikey: readonlyapikey = str(uuid.uuid4())
    plot_context = PlotContext()
    session.add(plot_context)
    session.store_all()
    if rw_users is None: rw_users = []
    if r_users is None: r_users = []
    doc = Doc(docid, title, rw_users, r_users,
              session.get_ref(plot_context), apikey, readonlyapikey)
    doc.save(flaskapp.servermodel_storage)
    return doc

class Doc(models.ServerModel):
    typename = 'doc'
    idfield = 'docid'

    def __init__(self, docid, title, rw_users, r_users,
                 plot_context_ref, apikey, readonlyapikey):
        self.docid = docid
        self.title = title
        self.rw_users = rw_users
        self.r_users = r_users
        self.plot_context_ref = plot_context_ref
        self.apikey = apikey
        self.readonlyapikey = readonlyapikey

    def to_json(self):
        return {'docid' : self.docid,
                'title' : self.title,
                'rw_users' : self.rw_users,
                'r_users' : self.r_users,
                'plot_context_ref' : self.plot_context_ref,
                'apikey' : self.apikey,
                'readonlyapikey' : self.readonlyapikey
                }
    
    @classmethod
    def load(cls, client, objid):
        attrs = cls.load_json(client, objid)
        #adding readonly api key if it's not there
        if 'readonlyapikey' not in attrs:
            attrs['readonlyapikey'] = str(uuid.uuid4())
        obj = cls.from_json(attrs)
        obj.save(client)
        return obj
    
    @staticmethod
    def from_json(obj):
        return Doc(obj['docid'], obj['title'],
                   obj['rw_users'], obj['r_users'],
                   obj['plot_context_ref'], obj['apikey'],
                   obj['readonlyapikey'])
