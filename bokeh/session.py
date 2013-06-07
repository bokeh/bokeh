""" Defines the base PlotSession and some example session types.
"""

from exceptions import DataIntegrityException
from os.path import abspath, split, join
import os.path
import json
import logging
import urlparse
import uuid

import requests

from bokeh import protocol, utils
from bokeh.objects import PlotObject, Plot
from bokeh.properties import List

logger = logging.getLogger(__file__)

class Session(object):
    """ Sessions provide a sandbox or facility in which to manage the "live"
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
        self._models = set()

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
            obj.session = self
        self._models.update(objects)

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

    #------------------------------------------------------------------------
    # Serialization 
    #------------------------------------------------------------------------

    class PlotObjEncoder(protocol.NumpyJSONEncoder):
        """ Helper class we'll use to encode PlotObjects 
        
        Note that since json.dumps() takes a *class* as an argument and
        not an instance, when this encoder class is used, the Session
        instance is set as a class-level attribute.  Kind of weird, and
        should be better handled via a metaclass.
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
        # Eventually should use our own memo instead of storing
        # an attribute on the class
        if not getattr(obj, "_id", None):
            obj._id = self.make_id(obj)

        self._models.add(obj)

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
            jsondata = protocol.serialize_json(obj, encoder=self.PlotObjEncoder,
                            **jsonkwargs)
        finally:
            self.PlotObjEncoder.session = None
        return jsondata


