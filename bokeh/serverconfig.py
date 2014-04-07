from __future__ import absolute_import, print_function

import json
from os import makedirs
from os.path import expanduser, exists, join

#import pandas as pd
from six.moves.urllib.parse import urljoin, urlencode

from . import utils, browserlib

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

    def data_source(self, name, dataframe=None, **kwargs):
        raise NotImplementedError
        # fname = join(self.configdir, name + ".hdf5")
        # store = pd.HDFStore(fname)
        # if not dataframe:
        #     dataframe = pd.DataFrame(kwargs)
        # store.put(name, dataframe)
        # store.flush()
        # store.close()

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
