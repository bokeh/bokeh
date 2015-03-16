''' The session module provides the Session class, which encapsulates a
connection to a Document that resides on a Bokeh server.

The Session class provides methods for creating, loading and storing
documents and objects, as well as methods for user-authentication. These
are useful when the server is run in multi-user mode.

'''
from __future__ import absolute_import, print_function

#--------
# logging
#--------
import logging
logger = logging.getLogger(__name__)

#-------------
# standard lib
#-------------
import time
import json
from os import makedirs
from os.path import expanduser, exists, join
import tempfile

#------------
# third party
#------------
from six.moves.urllib.parse import urljoin, urlencode
from requests.exceptions import ConnectionError

#---------
# optional
#---------
try:
    import pandas as pd
    import tables
    has_pandas = True
except ImportError as e:
    has_pandas = False

#--------
# project
#--------
from . import browserlib
from . import protocol
from .embed import autoload_server
from .exceptions import DataIntegrityException
from .models import ServerDataSource
from .util.notebook import publish_display_data
from .util.serialization import dump, get_json, urljoin

DEFAULT_SERVER_URL = "http://localhost:5006/"

class Session(object):
    """ Encapsulate a connection to a document stored on a Bokeh Server.

    Args:
        name (str, optional) : name of server
        root_url (str, optional) : root url of server
        userapikey (str, optional) : (default: "nokey")
        username (str, optional) : (default: "defaultuser")
        load_from_config (bool, optional) :
            Whether to load login information from config. (default: True)
            If False, then we may overwrite the user's config.
        configdir (str) : location of user configuration information

    Attributes:
        base_url (str) :
        configdir (str) :
        configfile (str) :
        http_session (requests.session) :
        userapikey (str) :
        userinfo (dict) :
        username (str) :

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

        # single user mode case
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

    # for testing
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
        """ Loads the server configuration information from disk

        Returns:
            None

        """
        config_info = self.load_dict().get(self.name, {})
        print("Using saved session configuration for %s" % self.name)
        print("To override, pass 'load_from_config=False' to Session")
        self.root_url = config_info.get('root_url', self.root_url)
        self.userapikey = config_info.get('userapikey', self.userapikey)
        self.username = config_info.get('username', self.username)

    def save(self):
        """ Save the server configuration information to JSON

        Returns:
            None

        """
        data = self.load_dict()
        data[self.name] = {'root_url': self.root_url,
                           'userapikey': self.userapikey,
                           'username': self.username}
        configfile = self.configfile
        with open(configfile, "w+") as f:
            json.dump(data, f)

    def register(self, username, password):
        ''' Register a new user with a bokeh server.

        .. note::
            This is useful in multi-user mode.

        Args:
            username (str) : user name to register
            password (str) : user password for account

        Returns:
            None

        '''
        url = urljoin(self.root_url, "bokeh/register")
        result = self.execute('post', url, data={
            'username': username,
            'password': password,
            'api': 'true'
        })
        if result.status_code != 200:
            raise RuntimeError("Unknown Error")
        result = get_json(result)
        if result['status']:
            self.username = username
            self.userapikey = result['userapikey']
            self.save()
        else:
            raise RuntimeError(result['error'])

    def login(self, username, password):
        ''' Log a user into a bokeh server.

        .. note::
            This is useful in multi-user mode.

        Args:
            username (str) : user name to log in
            password (str) : user password

        Returns:
            None

        '''
        url = urljoin(self.root_url, "bokeh/login")
        result = self.execute('post', url, data={
            'username': username,
            'password': password,
            'api': 'true'
        })
        if result.status_code != 200:
            raise RuntimeError("Unknown Error")
        result = get_json(result)
        if result['status']:
            self.username = username
            self.userapikey = result['userapikey']
            self.save()
        else:
            raise RuntimeError(result['error'])

        self.save()

    def browser_login(self):
        """ Open a browser with a token that logs the user into a bokeh server.

        .. note::
            This is useful in multi-user mode.

        Return:
            None

        """
        controller = browserlib.get_browser_controller()
        url = urljoin(self.root_url, "bokeh/loginfromapikey")
        url += "?" + urlencode({'username': self.username,
                                'userapikey': self.userapikey})
        controller.open(url)

    def data_source(self, name, data):
        """ Makes and uploads a server data source to the server.

        .. note::
            The server must be configured with a data directory.

        Args:
            name (str) : name for the data source object
            data (pd.DataFrame or np.array) : data to upload

        Returns:
            source : ServerDataSource

        """
        raise NotImplementedError

    def list_data(self):
        """ Return all the data soruces on the server.

        Returns:
            sources : JSON

        """
        raise NotImplementedError

    def publish(self):
        url = urljoin(self.root_url, "/bokeh/%s/publish" % self.docid)
        self.post_json(url)

    def execute(self, method, url, headers=None, **kwargs):
        """ Execute an HTTP request using the current session.

        Returns the response

        Args:
            method (string) : 'get' or 'post'
            url (string) : url
            headers (dict, optional) : any extra HTTP headers

        Keyword Args:
            Any extra arguments to pass into the requests library

        Returns:
            response

        Returns the response
        """
        import requests
        import warnings
        func = getattr(self.http_session, method)
        try:
            resp = func(url, headers=headers, **kwargs)
        except requests.exceptions.ConnectionError as e:
            warnings.warn("You need to start the bokeh-server to see this example.")
            raise e
        if resp.status_code == 409:
            raise DataIntegrityException

        if resp.status_code == 401:
            raise Exception('HTTP Unauthorized accessing')
        return resp

    def execute_json(self, method, url, headers=None, **kwargs):
        """ same as execute, except ensure that json content-type is
        set in headers and interprets and returns the json response
        """
        if headers is None:
            headers = {}
        headers['content-type'] = 'application/json'
        resp = self.execute(method, url, headers=headers, **kwargs)
        return get_json(resp)

    def get_json(self, url, headers=None, **kwargs):
        """ Return the result of an HTTP 'get'.

        Args:
            url (str) : the URL for the 'get' request
            headers (dict, optional) : any extra HTTP headers

        Keyword Args:
            Any extra arguments to pass into the requests library

        Returns:
            response: JSON

        """
        return self.execute_json('get', url, headers=headers, **kwargs)

    def post_json(self, url, headers=None, **kwargs):
        """ Return the result of an HTTP 'post'

        Args:
            url (str) : the URL for the 'get' request
            headers (dict, optional) : any extra HTTP headers

        Keyword Args:
            Any extra arguments to pass into the requests library

        Returns:
            response: JSON

        """
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
        """ Retrieve the document API key from the server.

        Args:
            docid (string) : docid of the document to retrive API key for

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
        """ Return the docid of the document with a title matching ``name``.

        .. note::
            Creates a new document with the given title if one is not found.

        Args:
            name (string) : name for the document

        Returns:
            docid : str

        """

        docs = self.userinfo.get('docs')

        matching = [x for x in docs if x.get('title') == name]

        if len(matching) == 0:
            logger.info("No documents found, creating new document '%s'" % name)
            self.make_doc(name)
            return self.find_doc(name)

        elif len(matching) > 1:
            logger.warning("Multiple documents with name '%s'" % name)

        return matching[0]['docid']

    def use_doc(self, name=None, docid=None):
        """ Configure the session to use a given document.

        Args:
            name (str, optional) : name of the document to use
            docid (str, optional) : id of the document to use

        .. note::
            only one of ``name`` or ``docid`` may be supplied.

        Creates a document for with the given name if one is not present on
        the server.

        Returns:
            None

        """
        if docid is not None and name is not None:
            raise ValueError("only one of 'name' or 'docid' can be supplied to use_doc(...)")

        if docid:
            self.docid = docid
        else:
            self.docid = self.find_doc(name)
        self.apikey = self.get_api_key(self.docid)

    def make_doc(self, title):
        """ Makes a new document with the given title on the server

        .. note:: user information is reloaded

        Returns:
            None

        """
        url = urljoin(self.root_url,"bokeh/doc/")
        data = protocol.serialize_json({'title' : title})
        self.userinfo = self.post_json(url, data=data)

    def pull(self, typename=None, objid=None):
        """ Pull JSON objects from the server.

        Returns a specific object if both ``typename`` and ``objid`` are
        supplied. Otherwise, returns all objects for the currently configured
        document.

        This is a low-level function.

        Args:
            typename (str, optional) : name of the type of object to pull
            objid (str, optional) : ID of the object to pull

        .. note::
            you must supply either ``typename`` AND ``objid`` or omit both.

        Returns:
            attrs : JSON

        """
        if typename is None and objid is None:
            url = urljoin(self.base_url, self.docid +"/")
            attrs = self.get_json(url)

        elif typename is None or objid is None:
            raise ValueError("typename and objid must both be None, or neither.")

        else:
            url = urljoin(
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
        """ Push JSON objects to the server.

        This is a low-level function.

        Args:
            *jsonobjs (JSON) : objects to push to the server

        Returns:
            None

        """
        data = protocol.serialize_json(jsonobjs)
        url = urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.post_json(url, data=data)

    def gc(self):
        url = urljoin(self.base_url, self.docid + "/", "gc")
        self.post_json(url)

    # convenience functions to use a session and store/fetch from server

    def load_document(self, doc):
        """ Loads data for the session and merge with the given document.

        Args:
            doc (Document) : document to load data into

        Returns:
            None

        """
        self.gc()
        json_objs = self.pull()
        doc.merge(json_objs)
        doc.docid = self.docid

    def load_object(self, obj, doc):
        """ Update an object in a document with data pulled from the server.

        Args:
            obj (PlotObject) : object to be updated
            doc (Document) : the object's document

        Returns:
            None

        """
        assert obj._id in doc._models
        attrs = self.pull(typename=obj.__view_model__, objid=obj._id)
        doc.load(*attrs)

    def store_document(self, doc, dirty_only=True):
        """ Store a document on the server.

        Returns the models that were actually pushed.

        Args:
            doc (Document) : the document to store
            dirty_only (bool, optional) : whether to store only dirty objects. (default: True)

        Returns:
            models : list[PlotObject]

        """
        doc._add_all()
        models = doc._models.values()

        if dirty_only:
            models = [x for x in models if getattr(x, '_dirty', False)]

        json_objs = doc.dump(*models)
        self.push(*json_objs)

        for model in models:
            model._dirty = False

        return models

    def store_objects(self, *objs, **kwargs):
        """ Store objects on the server

        Returns the objects that were actually stored.

        Args:
            *objs (PlotObject) : objects to store

        Keywords Args:
            dirty_only (bool, optional) : whether to store only dirty objects. (default: True)

        Returns:
            models : set[PlotObject]

        """

        models = set()

        for obj in objs:
            models.update(obj.references())

        if kwargs.pop('dirty_only', True):
            models = list(models)

        json_objs = dump(models, self.docid)
        self.push(*json_objs)

        for model in models:
            model._dirty = False

        return models

    def object_link(self, obj):
        """ Return a URL to a server page that will render the given object.

        Args:
            obj (PlotObject) : object to render

        Returns:
            url : str

        """
        link = "bokeh/doc/%s/%s" % (self.docid, obj._id)
        return urljoin(self.root_url, link)

    def show(self, obj):
        """ Display an object as HTML in IPython using its display protocol.

        Args:
            obj (PlotObject) : object to display

        Returns:
            None

        """
        data = {'text/html': autoload_server(obj, self)}
        publish_display_data(data)

    def poll_document(self, document, interval=0.5):
        """ Periodically ask the server for updates to the `document`. """
        try:
            while True:
                self.load_document(document)
                time.sleep(interval)
        except KeyboardInterrupt:
            print()
        except ConnectionError:
            print("Connection to bokeh-server was terminated")

    # helper methods

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

class TestSession(Session):
    """Currently, register and login do not work, everything else should work
    in theory, but we'll have to test this as we go along and convert tests
    """
    def __init__(self, *args, **kwargs):
        if 'load_from_config' not in kwargs:
            kwargs['load_from_config'] = False
        self.client = kwargs.pop('client')
        self.headers = {}
        super(TestSession, self).__init__(*args, **kwargs)

    @property
    def username(self):
        return self.headers.get('BOKEHUSER')

    @username.setter
    def username(self, val):
        self.headers.update({'BOKEHUSER': val})

    @property
    def userapikey(self):
        return self.headers.get('BOKEHUSER-API-KEY')

    @userapikey.setter
    def userapikey(self, val):
        self.headers.update({'BOKEHUSER-API-KEY': val})

    def execute(self, method, url, headers=None, **kwargs):
        if headers is None:
            headers = {}
        func = getattr(self.client, method)
        resp = func(url, headers=headers, **kwargs)
        if resp.status_code == 409:
            raise DataIntegrityException
        if resp.status_code == 401:
            raise Exception('HTTP Unauthorized accessing')
        return resp
