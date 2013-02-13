import flask
import json
import os
import re
import urlparse
import sys

def slug_json():
    path = os.path.join(slug_path(), 'slug.json')
    with open(path) as f:
        return json.load(f)
    
def slug_path():
    return os.path.join(os.path.dirname(__file__))

ignores = [".*~", "^#", "^\.#"]
def coffee_assets(prefix, host, port):
    #walk coffee tree
    ftargets = []
    for path, dirs, files in os.walk(prefix, followlinks=True):
        for f in files:
            fname = os.path.join(path, f)
            print fname
            ftargets.append(fname)
    #filter out ignores
    ftargets = [f for f in ftargets if not \
             any([re.match(ignore, os.path.basename(f)) for ignore in ignores])]
    #make path relative to slugdir
    slugpath = slug_path()
    ftargets = [os.path.relpath(x, slug_path()) for x in ftargets]
    
    #remove extension
    ftargets = [os.path.splitext(f)[0] for f in ftargets]
    base = "http://%s:%s" % (host, port)
    #make urls
    return [urlparse.urljoin(base, x) for x in ftargets]
    
def slug_libs(app, libs):
    targets = [os.path.join(slug_path(), os.path.normpath(x)) for x in libs]
    targets = [os.path.relpath(x, app.static_folder) for x in targets]
    targets = [flask.url_for('static', filename=x) for x in targets]
    return targets
