""" Defines the base PlotSession and some example session types.
"""

from exceptions import DataIntegrityException
from os.path import abspath, split, join
import os.path
import json
import logging
import urlparse
import uuid
import warnings

import requests

from bokeh import protocol, utils
from bokeh.objects import PlotObject, Plot
from bokeh.properties import List

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

    def add(self, *objects):
        """ Associates the given object to this session.  This means
        that changes to the object's internal state will be reflected
        in the persistence layer and trigger event that propagate
        across to the View(s)
        """
        for obj in objects:
            if obj is None:
                warnings.warn("Null object passed to Session.add()")
            else:
                obj.session = self
                self._models[obj._id] = obj

    def view(self):
        """ Triggers the OS to open a web browser pointing to the file
        that is connected to this session.
        """
        raise NotImplementedError


class BaseHTMLSession(Session):
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

    def js_paths(self, as_url=True, unified=True, min=True):
        """ Returns a list of URLs or absolute paths on this machine to the JS
        source files needed to render this session.  If **unified** is True,
        then this list is a single file.  If **min** is True, then minifies
        all the JS.
        """
        raise NotImplementedError

    def css_paths(self, as_url=True):
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

    def _inline_scripts(self, paths):
        # Copied from dump.py, which itself was from wakariserver
        if len(paths) == 0:
            return ""
        strings = []
        for script in paths:
            f_name = abspath(join(self.server_static_dir, script))
            strings.append("""
              // BEGIN %s
            """ % f_name + open(f_name).read() + \
            """
              // END %s
            """ % f_name)
        return "".join(strings)

    def _inline_css(self, paths):
        # Copied from dump.py, which itself was from wakariserver
        if len(paths) == 0:
            return ""
        strings = []
        for css_path in paths:
            f_name = join(self.server_static_dir, css_path)
            strings.append("""
              /* BEGIN %s */
            """ % f_name + open(f_name).read().decode("utf-8") + \
            """
              /* END %s */
            """ % f_name)
        return "".join(strings)

    def _load_template(self, filename):
        import jinja2
        with open(join(self.template_dir, filename)) as f:
            return jinja2.Template(f.read())


    #------------------------------------------------------------------------
    # Serialization
    #------------------------------------------------------------------------

    class PlotObjEncoder(protocol.NumpyJSONEncoder):
        """ Helper class we'll use to encode PlotObjects

        Note that since json.dumps() takes a *class* as an argument and
        not an instance, when this encoder class is used, the Session
        instance is set as a class-level attribute.  Kind of weird, and
        should be better handled via a metaclass.

        #hugo - I don't think we should use the json encoder anymore to do
        this.  It introduces an asymmetry in our operations, because
        while you can use this mechanism to serialize, you cannot use
        this mechanism to deserialize because we need 2 stage deserialization
        in order to resolve references
        """
        session = None
        def default(self, obj):
            if isinstance(obj, PlotObject):
                if self.session is None:
                    raise RuntimeError("PlotObjEncoder requires a valid session")
                # We do not want the JSON encoder (which walks the entire
                # object graph) to do anything more than return references.
                # The model serialization happens later.
                d = self.session.get_ref(obj)
                return d
            else:
                return protocol.NumpyJSONEncoder.default(self, obj)


    def get_ref(self, obj):
        self._models[obj._id] = obj
        return {
                'type': obj.__view_model__,
                'id': obj._id
                }

    def make_id(self, obj):
        return str(uuid.uuid4())

    def serialize(self, obj, **jsonkwargs):
        """ Returns a string representing the JSON encoded object.
        References to other objects/instances is ended by a "ref"
        has encoding the type and UUID of the object.

        For all HTML sessions, the serialization protocol is JSON.
        How we produce references is actually more involved, because
        it may differ between server-based models versus embedded.
        """

        try:
            self.PlotObjEncoder.session = self
            jsondata = protocol.serialize_json(
                obj,
                encoder=self.PlotObjEncoder,
                **jsonkwargs)
        finally:
            self.PlotObjEncoder.session = None
        return jsondata

