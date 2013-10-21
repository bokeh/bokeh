import flask
import json
import os
import re
import urlparse

def slug_json():
    path = os.path.join(slug_path(), 'slug.json')
    with open(path) as f:
        return json.load(f)

def slug_path():
    return os.path.join(os.path.dirname(__file__))

ignores = [".*~", "^#", "^\.#"]
def coffee_assets(prefix, host, port, excludes=None):
    """ **excludes** is a list of relative directories which will be
    skipped.
    """
    if excludes is None:
        excludes = set()
    else:
        excludes = set(excludes)
    #walk coffee tree
    ftargets = []
    for path, dirs, files in os.walk(prefix, followlinks=True):
        if path in excludes:
            print "coffee_assets() skipping", path
            continue
        for f in files:
            fname = os.path.join(path, f)
            print fname
            ftargets.append(fname)
    #filter out ignores
    ftargets = [f for f in ftargets if not \
             any([re.match(ignore, os.path.basename(f)) for ignore in ignores])]
    return make_urls(ftargets, host, port)

def make_urls(filenames, host, port):
    """ Returns a list of URLs to the given files on the filesystem

    The filenames should be .coffee files, and the returned URLs
    will strip the extension appropriately.
    """
    slugpath = slug_path()
    filenames = [os.path.relpath(x, slugpath) for x in filenames]

    #remove extension
    filenames = [os.path.splitext(f)[0] for f in filenames]
    base = "http://%s:%s" % (host, port)
    #make urls
    return [urlparse.urljoin(base, x) for x in filenames]

def slug_libs(app, libs):
    targets = [os.path.join(slug_path(), os.path.normpath(x)) for x in libs]
    targets = [os.path.relpath(x, app.static_folder) for x in targets]
    targets = [flask.url_for('static', filename=x) for x in targets]
    print "slug_libs targets", targets
    return targets
