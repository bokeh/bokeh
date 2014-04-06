from __future__ import absolute_import, print_function

import json
from os import makedirs
from os.path import expanduser, exists, join
import tempfile

try:
    import pandas as pd
    import tables
except ImportError as e:
    pass

from six.moves.urllib.parse import urljoin, urlencode

from . import utils, browserlib
from bokeh.objects import ServerDataSource
bokeh_plots_url = "http://bokehplots.cloudapp.net/"


class Server(object):
    def __init__(self, name="http://localhost:5006/",
                 root_url="http://localhost:5006/",
                 userapikey="nokey",
                 username="defaultuser",
                 load_from_config=True,
                 configdir=None
                 ):
        """name : name of server
        root_url : root_url of server
        load_from_config : whether or not to load login information
        from config.  if False, then we may overwrite the users
        config with this data
        """
        self.name = name
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
        """filename where our config are stored"""
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
        config_info = self.load_dict().get(self.name, {})
        print("found config for %s" % self.name)
        print(str(config_info))
        print("loading it!")
        print("if you don't wish to load this config, please pass load_from_config=False")
        self.root_url = config_info.get('root_url', self.root_url)
        self.userapikey = config_info.get('userapikey', self.userapikey)
        self.username = config_info.get('username', self.username)

    def save(self):
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
        if dataframe:
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


class Cloud(Server):
    def __init__(self):
        super(Cloud, self).__init__(name="cloud",
                                    root_url=bokeh_plots_url)