class HTMLFileSession(BaseHTMLSession):
    """ Produces a pile of static HTML, suitable for exporting a plot
    as a standalone HTML file.  This includes a template around the
    plot and includes all the associated JS and CSS for the plot.
    """

    title = "Bokeh Plot"

    # The root directory for the CSS files
    css_files = [
        "js/vendor/bootstrap/bootstrap-bokeh-2.0.4.css",
        "css/bokeh.css",
        "css/continuum.css",
    ]

    # TODO: Why is this not in bokehjs_dir, but rather outside of it?
    js_files = ["js/bokeh.js"]

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
        self.raw_js_objs = []

    # FIXME: move this to css_paths, js_paths to base class?
    def css_paths(self, as_url=False):
        return [join(self.server_static_dir, d) for d in self.css_files]

    def js_paths(self, as_url=False, unified=True, min=True):
        # TODO: Handle unified and minified options
        return [join(self.server_static_dir, d) for d in self.js_files]

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
        elementid = str(uuid.uuid4())

        # Manually convert our top-level models into dicts, before handing
        # them in to the JSON encoder.  (We don't want to embed the call to
        # vm_serialize into the PlotObjEncoder, because that would cause
        # all the attributes to be duplicated multiple times.)
        models = []
        for m in self._models.itervalues():
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        jscode = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = pc_ref["id"],
                    modeltype = pc_ref["type"],
                    all_models = self.serialize(models),
                )
        div = self._load_template(self.div_template).render(
                    elementid = elementid
                )

        if rootdir is None:
            rootdir = self.rootdir

        if js == "inline" or (js is None and self.inline_js):
            # TODO: Are the UTF-8 decodes really necessary?
            rawjs = self._inline_scripts(self.js_paths()).decode("utf-8")
            jsfiles = []
        else:
            rawjs = None
            jsfiles = [os.path.relpath(p,rootdir) for p in self.js_paths()]

        if css == "inline" or (css is None and self.inline_css):
            # TODO: Are the UTF-8 decodes really necessary?
            rawcss = self._inline_css(self.css_paths()).decode("utf-8")
            cssfiles = []
        else:
            rawcss = None
            cssfiles = [os.path.relpath(p,rootdir) for p in self.css_paths()]

        plot_div = self._load_template(self.div_template).render(
            elementid=elementid
            )


# jscode is the one I want

        html = self._load_template(self.html_template).render(
                    js_snippets = [jscode],
                    html_snippets = [div] + [o.get_raw_js() for o in self.raw_js_objs],
                    rawjs = rawjs, rawcss = rawcss,
                    jsfiles = jsfiles, cssfiles = cssfiles,
                    title = self.title)
        return html

    def embed_js(self, plot_id, static_root_url):

        # FIXME: Handle this more intelligently
        pc_ref = self.get_ref(self.plotcontext)
        elementid = str(uuid.uuid4())

        models = []
        for m in self._models.itervalues():
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        jscode = self._load_template('embed_direct.js').render(
            host = "",
            static_root_url=static_root_url,
            elementid = elementid,
            modelid = pc_ref["id"],
            modeltype = pc_ref["type"],
            plotid = plot_id,  all_models = self.serialize(models))
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
        with open(filename, "w") as f:
            f.write(s.encode("utf-8"))
        return

    def view(self, do_save=True, new=False, autoraise=True):
        """ Opens a browser to view the file pointed to by this sessions.
        Automatically triggers a save by default.

        **new** can be None, "tab", or "window" to view the file in the
        existing page, a new tab, or a new windows.  **autoraise** causes
        the browser to be brought to the foreground; this may happen
        automatically on some platforms regardless of the setting of this
        variable.
        """
        import webbrowser
        if do_save:
            self.save()
        newmap = {False: 0, "window": 1, "tab": 2}
        file_url = "file://" + abspath(self.filename)
        webbrowser.open(file_url, new = newmap[new], autoraise=autoraise)

    def dumpjson(self, pretty=True, file=None):
        """ Returns a JSON string representing the contents of all the models
        stored in this session, or write it to a file object or file name.

        If **pretty** is True, then return a string suitable for human reading,
        otherwise returns a compact string.

        If a file object is provided, then the output is appended to it.  If a
        file name is provided, then it opened for overwrite, and not append.

        Mostly intended to be used for debugging.
        """
        models = []
        for m in self._models.itervalues():
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)
        if pretty:
            indent = 4
        else:
            indent = None
        s = self.serialize(models, indent=indent)
        if file is not None:
            if isinstance(file, basestring):
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

