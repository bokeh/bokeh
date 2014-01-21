from os.path import expanduser, exists, join
from os import makedirs
from six.moves.urllib.parse import urljoin
from . import protocol, utils
import requests
import json

class Server(object):
    def __init__(self, name, root_url=None, 
                 load_from_config=True,
                 configfile=None
                 ):
        """name : name of server
        root_url : root_url of server
        load_from_config : whether or not to load login information
        from config.  if False, then we may overwrite the users
        config with this data
        """
        self.name = name
        self.root_url = root_url        
        self.apikey = None
        self.username = None
        self._configfile = None        
        if configfile:
            self.configfile = configfile
        if load_from_config:
            self.load()

    @property
    def configfile(self):
        """filename where our config are stored"""
        if self._configfile:
            return self._configfile
        bokehdir = expanduser(".bokeh")
        if not exists(bokehdir):
            makedirs(bokehdir)
        fname = expanduser(join(".bokeh", "config.json"))
        return fname
    
    #for testing
    @configfile.setter
    def configfile(self, path):
        self._configfile = path
        
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
        self.root_url = config_info.get('root_url', self.root_url)
        self.apikey = config_info.get('apikey', self.apikey)
        self.username = config_info.get('username', self.username)

    def save(self):
        data = self.load_dict()
        data[self.name] = {'root_url' : self.root_url,
                           'apikey' : self.apikey,
                           'username' : self.username}
        configfile = self.configfile        
        with open(configfile, "w+") as f:
            json.dump(data, f)
        return

    def register(self, username, password):
        url = urljoin(self.root_url, "register")
        result = requests.post(url, data={
                'username' : username,
                'password' : password,
                'api' : 'true'
                })
        if result.status_code != 200:
            raise Exception, "Unknown Error"
        result = utils.get_json(result)
        if result['status']:
            self.username = username
            self.apikey = result['apikey']
            self.save()
        else:
            raise Exception, result['error']

    def login(self, username, password):
        url = urljoin(self.root_url, "login")
        result = requests.post(url, data={
                'username' : username,
                'password' : password,
                'api' : 'true'
                })
        if result.status_code != 200:
            raise Exception, "Unknown Error"
        result = utils.get_json(result)
        if result['status']:
            self.username = username            
            self.apikey = result['apikey']
            self.save()
        else:
            raise Exception, result['error']
        self.save()
