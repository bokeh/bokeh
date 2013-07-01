import uuid
from .. import models 
from ...objects import PlotObject, recursively_traverse_plot_object
from ...session import PlotContext
import logging
log = logging.getLogger(__name__)

def transform_models(models):
    """backwards compatability code for data migrations - out of date with
    new object stuff
    """
    print 'transforming!'
    model_cache = {}
    to_delete = set()
    for m in models:
        model_cache[m.id] = m
    for m in models:
        if not m.get('doc'):
            docs = m.get('docs')
            m.set('doc', docs[0])
            m.unset('docs')
        if 'Mapper' in m.typename:
            to_delete.add(m.id)
        if 'Renderer' in m.typename:
            xmapper = m.get('xmapper')
            if xmapper != 'linear' and xmapper is not None:
                xmapper = model_cache[xmapper['id']]
                m.set('xdata_range', xmapper.get('data_range'))
            ymapper = m.get('ymapper')
            if ymapper != 'linear' and ymapper is not None:
                ymapper = model_cache[ymapper['id']]
                m.set('ydata_range', ymapper.get('data_range'))

        if 'D3LinearAxis' in m.typename:
            m.typename = 'LinearAxis'
        elif 'D3LinearDateAxis' in m.typename:
            m.typename = 'LinearDateAxis'

        if 'Axis' in m.typename:
            mapper = m.get('mapper')
            if mapper != 'linear' and mapper is not None:
                mapper = model_cache[mapper['id']]
                m.set('data_range', mapper.get('data_range'))
        elif m.typename == 'PanTool' or m.typename=='ZoomTool':
            xmappers = m.get('xmappers', [])
            ymappers = m.get('ymappers', [])
            if len(xmappers) == 0 and len(ymappers) == 0:
                continue
            dataranges = []
            dimensions = []
            for xmapper in xmappers:
                xmapper = model_cache[xmapper['id']]
                dataranges.append(xmapper.get('data_range'))
                dimensions.append('width')
            for ymapper in ymappers:
                ymapper = model_cache[ymapper['id']]
                dataranges.append(ymapper.get('data_range'))
                dimensions.append('height')
            m.set('dataranges', dataranges)
            m.set('dimensions', dimensions)

        if m.typename == 'Plot':
            #delete all existing overlays
            overlays = m.get('overlays')
            if overlays and len(overlays) > 0:
                to_delete.update([x['id'] for x in overlays])
            #remove them from plots
            m.set('overlays', [])
            selecttoolrefs = []
            if m.get('tools'):
                selecttoolrefs = [x for x in m.get('tools') \
                                 if x['type'] == 'SelectionTool']
            #if we have a selection tool, create a box select overlay
            if len(selecttoolrefs) > 0:
                selecttoolref = selecttoolrefs[0]
                overlay = serverbb.make_model(
                    'BoxSelectionOverlay',
                    doc=m.get('doc'),
                    tool=selecttoolref
                    )
                m.set('overlays', [overlay.ref()])
                model_cache[overlay.id] = overlay
                models.append(overlay)
            axes = m.get('axes')
            for x in axes:
                if 'D3' in x['type']:
                    x['type'] = x['type'][2:]
                
    return [x for x in models if x.id not in to_delete]


def prune_and_get_valid_models(doc, session, delete=False):
    """retrieve all models that the plot_context points to.
    if delete is True,
    wipe out any models that are orphaned.  Also call transform_models, which
    performs any backwards compatability data transformations.  
    """
    objs = recursively_traverse_plot_object(session.plotcontext)
    print "num models", len(objs)
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
    doc.save(flaskapp.model_redis)
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
