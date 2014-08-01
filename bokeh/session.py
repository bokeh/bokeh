from __future__ import absolute_import, print_function

import json
from os import makedirs
from os.path import expanduser, exists, join
import tempfile
from . import protocol
try:
    import pandas as pd
    import tables
except ImportError as e:
    pass

from six.moves.urllib.parse import urljoin, urlencode
from .exceptions import DataIntegrityException
from .document import merge, Document
from .embed import autoload_server
from . import utils, browserlib
from bokeh.objects import ServerDataSource
import logging

logger = logging.getLogger(__name__)

DEFAULT_SERVER_URL = "http://localhost:5006/"

BOKEHPLOTS_URL = "http://bokehplots.com/"

class Session(object):
    """ Session objects encapsulate a connection to a document stored on
    a Bokeh Server

    Args:
        name (str, optional) : name of server
        root_url (str, optional) : root_url of server
        userapikey (str, optional) : (default: "nokey")
            if userapikey is "nokey"
        username (str, optional) : (default: "defaultuser")
            if username is "defaultuser"
        load_from_config (bool, optional) : whether to load login information from config. (default: True)
            if load_from_config is False, then we may overwrite the
            users config with this data
        configdir (str) :
    """
    def __init__(
            self,
            name             = DEFAULT_SERVER_URL,
            root_url         = DEFAULT_SERVER_URL,
            userapikey       = "nokey",
            username         = "defaultuser",
            load_from_config = True,
            configdir        = None,
        ):

        self.name = name
        if not root_url.endswith("/"):
            logger.warning("root_url should end with a /, adding one")
            root_url = root_url + "/"
        self.root_url = root_url
        #single user mode case
        self.userapikey = userapikey
        self.username = username
        self._configdir = None
        if configdir:
            self.configdir = configdir
        if load_from_config:
            self.load()

    @property
    def http_session(self):
        if hasattr(self, "_http_session"):
            return self._http_session
        else:
            import requests
            self._http_session = requests.session()
            return self._http_session

    @property
    def username(self):
        return self.http_session.headers.get('BOKEHUSER')

    @username.setter
    def username(self, val):
        self.http_session.headers.update({'BOKEHUSER': val})

    @property
    def userapikey(self):
        return self.http_session.headers.get('BOKEHUSER-API-KEY')

    @userapikey.setter
    def userapikey(self, val):
        self.http_session.headers.update({'BOKEHUSER-API-KEY': val})

    @property
    def configdir(self):
        """ filename where our config are stored. """
        if self._configdir:
            return self._configdir
        bokehdir = join(expanduser("~"), ".bokeh")
        if not exists(bokehdir):
            makedirs(bokehdir)
        return bokehdir

    #for testing
    @configdir.setter
    def configdir(self, path):
        self._configdir = path

    @property
    def configfile(self):
        return join(self.configdir, "config.json")

    def load_dict(self):
        configfile = self.configfile
        if not exists(configfile):
            data = {}
        else:
            with open(configfile, "r") as f:
                data = json.load(f)
        return data

    def load(self):
        """loads server configuration information from disk
        """
        config_info = self.load_dict().get(self.name, {})
        print("Using saved session configuration for %s" % self.name)
        print("To override, pass 'load_from_config=False' to Session")
        self.root_url = config_info.get('root_url', self.root_url)
        self.userapikey = config_info.get('userapikey', self.userapikey)
        self.username = config_info.get('username', self.username)

    def save(self):
        """Saves server configuration information to json
        """
        data = self.load_dict()
        data[self.name] = {'root_url': self.root_url,
                           'userapikey': self.userapikey,
                           'username': self.username}
        configfile = self.configfile
        with open(configfile, "w+") as f:
            json.dump(data, f)
        return

    def register(self, username, password):
        url = urljoin(self.root_url, "bokeh/register")
        result = self.http_session.post(url, data={
                'username': username,
                'password': password,
                'api': 'true'
                })
        if result.status_code != 200:
            raise RuntimeError("Unknown Error")
        result = utils.get_json(result)
        if result['status']:
            self.username = username
            self.userapikey = result['userapikey']
            self.save()
        else:
            raise RuntimeError(result['error'])

    def login(self, username, password):
        url = urljoin(self.root_url, "bokeh/login")
        result = self.http_session.post(url, data={
                'username': username,
                'password': password,
                'api': 'true'
                })
        if result.status_code != 200:
            raise RuntimeError("Unknown Error")
        result = utils.get_json(result)
        if result['status']:
            self.username = username
            self.userapikey = result['userapikey']
            self.save()
        else:
            raise RuntimeError(result['error'])
        self.save()

    def browser_login(self):
        """Opens a web browser with a token that logs you
        in to a bokeh server (for multi-user mode)
        """
        controller = browserlib.get_browser_controller()
        url = urljoin(self.root_url, "bokeh/loginfromapikey")
        url += "?" + urlencode({'username': self.username,
                                'userapikey': self.userapikey})
        controller.open(url)

    def _prep_data_source_df(self, name, dataframe):
        name = tempfile.NamedTemporaryFile(prefix="bokeh_data",
                                           suffix=".pandas").name
        store = pd.HDFStore(name)
        store.append("__data__", dataframe, format="table", data_columns=True)
        store.close()
        return name

    def _prep_data_source_numpy(self, name, arr):
        name = tempfile.NamedTemporaryFile(prefix="bokeh_data",
                                           suffix=".table").name
        store = tables.File(name, 'w')
        store.createArray("/", "__data__", obj=arr)
        store.close()
        return name

    def data_source(self, name, dataframe=None, array=None):
        """Makes a server data source and uploads it to the server
        The server must be configured with a data directory
        for this to work
        """
        if dataframe is not None:
            fname = self._prep_data_source_df(name, dataframe)
            target_name = name + ".pandas"
        else:
            fname = self._prep_data_source_numpy(name, array)
            target_name = name + ".table"
        url = urljoin(self.root_url,
                      "bokeh/data/upload/%s/%s" % (self.username, target_name))
        with open(fname) as f:
            result = self.http_session.post(url, files={'file' : (target_name, f)})
        return ServerDataSource(owner_username=self.username, data_url=result.content)

    def list_data(self):
        url = urljoin(self.root_url, "bokeh/data/" + self.username)
        result = self.http_session.get(url)
        result = utils.get_json(result)
        sources = result['sources']
        return sources

    def execute_json(self, method, url, headers=None, **kwargs):
        """Executes a http request using the current session, and returns
        the json response (assuming the endpoint returns json)
        Args:
            method (string) : 'get' or 'post'
            url (string) : url
            headers (dict, optional) : any extra headers
            **kwargs : any extra arguments that should be passed into
                the requests library
        """
        if headers is None:
            headers={'content-type':'application/json'}
        func = getattr(self.http_session, method)
        import requests
        import warnings
        try:
            resp = func(url, headers=headers, **kwargs)
        except requests.exceptions.ConnectionError as e:
            warnings.warn("You need to start the bokeh-server to see this example.")
            raise e
        if resp.status_code == 409:
            raise DataIntegrityException
        if resp.status_code == 401:
            raise Exception('HTTP Unauthorized accessing')
        return utils.get_json(resp)

    def get_json(self, url, headers=None, **kwargs):
        return self.execute_json('get', url, headers=headers, **kwargs)

    def post_json(self, url, headers=None, **kwargs):
        return self.execute_json('post', url, headers=headers, **kwargs)

    @property
    def userinfo(self):
        if not hasattr(self, "_userinfo"):
            url = urljoin(self.root_url, 'bokeh/userinfo/')
            self._userinfo = self.get_json(url)
        return self._userinfo

    @userinfo.setter
    def userinfo(self, val):
        self._userinfo = val

    @property
    def base_url(self):
        return urljoin(self.root_url, "bokeh/bb/")

    def get_api_key(self, docid):
        """Retrive the document apikey from the server
        Args:
            docid (string) : docid you want the api key for
        Returns:
            apikey : string
        """
        url = urljoin(self.root_url,"bokeh/getdocapikey/%s" % docid)
        apikey = self.get_json(url)
        if 'apikey' in apikey:
            apikey = apikey['apikey']
            logger.info('got read write apikey')
        else:
            apikey = apikey['readonlyapikey']
            logger.info('got read only apikey')
        return apikey

    def find_doc(self, name):
        """Finds the document with a title matching name and returns the docid
        Creates a document with the given title if one is not found
        Args:
            name (string) : name/title of document
        Returns:
            docid (string)
        """

        docs = self.userinfo.get('docs')
        matching = [x for x in docs if x.get('title') == name]
        if len(matching) == 0:
            logger.info("No documents found, creating new document '%s'" % name)
            self.make_doc(name)
            return self.find_doc(name)
        elif len(matching) > 1:
            logger.warning("Multiple documents with name '%s'" % name)
        docid = matching[0]['docid']
        return docid

    def use_doc(self, name=None, docid=None):
        """configures the session to use a document.  you can pass in
        a title, or a docid, but not both.  Creates a document for
        title if one is not present on the server
        """
        if docid:
            self.docid = docid
        else:
            self.docid = self.find_doc(name)
        self.apikey = self.get_api_key(self.docid)

    def make_doc(self, title):
        """makes a document matching title on the server, then
        reloads user infomation
        """
        url = urljoin(self.root_url,"bokeh/doc/")
        data = protocol.serialize_json({'title' : title})
        self.userinfo = self.post_json(url, data=data)

    def pull(self, typename=None, objid=None):
        """lowever level function for pulling json objects,
        you need to call this with either typename AND objid
        or leave out both
        """
        if typename is None and objid is None:
            url = utils.urljoin(self.base_url, self.docid +"/")
            attrs = self.get_json(url)
        elif typename is None or objid is None:
            raise ValueError("typename and objid must both be None, or neither.")
        else:
            url = utils.urljoin(
                self.base_url,
                self.docid + "/" + typename + "/" + objid + "/"
            )
            attr = self.get_json(url)
            attrs = [{
                'type': typename,
                'id': objid,
                'attributes': attr
            }]
        return attrs

    def push(self, *jsonobjs):
        """Lower level function for pushing raw json objects
        to the server
        """
        data = protocol.serialize_json(jsonobjs)
        url = utils.urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.post_json(url, data=data)

    # convenience functions to use a session and store/fetch from server
    # where should this go?

    def load_document(self, doc):
        """higher level function for pulling all data for
        the docid for this session, and then merging it into
        the doc that was passed in
        """

        json_objs = self.pull()
        plot_contexts = [x for x in json_objs if x['type'] == 'PlotContext']
        other_objects = [x for x in json_objs if x['type'] != 'PlotContext']
        plot_context_json = plot_contexts[0]
        children = set([x['id'] for x in plot_context_json['attributes']['children']])
        for child in doc._plotcontext.children:
            ref = child.get_ref()
            if ref['id'] not in children:
                plot_context_json['attributes']['children'].append(child.get_ref())
        doc.docid = self.docid
        doc._plotcontext._id = plot_context_json['id']
        doc.load(plot_context_json, *other_objects)

    def load_object(self, obj, document):
        """pulls an objects json from the server,
        loads it into the document. the object should be updated
        since it's inside document._models
        Args:
            obj : object to be updated.. this is used just for typename and id
            document : document instance.  object should be inside the document
        """
        assert obj._id in document._models
        attrs = self.pull(typename=obj.__view_model__, objid=obj._id)
        document.load(*attrs)
        return

    def store_document(self, doc, dirty_only=True):
        """higher level function for storing a doc on the server
        """
        models = doc._models.values()
        if dirty_only:
            models = [x for x in models if hasattr(x, '_dirty') and x._dirty]
        json_objs = doc.dump(*models)
        self.push(*json_objs)
        for model in models:
            model._dirty = False
        return models

    def store_objects(self, *objs, **kwargs):
        """higher level function for storing a plot objects
        on the server
        """
        dirty_only = kwargs.pop('dirty_only', True)
        models = set()
        for obj in objs:
            models.update(obj.references())
        if dirty_only:
            models = list(models)

        json_objs = utils.dump(models, self.docid)
        self.push(*json_objs)
        for model in models:
            model._dirty = False
        return models

    def object_link(self, obj):
        """webpage link which should render a given object
        """
        link = "bokeh/doc/%s/%s" % (self.docid, obj._id)
        return utils.urljoin(self.root_url, link)

    def show(self, plot_object):
        """Display an object as HTML in IPython using its display protocol. """
        data = {'text/html': autoload_server(plot_object, self)}
        utils.publish_display_data(data)

class Cloud(Session):
    def __init__(self):
        super(Cloud, self).__init__(name="cloud",
                                    root_url=BOKEHPLOTS_URL)
