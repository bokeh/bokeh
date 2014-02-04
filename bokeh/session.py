from __future__ import absolute_import

""" Defines the base PlotSession and some example session types.
"""

from os.path import abspath, split, join
import os.path
import json
import logging
import uuid
import warnings
import requests

from six import string_types
from six.moves.urllib.parse import urljoin, urlencode

from . import protocol, utils
from .objects import PlotObject, Plot, PlotContext, recursively_traverse_plot_object
from .properties import HasProps, List
from .exceptions import DataIntegrityException
from . import serverconfig
logger = logging.getLogger(__file__)

class Session(object):
    """ Sessions provide a sandbox or facility in which to manage the 'live'
    object state for a Bokeh plot.

    Many use cases for Bokeh have a client-server separation between the
    plot and data model objects and the view layer objects and controllers.
    For instance, we may have data and plot definitions in an interactive
    Python session, while the rendering layer and its objects may be in
    Javascript running in a web browser (even a remote browser).

    Even a rich client scenario benefits from the session concept, as it
    clearly demarcates responsibilities between plot specification and
    managing interactive state.  For inter-process or inter-language cases,
    it provides a central place to manage serialization (and related
    persistence issues).

    Sessions can be used as ContextManagers, but they can be created
    around a PlotObject manually the PlotObject and its related objects
    will be associated with the given session.
    """

    def __init__(self, plot=None):
        """ Initializes this session from the given PlotObject. """
        # Has the plot model changed since the last save?
        self._dirty = True
        # This stores a reference to all models in the object graph.
        # Eventually consider making this be weakrefs?
        self._models = {}

    def __enter__(self):
        pass

    def __exit__(self, e_ty, e_val, e_tb):
        pass

    def add(self, *objects, **kwargs):
        """ Associates the given object to this session.  This means
        that changes to the object's internal state will be reflected
        in the persistence layer and trigger event that propagate
        across to the view(s).

        **recursive** flag allows to descend through objects' structure
        and collect all their dependencies, adding them to the session
        as well.
        """
        recursive = kwargs.get("recursive", False)

        if recursive:
            objects = self._collect_objs(objects)

        for obj in objects:
            if obj is None:
                warnings.warn("Null object passed to Session.add()")
            else:
                obj.session = self
                self._models[obj._id] = obj

    @classmethod
    def _collect_objs(cls, input_objs):
        """ Iterate over ``input_objs`` and descend through their structure
        collecting all nested ``PlotObjects`` on the go. The resulting list
        is duplicate-free based on objects' identifiers.
        """
        ids = set([])
        objs = []

        def descend(obj):
            if hasattr(obj, '__iter__'):
                for _obj in obj:
                    descend(_obj)
            elif isinstance(obj, PlotObject):
                if obj._id not in ids:
                    ids.add(obj._id)

                    for attr in obj.__properties_with_refs__:
                        descend(getattr(obj, attr))

                    objs.append(obj)
            elif isinstance(obj, HasProps):
                for attr in obj.__properties_with_refs__:
                    descend(getattr(obj, attr))

        descend(input_objs)
        return objs

    def view(self):
        """ Triggers the OS to open a web browser pointing to the file
        that is connected to this session.
        """
        raise NotImplementedError

