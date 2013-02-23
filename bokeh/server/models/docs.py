import uuid
from .. import models 
from .. import serverbb
import logging
log = logging.getLogger(__name__)

def transform_models(models):
    """backwards compatability code for data migrations    
    """
    print 'transforming!'
    model_cache = {}
    to_delete = set()
    for m in models:
        model_cache[m.id] = m
    for m in models:
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
            axes = m.get('axes')
            for x in axes:
                if 'D3' in x['type']:
                    x['type'] = x['type'][2:]
    return [x for x in models if x.id not in to_delete]


def prune_and_get_valid_models(model_redis, collections, docid, delete=False):
    """retrieve all models that the plot_context points to.  if delete is True,
    wipe out any models that are orphaned.  Also call transform_models, which
    performs any backwards compatability data transformations.  Also
    excludes any lazy models.
    """
    doc = Doc.load(model_redis, docid)
    plot_context = collections.get(doc.plot_context_ref['type'],
                                            doc.plot_context_ref['id'])
    toplevelmodels = [plot_context]
    marked = set()
    temp = collections.get_bulk(docid)
    print "num models", len(temp)
    all_models = {}
    all_models_json = {}
    for x in temp:
        all_models_json[x.id] = x.attributes
        all_models[x.id] = x
    mark_recursive_models(all_models_json, marked, plot_context.attributes)
    for v in all_models_json.values():
        if v['id'] not in marked:
            typename = all_models[v['id']].typename
            if delete:
                collections.delete(typename, v['id'])
    valid_models = [x for x in all_models.values() if x.id in marked]
    valid_models = transform_models(valid_models)
    valid_models = [x for x in valid_models if not x.get('lazy', False)]
    return valid_models

def mark_recursive_models(all_models, marked, model):
    marked.add(model['id'])
    refs = []
    find_refs_json(model, refs=refs)
    for ref in refs:
        if ref['id'] in marked:
            continue
        model = all_models.get(ref['id'])
        if model:
            mark_recursive_models(all_models, marked, model)

def is_ref(data):
    return (isinstance(data, dict) and
            'type' in data and
            'id' in data)

def find_refs_json(datajson, refs=None):
    refs = [] if refs is None else refs
    if is_ref(datajson):
        refs.append(datajson)
    elif isinstance(datajson, dict):
        find_refs_dict(datajson, refs=refs)
    elif isinstance(datajson, list):
        find_refs_list(datajson, refs=refs)
    else:
        pass

def find_refs_dict(datadict, refs=None):
    refs = [] if refs is None else refs
    for k,v in datadict.iteritems():
        find_refs_json(v, refs=refs)

def find_refs_list(datalist, refs=None):
    refs = [] if refs is None else refs
    for v in datalist:
        find_refs_json(v, refs=refs)


def new_doc(flaskapp, docid, title, rw_users=None, r_users=None,
            apikey=None, readonlyapikey=None):
    if not apikey: apikey = str(uuid.uuid4())
    if not readonlyapikey: readonlyapikey = str(uuid.uuid4())
    plot_context = serverbb.make_model(
        'PlotContext', docs=[docid])
    flaskapp.collections.add(plot_context)
    if rw_users is None: rw_users = []
    if r_users is None: r_users = []
    doc = Doc(docid, title, rw_users, r_users,
              plot_context.ref(), apikey, readonlyapikey)
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