class PlotContext(PlotObject):
    children = List(has_ref=True)

class PlotList(PlotContext):
    # just like plot context, except plot context has special meaning
    # everywhere, so plotlist is the generic one
    pass

class PlotServerSession(BaseHTMLSession):


    def __init__(self, username=None, serverloc=None, userapikey="nokey"):
        # This logic is based on ContinuumModelsClient.__init__ and
        # mpl.PlotClient.__init__.  There is some merged functionality here
        # since a Session is meant to capture the little bit of lower-level
        # logic in PlotClient (i.e. avoiding handling of things like
        # _newxyplot()), but also build in the functionality of the
        # ContinuumModelsClient.

        self.username = username
        self.root_url = serverloc
        self.http_session = requests.session()
        self.http_session.headers.update({
            'content-type':'application/json',
            'BOKEHUSER-API-KEY' : userapikey,
            'BOKEHUSER' : username})

        if self.root_url:
            url = urlparse.urljoin(self.root_url, '/bokeh/userinfo/')
            self.userinfo = utils.get_json(self.http_session.get(url, verify=False))
        else:
            logger.info('Not using a server, plots will only work in embedded mode')
            self.userinfo = None

        self.docid = None
        self.plotcontext = None
        self.apikey = None
        self.bbclient = None   # reference to a ContinuumModelsClient
        self.base_url = urlparse.urljoin(self.root_url, "/bokeh/bb/")
        self.raw_js_objs = []
        super(PlotServerSession, self).__init__()

    #------------------------------------------------------------------------
    # Document-related operations
    #------------------------------------------------------------------------
    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

    def load_doc(self, docid):
        url = urlparse.urljoin(self.root_url,"/bokeh/getdocapikey/%s" % docid)
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
        return

    def make_doc(self, title):
        url = urlparse.urljoin(self.root_url,"/bokeh/doc/")
        data = protocol.serialize_web({'title' : title})
        response = self.http_session.post(url, data=data, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = utils.get_json(response)

    def remove_doc(self, title):
        matching = [x for x in self.userinfo['docs'] \
                    if x.get('title') == title]
        docid = matching[0]['docid']
        url = urlparse.urljoin(self.root_url,"/bokeh/doc/%s/" % docid)
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

    #------------------------------------------------------------------------
    # functions for loading json into models
    # we have 2 types of json data, if all the models are of one type, then
    # we just have a list of model attributes
    # otherwise, we have what we refer to as broadcast_json, which are of the form
    # {'type':typename, 'attributes' : attrs}
    #------------------------------------------------------------------------

    def load_attrs(self, typename, attrs, events='existing'):
        broadcast_attrs = [dict(type=typename, attributes=x) for x in attrs]
        return self.load_broadcast_attrs(broadcast_attrs, events=events)

    def load_broadcast_attrs(self, attrs, events='existing'):
        """events can be 'existing', or None. 'existing' means
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
        attrs = []
        for m in to_store:
            attr = m.vm_serialize()
            attr['doc'] = self.docid
            attr['id'] = m._id
            attrs.append(attr)
        return attrs

    def broadcast_attrs(self, to_store):
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
        return self.store_objs([obj])

    def store_broadcast_attrs(self, attrs):
        data = self.serialize(attrs)
        url = utils.urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.http_session.post(url, data=data)

    def store_objs(self, to_store):
        models = self.broadcast_attrs(to_store)
        self.store_broadcast_attrs(models)
        for m in to_store:
            m._dirty = False

    def store_all(self):
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_dirty') and x._dirty]
        self.store_objs(to_store)
        return to_store


    #------------------------------------------------------------------------
    # Loading models
    #------------------------------------------------------------------------

    def load_all(self, asdict=False):
        """the json coming out of this looks different than that coming
        out of load_type, because it contains id, type, attributes, whereas
        the other one just contains attributes directly
        """
        url = utils.urljoin(self.base_url, self.docid +"/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content)
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
        attrs = protocol.deserialize_json(self.http_session.get(url).content)
        if not asdict:
            models = self.load_attrs(typename, attrs)
            for m in models:
                m._dirty = False
            return models
        else:
            models = attrs
        return models

    def load_obj(self, ref, asdict=False, modelattrs={}):
        """loads an object from the server.
        if asdict:
            only the json is returned.
        else:
            update the existing copy in _models if it is present
            instantiate a new one if it is not
            and make sure to convert all references into models
        in the conversion from json to objects, sometimes references
        to models need to be resolved.  If there are any json attributes
        being processed, you can pass them in as modelattrs
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
    def callbacks_json(self, to_store):
        all_data = []
        for m in to_store:
            data = self.get_ref(m)
            data['callbacks'] = m._callbacks
            all_data.append(data)
        return all_data

    def load_callbacks_json(self, callback_json):
        for data in callback_json:
            m = self._models[data['id']]
            m._callbacks = {}
            for attrname, callbacks in data['callbacks'].iteritems():
                for callback in callbacks:
                    obj = self._models[callback['obj']['id']]
                    callbackname = callback['callbackname']
                    m.on_change(attrname, obj, callbackname)

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

    def store_all_callbacks(self):
        to_store = [x for x in self._models.values() \
                    if hasattr(x, '_callbacks_dirty') and x._callbacks_dirty]
        self.store_callbacks(to_store)
        return to_store

    #managing callbacks

    def disable_callbacks(self, models=None):
        if models is None:
            models = self._models.itervalues()
        for m in models:
            m._block_callbacks = True

    def enable_callbacks(self, models=None):
        if models is None:
            models = self._models.itervalues()

        for m in models:
            m._block_callbacks = False

    def clear_callback_queue(self, models=None):
        if models is None:
            models = self._models.itervalues()
        for m in models:
            del m._callback_queue[:]

    def execute_callback_queue(self, models=None):
        if models is None:
            models = self._models.itervalues()
        for m in models:
            for cb in m._callback_queue:
                m._trigger(*cb)
            del m._callback_queue[:]
    #------------------------------------------------------------------------
    # Static files
    #------------------------------------------------------------------------

    def css_paths(self, as_urls=True):
        """ Returns a list of URLs or file paths for CSS files """
        # This should coordinate with the running plot server and use some
        # mechanism to query this information from it.
        raise NotImplementedError

    def js_paths(self, as_urls=True):
        raise NotImplementedError


class NotebookSessionMixin(object):
    # The root directory for the CSS files
    css_files = [
        "js/vendor/bootstrap/bootstrap-bokeh-2.0.4.css",
        "css/bokeh.css",
        "css/continuum.css",
    ]

    # TODO: Why is this not in bokehjs_dir, but rather outside of it?
    js_files = ["js/bokeh.js"]

    js_template = "plots.js"
    div_template = "plots.html"
    html_template = "basediv.html"     # template for the entire HTML file

    def css_paths(self, as_url=False):
        # TODO: Fix the duplication of this method from HTMLFileSession.
        # Perhaps move this into BaseHTMLSession.. but a lot of other
        # things would need to move as well.
        return [join(self.server_static_dir, d) for d in self.css_files]

    def js_paths(self):
        # For notebook session, we rely on a unified bokehJS file,
        # that is not located in the BokehJS subtree
        return [join(self.server_static_dir, d) for d in self.js_files]

    def dumps(self, objects):
        """ Returns the HTML contents as a string
        FIXME : signature different than other dumps
        FIXME: should consolidate code between this one and that one.
        """
        if len(objects) == 0:
            objects = self._models.values()
        if len(objects) == 1 and isinstance(objects[0], Plot):
            the_plot = objects[0]
            objects = self._models.values()
        else:
            the_plot = [m for m in objects if isinstance(m, Plot)][0]
        plot_ref = self.get_ref(the_plot)
        elementid = str(uuid.uuid4())

        # Manually convert our top-level models into dicts, before handing
        # them in to the JSON encoder.  (We don't want to embed the call to
        # vm_serialize into the PlotObjEncoder, because that would cause
        # all the attributes to be duplicated multiple times.)
        models = []
        for m in objects:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        js = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = plot_ref["id"],
                    modeltype = plot_ref["type"],
                    all_models = self.serialize(models),
                )
        plot_div = self._load_template(self.div_template).render(
            elementid=elementid
            )
        html = self._load_template(self.html_template).render(
                                           html_snippets=[plot_div],
                                           elementid = elementid,
                                           js_snippets = [js],
                                           )
        return html.encode("utf-8")

        plot_ref = self.get_ref(the_plot)
        elementid = str(uuid.uuid4())

        # Manually convert our top-level models into dicts, before handing
        # them in to the JSON encoder.  (We don't want to embed the call to
        # vm_serialize into the PlotObjEncoder, because that would cause
        # all the attributes to be duplicated multiple times.)
        models = []
        for m in objects:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)

        js = self._load_template(self.js_template).render(
                    elementid = elementid,
                    modelid = plot_ref["id"],
                    modeltype = plot_ref["type"],
                    all_models = self.serialize(models),
                )
        plot_div = self._load_template(self.div_template).render(
            elementid=elementid
            )
        html = self._load_template(self.html_template).render(
                                           html_snippets=[plot_div],
                                           elementid = elementid,
                                           js_snippets = [js],
                                           )
        return html.encode("utf-8")

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
        
        html = self.dumps(objects)
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None