class BaseJSONSession(Session):
    def __init__(self, plot=None):
        super(BaseJSONSession, self).__init__(plot=plot)
        self.PlotObjectEncoder = type("PlotObjectEncoder", (self._PlotObjectEncoder,), {"session": self})
    #------------------------------------------------------------------------
    # Serialization
    #------------------------------------------------------------------------

    class _PlotObjectEncoder(protocol.NumpyJSONEncoder):
        """ Helper class we'll use to encode PlotObjects

        #hugo - I don't think we should use the json encoder anymore to do
        this.  It introduces an asymmetry in our operations, because
        while you can use this mechanism to serialize, you cannot use
        this mechanism to deserialize because we need 2 stage deserialization
        in order to resolve references
        """
        session = None

        def default(self, obj):
            if isinstance(obj, PlotObject):
                return self.session.get_ref(obj)
            else:
                return protocol.NumpyJSONEncoder.default(self, obj)

    def get_ref(self, obj):
        return obj.get_ref()

    def make_id(self):
        return str(uuid.uuid4())

    def serialize(self, obj, **jsonkwargs):
        """ Returns a string representing the JSON encoded object.
        References to other objects/instances is ended by a "ref"
        has encoding the type and UUID of the object.

        For all HTML sessions, the serialization protocol is JSON.
        How we produce references is actually more involved, because
        it may differ between server-based models versus embedded.
        """
        return protocol.serialize_json(obj, encoder=self.PlotObjectEncoder, **jsonkwargs)

    def convert_models(self, to_convert=None):
        """ Manually convert our top-level models into dicts, before handing
        them in to the JSON encoder. We don't want to embed the call to
        ``vm_serialize()`` into the ``PlotObjectEncoder``, because that would
        cause all the attributes to be duplicated multiple times.
        """
        if to_convert is None:
            to_convert = self._models.values()

        all = set(to_convert)
        for model in to_convert:
            children = recursively_traverse_plot_object(model)
            all.update(children)

        models = []

        for model in all:
            ref = self.get_ref(model)
            ref["attributes"] = model.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        return models

    def serialize_models(self, objects=None, **jsonkwargs):
        return self.serialize(self.convert_models(objects), **jsonkwargs)
    
class BaseHTMLSession(BaseJSONSession):
    """ Common file & HTML-related utility functions which all HTML output
    sessions will need.  Mostly involves JSON serialization.
    """

    bokeh_url = "https://bokeh.pydata.org/"

    # The base local directory for all CSS and JS
    server_static_dir = join(abspath(split(__file__)[0]), "server", "static")

    # The base dir for all HTML templates
    template_dir = join(abspath(split(__file__)[0]), "templates")

    # The base URL for all CSS and JS
    static_url = bokeh_url

    #------------------------------------------------------------------------
    # Static file handling
    #------------------------------------------------------------------------

    # TODO?: as_url=False
    def js_paths(self, unified=True, minified=True):
        """ Returns a list of URLs or absolute paths on this machine to the JS
        source files needed to render this session.  If **unified** is True,
        then this list is a single file.  If **minified** is True, then minifies
        all the JS.
        """
        raise NotImplementedError

    def css_paths(self, unified=True, minified=True):
        """ Returns the paths to required CSS files. Could be paths
        or URIs depending on the type of session.
        """
        raise NotImplementedError

    @property
    def bokehjs_dir(self):
        return getattr(self, "_bokehjs_dir",
                join(self.server_static_dir, "vendor/bokehjs"))

    @bokehjs_dir.setter
    def bokehjs_dir(self, val):
        self._bokehjs_dir = val

    def _inline_files(self, files):
        strings = []
        for file in files:
            path = abspath(join(self.server_static_dir, file))
            begin = "\n/* BEGIN %s */\n" % path
            middle = open(path, 'rb').read().decode("utf-8")
            end = "\n/* END %s */\n" % path
            strings.append(begin + middle + end)
        return "".join(strings)

    def _load_template(self, filename):
        import jinja2
        with open(join(self.template_dir, filename)) as f:
            return jinja2.Template(f.read())