class HTMLFileSession(BaseHTMLSession):
    """ Produces a pile of static HTML, suitable for exporting a plot
    as a standalone HTML file.  This includes a template around the
    plot and includes all the associated JS and CSS for the plot.
    """


    # The root directory for the CSS files
    css_files = ["css/bokeh.css", "css/continuum.css",
                 "vendor/bootstrap/css/bootstrap.css"]

    # TODO: Why is this not in bokehjs_dir, but rather outside of it?
    js_files = ["../../js/application.js"]

    # Template files used to generate the HTML
    template_dir = join(abspath(split(__file__)[0]), "templates")
    js_template = "plots.js"
    div_template = "plots.html"     # template for just the plot <div>
    html_template = "base.html"     # template for the entire HTML file

    def __init__(self, filename="bokehplot.html", plot=None):
        self.filename = filename
        super(HTMLFileSession, self).__init__(plot=plot)
    
    @property
    def bokehjs_dir(self):
        return getattr(self, "_bokehjs_dir", 
                join(BaseHTMLSession.server_static_dir, "vendor/bokehjs"))

    @bokehjs_dir.setter
    def bokehjs_dir(self, val):
        self._bokehjs_dir = val

    def css_paths(self, as_url=False):
        return [join(self.bokehjs_dir, d) for d in self.css_files]
    
    def js_paths(self, as_url=False, unified=True, min=True):
        return [join(self.bokehjs_dir, d) for d in self.js_files]

    def _load_template(self, filename):
        import jinja2
        with open(join(self.template_dir, filename)) as f:
            return jinja2.Template(f.read())
    
    def dumps(self, js="inline", css="inline", 
                rootdir=abspath(split(__file__)[0])):
        """ Returns the HTML contents as a string 
        
        **js** and **css** can be "inline" or "relative". In the latter case,
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.
        """
        # FIXME: Handle this more intelligently
        the_plot = [m for m in self._models if isinstance(m, Plot)][0]
        plot_ref = self.get_ref(the_plot)
        elementid = str(uuid.uuid4())

        # Manually convert our top-level models into dicts, before handing
        # them in to the JSON encoder.  (We don't want to embed the call to
        # vm_serialize into the PlotObjEncoder, because that would cause
        # all the attributes to be duplicated multiple times.)
        models = []
        for m in self._models:
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
        div = self._load_template(self.div_template).render(
                    elementid = elementid
                )
        
        if js == "inline":
            rawjs = self._inline_scripts(self.js_paths()).decode("utf-8")
            jsfiles = []
        else:
            rawjs = None
            jsfiles = [os.path.relpath(p,rootdir) for p in self.js_paths()]
        
        if css == "inline":
            rawcss = self._inline_css(self.css_paths()).decode("utf-8")
            cssfiles = []
        else:
            rawcss = None
            cssfiles = [os.path.relpath(p,rootdir) for p in self.css_paths()]

        html = self._load_template(self.html_template).render(
                    js_snippets = [js],
                    html_snippets = [div],
                    # TODO: Are the UTF-8 decodes really necessary?
                    rawjs = rawjs, rawcss = rawcss,
                    jsfiles = jsfiles, cssfiles = cssfiles)
        return html

    def _inline_scripts(self, paths):
        # Copied from dump.py, which itself was from wakariserver
        if len(paths) == 0:
            return ""
        strings = []
        for script in paths:
            f_name = join(self.server_static_dir, script)
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


    def save(self, filename=None, js="inline", css="inline",
                rootdir=abspath(split(__file__)[0])):
        """ Saves the file contents.  Uses self.filename if **filename**
        is not provided.  Overwrites the contents.

        **js** and **css** can be "inline" or "relative". In the latter case,
        **rootdir** can be specified to indicate the base directory from which
        the path to the various static files should be computed.
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

    def dumpjson(self, pretty=True):
        """ Returns a JSON string representing the contents of all the models
        stored in this session.  If **pretty** is True, then return a string
        suitable for human reading, otherwise returns a compact string.
        Mostly used for debugging.
        """
        models = []
        for m in self._models:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            ref["attributes"].update({"id": ref["id"], "doc": None})
            models.append(ref)
        if pretty:
            indent = 4
        else:
            indent = None
        return self.serialize(models, indent=indent)


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


class PlotServerSession(BaseHTMLSession):

    class PlotContext(PlotObject):
        children = List

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

        super(PlotServerSession, self).__init__()

    #------------------------------------------------------------------------
    # Document-related operations
    #------------------------------------------------------------------------

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
        url = urlparse.urljoin(self.root_url, "/bokeh/bb/")
        # TODO: Load the full document. For now, just load the PlotContext
        url = urlparse.urljoin(self.base_url, self.docid+"/PlotContext/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content)
        if len(attrs) == 0:
            logger.warning("Unable to load PlotContext for doc ID %s" % self.docid)
        else:
            self.plotcontext = PlotServerSession.PlotContext(id=attrs[0]["id"])
            if len(attrs) > 1:
                logger.warning("Found more than one PlotContext for doc ID %s; " \
                        "Using PlotContext ID %s" % (self.docid, attrs[0]["id"]))
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
        response = self.session.delete(url, verify=False)
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

    def store_obj(self, obj, ref=None):
        """ Uploads the object state and attributes to the server represented
        by this session.

        **ref** is a dict containing keys "type" and "id"; by default, the
        ref is retrieved/computed from **obj** itself.
        """
        if ref is None:
            ref = self.get_ref(obj)
        if ref is not None and ("type" not in ref or "id" not in ref):
            raise ValueError("ref needs to have both 'type' and 'id' keys")

        data = obj.vm_serialize()
        # It might seem redundant to include both of these, but the server
        # doesn't do the right thing unless these are included.
        data["id"] = ref["id"]
        data["doc"] = self.docid

        # This is copied from ContinuumModelsClient.buffer_sync(), .update(),
        # and .upsert_all().
        # TODO: Handle the include_hidden stuff.
        url = utils.urljoin(self.base_url, self.docid + "/" + ref["type"] +\
                "/" + ref["id"] + "/")
        self.http_session.put(url, data=self.serialize(data))

    def load_obj(self, ref, asdict=False):
        """ Unserializes the object given by **ref**, into a new object
        of the type in the serialization.  If **asdict** is True,
        then the raw dictionary (including object type and ref) is 
        returned, and no new object is instantiated.
        """
        # TODO: Do URL and path stuff to read json data from persistence 
        # backend into jsondata string
        jsondata = None
        attrs = protocol.deserialize_json(jsondata)
        if asdict:
            return attrs
        else:
            from bokeh.objects import PlotObject
            objtype = attrs["type"]
            ref_id = attrs["id"]
            cls = PlotObject.get_class(objtype)
            newobj = cls(id=ref_id)
            # TODO: finish this...
            return newobj

    def store_all(self):
        models = []
        # Look for the Plot to stick into here. PlotContexts only
        # want things with a corresponding BokehJS View, so Plots and
        # GridPlots for now.
        theplot = [x for x in self._models if isinstance(x, Plot)][0]
        self.plotcontext.children = [theplot]
        for m in list(self._models) + [self.plotcontext]:
            ref = self.get_ref(m)
            ref["attributes"] = m.vm_serialize()
            # FIXME: Is it really necessary to add the id and doc to the
            # attributes dict? It shows up in the bbclient-based JSON
            # serializations, but I don't understand why it's necessary.
            ref["attributes"].update({"id": ref["id"], "doc": self.docid})
            models.append(ref)
        data = self.serialize(models)
        url = utils.urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.http_session.post(url, data=data)

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



class NotebookSession(HTMLFileSession):
    """ Produces inline HTML suitable for placing into an IPython Notebook.
    """

    # Most of these were formerly defined in dump.py, which was ported over
    # from Wakari.
    notebookscript_paths = ["js/bokehnotebook.js"]

    def __init__(self, plot=None):
        HTMLFileSession.__init__(self, filename=None, plot=plot)

    def ws_conn_string(self):
        split = urlparse.urlsplit(self.root_url)
        #how to fix this in bokeh and wakari?
        if split.scheme == 'http':
            return "ws://%s/bokeh/sub" % split.netloc
        else:
            return "wss://%s/bokeh/sub" % split.netloc
   
    def notebook_connect(self):
        import IPython.core.displaypub as displaypub
        js = self._load_template('connect.js').render(
            username=self.username,
            root_url = self.root_url,
            docid=self.docid,
            docapikey=self.apikey,
            ws_conn_string=self.ws_conn_string()
            )
        msg = """ <p>Connection Information for this %s document, only share with people you trust </p> """  % self.docname

        script_paths = self.js_paths()
        css_paths = self.css_paths()
        html = self._load_template("basediv.html").render(
            rawjs=self._inline_scripts(script_paths).decode('utf8'),
            rawcss=self._inline_css(css_paths).decode('utf8'),
            js_snippets=[js],
            html_snippets=[msg])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None
 
    def notebooksources(self):
        import IPython.core.displaypub as displaypub        
        script_paths = NotebookSession.notebookscript_paths
        css_paths = self.css_paths()
        html = self._load_template("basediv.html").render(
            rawjs=self._inline_scripts(script_paths).decode('utf8'),
            rawcss=self._inline_css(css_paths).decode('utf8'),
            js_snippets=[],
            html_snippets=["<p>Bokeh Sources</p>"])
        displaypub.publish_display_data('bokeh', {'text/html': html})
        return None

    class PlotDisplay(object):

        def __init__(self, session, objects):
            self.session = session
            self.objects = objects

        def _repr_html(self):
            sess = self.session

            # model = ???
            eid = str(uuid.uuid4())
            plot_js = sess._load_template("plots.js").render(
                        elementid=eid, modelid=model.id,
                        all_models=sess.serialize(self.objects),
                        modeltype= model.typename)
            plot_div = sess._load_template("plots.html").render(elementid=eid)
            html = sess._load_template("basediv.html").render(
                    script_paths = sess._inline_scripts(sess.js_paths()).decode("utf8"),
                    css_paths = sess._inline_css(sess.css_paths()).decode("utf8"),
                    js_snippets = [plot_js],
                    html_snippets = [plot_div])
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
        
        if len(objects) == 0:
            objects = self._models
        return PlotDisplay(self, objects)


class WakariSession(PlotServerSession):
    """ Suitable for running on the Wakari.io service.  Includes default
    paths and plot data server configurations which are appropriate for
    a user account on Wakari.
    """



