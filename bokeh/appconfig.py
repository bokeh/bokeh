import os
from os.path import join, expanduser, exists
import json
config = {}

def get_configfile():
    configdir = os.environ.get('BOKEH_APP_CONFIG')
    if not configdir:
        configdir = join(expanduser("~"), ".bokeh")
    if not exists(configdir):
        os.makedirs(configdir)
    configfile = join(configdir, "appconfig.json")
    return configfile

def get_config():
    configfile = get_configfile()
    if exists(configfile):
        with open(configfile) as f:
            config.update(json.load(f))
    return config

def save_config():
    configfile = get_configfile()
    with open(configfile, "w+") as f:
        json.dump(data, f)

    
    