class HTMLFileSession(BaseHTMLSession):
    """ Produces a pile of static HTML, suitable for exporting a plot
    as a standalone HTML file.  This includes a template around the
    plot and includes all the associated JS and CSS for the plot.
    """

    title = "Bokeh Plot"

    # TODO: Why is this not in bokehjs_dir, but rather outside of it?
    js_files = ["js/bokeh.js"]
    css_files = ["css/bokeh.css"]

    # Template files used to generate the HTML
    js_template = "plots.js"
    div_template = "plots.html"     # template for just the plot <div>
    html_template = "base.html"     # template for the entire HTML file
    inline_js = True
    inline_css = True

    # Used to compute the relative paths to JS and CSS if they are not
    # inlined into the output
    rootdir = abspath(split(__file__)[0])

    def __init__(self, filename="bokehplot.html", plot=None, title=None):
        self.filename = filename
        if title is not None:
            self.title = title
        super(HTMLFileSession, self).__init__(plot=plot)
        self.plotcontext = PlotContext()
        self.add(self.plotcontext)
        self.raw_js_objs = []

    def _file_paths(self, files, unified, minified):
        if not unified:
            raise NotImplementedError("unified=False is not implemented")

        if minified:
            files = [ root + ".min" + ext for (root, ext) in map(os.path.splitext, files) ]

        return [ os.path.join(self.server_static_dir, file) for file in files ]

    def js_paths(self, unified=True, minified=True):
        return self._file_paths(self.js_files, unified, minified)

    def css_paths(self, unified=True, minified=True):
        return self._file_paths(self.css_files, unified, minified)

    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

    def dumps(self, js=None, css=None, rootdir=None):
        """ Returns the HTML contents as a string

        **js** and **css** can be "inline" or "relative", and they default
        to the values of self.inline_js and self.inline_css.

        If these are set to be "relative" (or self.inline_js/css are False),
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.  **rootdir**
        defaults to the value of self.rootdir.
        """
        # FIXME: Handle this more intelligently
        pc_ref = self.get_ref(self.plotcontext)
        elementid = self.make_id()

        jscode = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = pc_ref["id"],
                    modeltype = pc_ref["type"],
                    all_models = self.serialize_models())

        rawjs, rawcss = None, None
        jsfiles, cssfiles = [], []

        if rootdir is None:
            rootdir = self.rootdir

        if js == "inline" or (js is None and self.inline_js):
            rawjs = self._inline_files(self.js_paths())
        elif js == "relative" or js is None:
            jsfiles = [ os.path.relpath(p, rootdir) for p in self.js_paths() ]
        elif js == "absolute":
            jsfiles = self.js_paths()
        else:
            raise ValueError("wrong value for 'js' parameter, expected None, 'inline', 'relative' or 'absolute', got %r" % js)

        if css == "inline" or (css is None and self.inline_css):
            rawcss = self._inline_files(self.css_paths())
        elif css == "relative" or css is None:
            cssfiles = [ os.path.relpath(p, rootdir) for p in self.css_paths() ]
        elif css == "absolute":
            cssfiles = self.css_paths()
        else:
            raise ValueError("wrong value for 'css' parameter, expected None, 'inline', 'relative' or 'absolute', got %r" % css)

        plot_div = self._load_template(self.div_template).render(elementid=elementid)

        html = self._load_template(self.html_template).render(
                    js_snippets = [jscode],
                    html_snippets = [plot_div] + [o.get_raw_js() for o in self.raw_js_objs],
                    rawjs = rawjs, rawcss = rawcss,
                    jsfiles = jsfiles, cssfiles = cssfiles,
                    title = self.title)

        return html

    def embed_js(self, plot_id, static_root_url):
        # FIXME: Handle this more intelligently
        pc_ref = self.get_ref(self.plotcontext)
        elementid = self.make_id()

        jscode = self._load_template('embed_direct.js').render(
            host = "",
            static_root_url=static_root_url,
            elementid = elementid,
            modelid = pc_ref["id"],
            modeltype = pc_ref["type"],
            plotid = plot_id,
            all_models = self.serialize_models())

        return jscode.encode("utf-8")

    def save(self, filename=None, js=None, css=None, rootdir=None):
        """ Saves the file contents.  Uses self.filename if **filename**
        is not provided.  Overwrites the contents.

        **js** and **css** can be "inline" or "relative", and they default
        to the values of self.inline_js and self.inline_css.

        If these are set to be "relative" (or self.inline_js/css are False),
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.  **rootdir**
        defaults to the value of self.rootdir.
        """
        s = self.dumps(js, css, rootdir)
        if filename is None:
            filename = self.filename
        with open(filename, "wb") as f:
            f.write(s.encode("utf-8"))
        return

    def view(self, new=False, autoraise=True):
        """ Opens a browser to view the file pointed to by this sessions.

        **new** can be None, "tab", or "window" to view the file in the
        existing page, a new tab, or a new windows.  **autoraise** causes
        the browser to be brought to the foreground; this may happen
        automatically on some platforms regardless of the setting of this
        variable.
        """
        new_map = { False: 0, "window": 1, "tab": 2 }
        file_url = "file://" + abspath(self.filename)

        try:
            import webbrowser
            webbrowser.open(file_url, new=new_map[new], autoraise=autoraise)
        except (SystemExit, KeyboardInterrupt):
            raise
        except:
            pass

    def dumpjson(self, pretty=True, file=None):
        """ Returns a JSON string representing the contents of all the models
        stored in this session, or write it to a file object or file name.

        If **pretty** is True, then return a string suitable for human reading,
        otherwise returns a compact string.

        If a file object is provided, then the output is appended to it.  If a
        file name is provided, then it opened for overwrite, and not append.

        Mostly intended to be used for debugging.
        """
        if pretty:
            indent = 4
        else:
            indent = None
        s = self.serialize_models(indent=indent)
        if file is not None:
            if isinstance(file, string_types):
                with open(file, "w") as f:
                    f.write(s)
            else:
                file.write(s)
        else:
            return s