class NotebookSession(NotebookSessionMixin, HTMLFileSession):
    """ Produces inline HTML suitable for placing into an IPython Notebook.
    """

    def __init__(self, plot=None):
        HTMLFileSession.__init__(self, filename=None, plot=plot)
        self.plotcontext = PlotContext()

    def notebooksources(self):
        import IPython.core.displaypub as displaypub
        # Normally this would call self.js_paths() to build a list of
        # scripts or get a reference to the unified/minified JS file,
        # but our static JS build process produces a single unified
        # bokehJS file for inclusion in the notebook.
        js_paths = self.js_paths()
        css_paths = self.css_paths()
        html = self._load_template(self.html_template).render(
            rawjs=self._inline_scripts(js_paths).decode('utf8'),
            rawcss=self._inline_css(css_paths).decode('utf8'),
            js_snippets=[],
            html_snippets=["<p>Configuring embedded BokehJS mode.</p>"])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None


class NotebookServerSession(NotebookSessionMixin, PlotServerSession):
    """ An IPython Notebook session that is connected to a plot server.
    """
    def ws_conn_string(self):
        split = urlparse.urlsplit(self.root_url)
        #how to fix this in bokeh and wakari?
        if split.scheme == 'http':
            return "ws://%s/bokeh/sub" % split.netloc
        else:
            return "wss://%s/bokeh/sub" % split.netloc

    def dumps(self, objects):
        """ Returns the HTML contents as a string
        FIXME : signature different than other dumps
        FIXME: should consolidate code between this one and that one.
        """
        if len(objects) == 0:
            objects = self._models.values()
        if len(objects) == 1 and isinstance(objects[0], Plot):
            the_plot = objects[0]
            objects = self._models.values()
        else:
            the_plot = [m for m in objects if isinstance(m, Plot)][0]
        return the_plot.create_html_snippet(server=True)

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
        
        html = self.dumps(objects)
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None

    def notebook_connect(self):
        if self.docname is None:
            raise RuntimeError("usedoc() must be called before notebook_connect()")
        import IPython.core.displaypub as displaypub
        msg = """<p>Connecting notebook to document "%s" at server %s</p>""" % \
                (self.docname, self.root_url)
        displaypub.publish_display_data('bokeh', {'text/html': msg})
        return None