class HTMLFragmentSession(BaseHTMLSession):
    """ Produces a DOM fragment which is suitable for embedding in a
    pre-existing HTML DOM.  Differs from HTMLFileSession in that the
    requisite script and css lines are generated separately.
    """

    def contents(self, body_only=False):
        """ Returns the multi-line string needed to embed a plot into
        the <body> of an HTML document.  Includes the JS and CSS by
        default; if **body_only** is True, then returns just the plot
        <div> and associated <script> tags, but none of the static
        files it depends on.
        """
        pass

#should move these to bokeh.objects?


class PersistentBackboneSession(object):
    
    @property
    def plotcontext(self):
        if hasattr(self, "_plotcontext"):
            return self._plotcontext
        else:
            return None
    
    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def get_ref(self, obj):
        return obj.get_ref()
    
    #------------------------------------------------------------------------
    # functions for loading json into models
    # we have 2 types of json data, if all the models are of one type, then
    # we just have a list of model attributes
    # otherwise, we have what we refer to as broadcast_json, which are of the form
    # {'type':typename, 'attributes' : attrs}
    #------------------------------------------------------------------------

    def load_attrs(self, typename, attrs, events='existing'):
        """converts attrs into broadcast_json, and then loads that
        """
        broadcast_attrs = [dict(type=typename, attributes=x) for x in attrs]
        return self.load_broadcast_attrs(broadcast_attrs, events=events)

    def load_broadcast_attrs(self, attrs, events='existing'):
        """loads broadcast attrs into models.
        events can be 'existing', or None. 'existing' means
        trigger events only for existing (not new objects).
        None means don't trigger any events.
        """
        models = []
        created = set()
        for attr in attrs:
            typename = attr['type']
            attr = attr['attributes']
            logger.debug('type: %s', typename)
            #logger.debug('attrs: %s', attr)
            _id = attr['id']
            if _id in self._models:
                m = self._models[_id]
                m._block_callbacks = True
                m.load_json(attr, instance=m)
            else:
                cls = PlotObject.get_class(typename)
                m = cls.load_json(attr)
                if m is None:
                    raise RuntimeError('Error loading object from JSON')
                self.add(m)
                created.add(m)
            models.append(m)
        for m in models:
            m.finalize(self._models)
        if events is None:
            self.clear_callback_queue(models)
        elif events is 'existing':
            non_created = [x for x in models if x not in created]
            self.execute_callback_queue(models=non_created)
            self.clear_callback_queue(models=created)
        self.enable_callbacks(models)
        return models

    def attrs(self, to_store):
        """converts to_store (list of models) into attributes
        """
        attrs = []
        for m in to_store:
            attr = m.vm_serialize()
            attr['doc'] = self.docid
            attr['id'] = m._id
            attrs.append(attr)
        return attrs

    def broadcast_attrs(self, to_store):
        """converts to_store(list of models) into broadcast attributes
        """
        models = []
        for m in to_store:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            # FIXME: Is it really necessary to add the id and doc to the
            # attributes dict? It shows up in the bbclient-based JSON
            # serializations, but I don't understand why it's necessary.
            ref["attributes"].update({"doc": self.docid})
            models.append(ref)
        return models

    #------------------------------------------------------------------------
    # Storing models
    #------------------------------------------------------------------------
    def store_obj(self, obj, ref=None):
        """store single object
        """
        return self.store_objs([obj])

    def store_objs(self, to_store):
        """store list of objects
        """
        models = self.broadcast_attrs(to_store)
        self.store_broadcast_attrs(models)
        for m in to_store:
            m._dirty = False
            
    def store_all(self):
        """store all dirty models, by calling store_objs
        """
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_dirty') and x._dirty]
        self.store_objs(to_store)
        return to_store

    def store_broadcast_attrs(self, attrs):
        """stores broadcast attrs on the server, persistent store, etc..
        """
        raise NotImplementedError

    #------------------------------------------------------------------------
    # Loading models
    #------------------------------------------------------------------------
    def load_all(self, asdict=False):
        """ 
        normally:
        you get back a list of models, and they are loaded into this session
        usually in self._models

        if asdict is True:
        you get a list of broadcast_json.  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError

    def load_type(self, typename, asdict=False):
        """ loads all objects of a given type
        normally:
        you get back a list of models, and they are loaded into this session
        usually in self._models

        if asdict is True:
        you get a list of json (not broadcast_json).  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError

    def load_obj(self, ref, asdict=False):
        """ loads one objects of matching the reference
        normally:
        you get a model, and it is loaded into this session

        if asdict is True:
        you get the json of the model.  json is NOT loaded into
        this session(no python objects are updated with the new data)
        """
        raise NotImplementedError        

    #loading callbacks
    def callbacks_json(self, to_store):
        """extracts callbacks  that need to be stored from 
        a list of models
        """
        all_data = []
        for m in to_store:
            data = self.get_ref(m)
            data['callbacks'] = m._callbacks
            all_data.append(data)
        return all_data

    def load_callbacks_json(self, callback_json):
        """given a list of callback specifications, 
        binds existing models with those callbacks
        """
        for data in callback_json:
            m = self._models[data['id']]
            m._callbacks = {}
            for attrname, callbacks in data['callbacks'].items():
                for callback in callbacks:
                    obj = self._models[callback['obj']['id']]
                    callbackname = callback['callbackname']
                    m.on_change(attrname, obj, callbackname)

    def load_all_callbacks(self, get_json=False):
        """retrieves callback specification for all models
        and loads them into the models.

        get_json = return json of callbacks, rather than
        loading them into models
        """
        raise NotImplementedError

    #storing callbacks
    def store_callbacks(self, to_store):
        """store callbacks from a bunch of models
        """
        raise NotImplementedError

    def store_all_callbacks(self):
        """extract callbacks from models, and then store them using
        self.store_callbacks
        """
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_callbacks_dirty') and x._callbacks_dirty]
        self.store_callbacks(to_store)
        return to_store

    #managing callbacks

    def disable_callbacks(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            m._block_callbacks = True

    def enable_callbacks(self, models=None):
        if models is None:
            models = self._models.values()

        for m in models:
            m._block_callbacks = False

    def clear_callback_queue(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            del m._callback_queue[:]

    def execute_callback_queue(self, models=None):
        if models is None:
            models = self._models.values()
        for m in models:
            for cb in m._callback_queue:
                m._trigger(*cb)
            del m._callback_queue[:]
            
    #deleting objects
            
    def del_obj(self, obj):
        self.del_objs([obj])

    def del_objs(self, to_del):
        raise NotImplementedError

class PlotServerSession(BaseHTMLSession, PersistentBackboneSession):

    def __init__(self, server_config=None, server_name=None, username=None, 
                 serverloc=None, userapikey="nokey"):
        # This logic is based on ContinuumModelsClient.__init__ and
        # mpl.PlotClient.__init__.  There is some merged functionality here
        # since a Session is meant to capture the little bit of lower-level
        # logic in PlotClient (i.e. avoiding handling of things like
        # _newxyplot()), but also build in the functionality of the
        # ContinuumModelsClient.
        if not server_config:
            if not server_name: server_name = serverloc
            server_config = serverconfig.Server(name=server_name,
                                                root_url=serverloc,
                                                userapikey=userapikey,
                                                username=username)
        self.load_server_config(server_config)
        self.http_session = requests.session()
        self.http_session.headers.update({
            'content-type':'application/json',
            'BOKEHUSER-API-KEY' : self.userapikey,
            'BOKEHUSER' : self.username})
        
        if self.root_url:
            url = urljoin(self.root_url, '/bokeh/userinfo/')
            self.userinfo = utils.get_json(self.http_session.get(url, verify=False))
        else:
            # why is this here?  It seems like we would not use this session
            # if we weren't connecting to a server
            logger.info('Not using a server, plots will only work in embedded mode')
            self.userinfo = None

        self.docid = None
        self.plotcontext = None
        self.apikey = None
        self.base_url = urljoin(self.root_url, "/bokeh/bb/")
        self.raw_js_objs = []
        super(PlotServerSession, self).__init__()
        
    def load_server_config(self, config):
        self.username = config.username
        self.root_url = config.root_url
        self.userapikey = config.userapikey
        self.config = config

    #------------------------------------------------------------------------
    # Document-related operations
    #------------------------------------------------------------------------
    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

    def load_doc(self, docid):
        url = urljoin(self.root_url,"/bokeh/getdocapikey/%s" % docid)
        resp = self.http_session.get(url, verify=False)
        if resp.status_code == 401:
            raise Exception('HTTP Unauthorized accessing DocID "%s"' % docid)
        apikey = utils.get_json(resp)
        if 'apikey' in apikey:
            self.docid = docid
            self.apikey = apikey['apikey']
            logger.info('got read write apikey')
        else:
            self.docid = docid
            self.apikey = apikey['readonlyapikey']
            logger.info('got read only apikey')
        self.load_all()
        plotcontext = self.load_type('PlotContext')
        if len(plotcontext):
            temp = plotcontext[0]
            if len(plotcontext) > 1:
                logger.warning(
                    "Found more than one PlotContext for doc ID %s; " \
                    "Using PlotContext ID %s" % (self.docid, temp._id))
            plotcontext = temp
        else:
            logger.warning("Unable to load PlotContext for doc ID %s" % self.docid)
            plotcontext = PlotContext()
            self.store_obj(plotcontext)
        self.plotcontext = plotcontext
        self.add(self.plotcontext)

    def make_doc(self, title):
        url = urljoin(self.root_url,"/bokeh/doc/")
        data = protocol.serialize_web({'title' : title})
        response = self.http_session.post(url, data=data, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = utils.get_json(response)

    def remove_doc(self, title):
        matching = [x for x in self.userinfo['docs'] \
                    if x.get('title') == title]
        docid = matching[0]['docid']
        url = urljoin(self.root_url,"/bokeh/doc/%s/" % docid)
        response = self.http_session.delete(url, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = utils.get_json(response)

    def use_doc(self, name):
        self.docname = name
        docs = self.userinfo.get('docs')
        matching = [x for x in docs if x.get('title') == name]
        if len(matching) == 0:
            logger.info("No documents found, creating new document '%s'" % name)
            self.make_doc(name)
            return self.use_doc(name)
        elif len(matching) > 1:
            logger.warning("Multiple documents with title '%s'" % name)
        self.load_doc(matching[0]['docid'])

    def make_source(self, *args, **kwargs):
        # This should not implement this here directly, since it should
        # done by separately creating the DataSource object. Stubbing this
        # out for now for symmetry with mpl.PlotClient
        raise NotImplementedError("Construct DataSources manually from bokeh.objects")

    def store_broadcast_attrs(self, attrs):
        data = self.serialize(attrs)
        url = utils.urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.http_session.post(url, data=data)

    #------------------------------------------------------------------------
    # Loading models
    #------------------------------------------------------------------------

    def load_all(self, asdict=False):
        """the json coming out of this looks different than that coming
        out of load_type, because it contains id, type, attributes, whereas
        the other one just contains attributes directly
        """
        url = utils.urljoin(self.base_url, self.docid +"/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content.decode('utf-8'))
        if not asdict:
            models = self.load_broadcast_attrs(attrs)
            for m in models:
                m._dirty = False
            return models
        else:
            models = attrs
        return models

    def load_type(self, typename, asdict=False):
        url = utils.urljoin(self.base_url, self.docid +"/", typename + "/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content.decode('utf-8'))
        if not asdict:
            models = self.load_attrs(typename, attrs)
            for m in models:
                m._dirty = False
            return models
        else:
            models = attrs
        return models

    def load_obj(self, ref, asdict=False):
        """loads an object from the server.
        if asdict:
            only the json is returned.
        else:
            update the existing copy in _models if it is present
            instantiate a new one if it is not
            and make sure to convert all references into models
        in the conversion from json to objects, sometimes references
        to models need to be resolved.
        """
        typename = ref["type"]
        ref_id = ref["id"]
        url = utils.urljoin(self.base_url, self.docid + "/" + typename +\
                            "/" + ref_id + "/")
        attr = protocol.deserialize_json(self.http_session.get(url).content)
        if not asdict:
            return self.load_attrs(typename, [attr])[0]
        else:
            return attr

    #loading callbacks
    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        url = utils.urljoin(self.base_url, self.docid + "/", "callbacks")
        data = protocol.deserialize_json(self.http_session.get(url).content)
        if get_json:
            return data
        self.load_callbacks_json(data)

    #storing callbacks

    def store_callbacks(self, to_store):
        all_data = self.callbacks_json(to_store)
        url = utils.urljoin(self.base_url, self.docid + "/", "callbacks")
        all_data = self.serialize(all_data)
        self.http_session.post(url, data=all_data)
        for m in to_store:
            m._callbacks_dirty = False




class NotebookSessionMixin(object):
    """ Mix this into ``BaseHTMLSession``. """

    def _get_plot_and_objects(self, *objects):
        if len(objects) == 0:
            objects = list(self._models.values())
        if len(objects) == 1 and isinstance(objects[0], Plot):
            the_plot = objects[0]
            objects = list(self._models.values())
        else:
            the_plot = [m for m in objects if isinstance(m, Plot)][0]

        return the_plot, objects

    def show(self, *objects):
        """ Displays the given objects, or all objects currently associated
        with the session, inline in the IPython Notebook.

        Basicall we return a dummy object that implements _repr_html.
        The reason to do this instead of just having this session object
        implement _repr_html directly is because users will usually want
        to just see one or two plots, and not all the plots and models
        associated with the session.
        """
        import IPython.core.displaypub as displaypub
        displaypub.publish_display_data('bokeh', {'text/html': self.dumps(*objects)})


class NotebookSession(NotebookSessionMixin, HTMLFileSession):
    """ Produces inline HTML suitable for placing into an IPython Notebook. """

    def __init__(self, plot=None):
        HTMLFileSession.__init__(self, filename=None, plot=plot)

    def dumps(self, *objects):
        """ Returns the HTML contents as a string. """
        the_plot, objects = self._get_plot_and_objects(*objects)

        plot_ref = self.get_ref(the_plot)
        elementid = self.make_id()

        js = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = plot_ref["id"],
                    modeltype = plot_ref["type"],
                    all_models = self.serialize_models(objects))

        plot_div = self._load_template(self.div_template).render(elementid=elementid)

        html = self._load_template(self.html_template).render(
                                           html_snippets=[plot_div],
                                           elementid = elementid,
                                           js_snippets = [js])
        return html.encode("utf-8")

    def notebooksources(self):
        import IPython.core.displaypub as displaypub
        js_paths = self.js_paths()
        css_paths = self.css_paths()
        html = self._load_template(self.html_template).render(
            rawjs=self._inline_files(js_paths),
            rawcss=self._inline_files(css_paths),
            js_snippets=[],
            html_snippets=["<p>Configuring embedded BokehJS mode.</p>"])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None


class NotebookServerSession(NotebookSessionMixin, PlotServerSession):
    """ An IPython Notebook session that is connected to a plot server. """

    def ws_conn_string(self):
        split = urlsplit(self.root_url)
        #how to fix this in bokeh and wakari?
        if split.scheme == 'http':
            return "ws://%s/bokeh/sub" % split.netloc
        else:
            return "wss://%s/bokeh/sub" % split.netloc

    def dumps(self, *objects):
        """ Returns the HTML contents as a string. """
        the_plot, _ = self._get_plot_and_objects(*objects)
        return the_plot.create_html_snippet(server=True)

    def notebook_connect(self):
        if self.docname is None:
            raise RuntimeError("usedoc() must be called before notebook_connect()")
        import IPython.core.displaypub as displaypub
        msg = """<p>Connecting notebook to document "%s" at server %s</p>""" % \
                (self.docname, self.root_url)
        displaypub.publish_display_data('bokeh', {'text/html': msg})
        return None
