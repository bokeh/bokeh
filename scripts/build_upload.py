#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh build and upload script for TravisCI release builds

'''
import argparse
from collections import defaultdict
import glob
from io import BytesIO
import json
import os
from packaging.version import Version as V
import re
from subprocess import Popen, PIPE
import sys

import certifi
import pycurl

try:
    import colorama
    def bright(text): return "%s%s%s" % (colorama.Style.BRIGHT, text, colorama.Style.RESET_ALL)
    def dim(text):    return "%s%s%s" % (colorama.Style.DIM, text, colorama.Style.RESET_ALL)
    def white(text):  return "%s%s%s" % (colorama.Fore.WHITE, text, colorama.Style.RESET_ALL)
    def blue(text):   return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)
    def red(text):    return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)
    def green(text):  return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)
    def yellow(text): return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)
    sys.platform == "win32" and colorama.init()
except ImportError:
    def bright(text): return text
    def dim(text):    return text
    def white(text):  return text
    def blue(text):   return text
    def red(text):    return text
    def green(text):  return text
    def yellow(text): return text

NOT_STARTED = "NOT STARTED"
STARTED = "STARTED BUT NOT COMPLETED"
COMPLETED = "COMPLETED"

PLATFORMS = "osx-64 win-32 win-64 linux-32 linux-64".split()

class config(object):

    # This excludes "local" build versions, e.g. 0.12.4+19.gf85560a
    ANY_VERSION = re.compile(r"^(\d+\.\d+\.\d+)((?:dev|rc)\d+)?$")

    def __init__(self):
        self.dry_run = False
        self._version = None
        self._builds = ('conda', 'sdist', 'docs', 'examples')
        self._build_status = defaultdict(lambda: NOT_STARTED)
        self._uploads = ('cdn', 'anaconda', 'pypi', 'docs', 'examples', 'npm')
        self._upload_status = defaultdict(lambda: NOT_STARTED)

    @property
    def version(self): return self._version

    @version.setter
    def version(self, v):
        m =  self.ANY_VERSION.match(v)
        if not m: raise ValueError("Invalid Bokeh version for release %r" % v)
        self._version = v

    @property
    def version_type(self):
        if   "rc"  in self._version: return "RELEASE CANDIDATE"
        elif "dev" in self._version: return "DEV BUILD"
        else: return "FULL RELEASE"

    @property
    def builds(self):
        return self._builds

    @property
    def build_status(self):
        return self._build_status

    @property
    def uploads(self):
        return self._uploads

    @property
    def upload_status(self):
        return self._upload_status

CONFIG = config()

#--------------------------------------
#
# Utility functions
#
#--------------------------------------

def run(cmd, fake_cmd=None, silent=False, **kw):
    envstr = ""
    for k, v in kw.items():
        os.environ[k] = v
        envstr += "%s=%s " % (k,v)
    if not silent:
        if fake_cmd:
            print("+%s%s" % (envstr, fake_cmd))
        else:
            print("+%s%s" % (envstr, cmd))

    if CONFIG.dry_run:
        return "junk"

    cmd = cmd.split()
    p = Popen(cmd, stdout=PIPE, stderr=PIPE)
    out, err = p.communicate()
    out = out.decode('utf-8').strip()
    err = err.decode('utf-8').strip()
    for k, v in kw.items():
        del os.environ[k]
    if p.returncode != 0:
        raise RuntimeError("STDOUT:\n\n" + out + "\n\nSTDERR:\n\n" + err)
    return out

def cd(dir):
    os.chdir(dir)
    print("+cd %s    [now: %s]" % (dir, os.getcwd()))

def clean():
    for plat in PLATFORMS:
        run("rm -rf %s" % plat)
    run("rm -rf dist/")
    run("rm -rf build/")
    run("rm -rf bokeh.egg-info/")
    run("rm -rf record.txt")
    run("rm -rf versioneer.pyc")

def build_wrapper(name):
    def decorator(func):
        def wrapper(*args, **kw):
            try:
                CONFIG.build_status[name] = STARTED
                func(*args, **kw)
                passed("Build for %r finished" % name)
            except Exception as e:
                failed("Build for %r did NOT succeed" % name, str(e).split('\n'))
                abort_builds()
            CONFIG.build_status[name] = COMPLETED
        return wrapper
    return decorator

def upload_wrapper(name):
    def decorator(func):
        def wrapper(*args, **kw):
            try:
                CONFIG.upload_status[name] = STARTED
                func(*args, **kw)
                passed("Upload for %r finished" % name)
            except Exception as e:
                failed("Upload for %r did NOT succeed" % name, str(e).split('\n'))
                abort_uploads()
            CONFIG.upload_status[name] = COMPLETED
        return wrapper
    return decorator

def cdn_upload(local_path, cdn_path, content_type, cdn_token, cdn_id):
    print(":uploading to CDN: %s" % cdn_path)
    if CONFIG.dry_run: return
    url = 'https://storage101.dfw1.clouddrive.com/v1/%s/%s' % (cdn_id, cdn_path)
    c = pycurl.Curl()
    c.setopt(c.CAINFO, certifi.where())
    c.setopt(c.URL, url)
    c.setopt(c.CUSTOMREQUEST, "PUT")
    c.setopt(c.HTTPHEADER, ["X-Auth-Token: %s" % cdn_token,
                            "Origin: https://mycloud.rackspace.com",
                            "Content-Type: %s" % content_type])
    c.setopt(pycurl.POSTFIELDS, open(local_path).read().encode('utf-8'))
    c.perform()
    c.close()

#--------------------------------------
#
# UI functions
#
#--------------------------------------

def banner(color, msg):
    print()
    print(color('='*80))
    print(color("{:^80}".format(msg)))
    print(color('='*80 + "\n"))

def passed(msg):
    print(dim(green("[PASS] ")) + msg)

def failed(msg, details=None):
    print((red("[FAIL] ")) + msg)
    if details:
        print()
        for line in details:
            print("     " + line)
        print()

def abort_checks():
    print()
    print(bright(red("!!! Pre-checks failed. The BUILD and UPLOAD has been aborted.")))
    print()
    print(bright(red("!!! NO ASSETS HAVE BEEN UPLOADED")))
    print()
    banner(red, "{:^80}".format("Bokeh %r build and upload: FAILURE" % CONFIG.version))
    sys.exit(1)

def abort_builds():
    print(red("\n!!! FATAL problems occurred during BUILDS"))
    print()
    print(bright(red("!!! NO ASSETS HAVE BEEN UPLOADED")))
    print()
    print(bright(yellow("Here is the status of all build steps:")))
    print()
    for build in CONFIG.builds:
        print("    - %-10s: %s" % (build, CONFIG.build_status[build]))
    print()
    banner(red, "{:^80}".format("Bokeh %r build and upload: FAILURE" % CONFIG.version))
    sys.exit(1)

def abort_uploads():
    print(red("\n!!! FATAL problems occurred during UPLOADS"))
    print()
    print(bright(red("!!! SOME ASSETS MAY HAVE BEEN UPLOADED")))
    print()
    print(bright(yellow("Here is the status of all uploads:")))
    print()
    for upload in CONFIG.uploads:
        print("    - %-10s: %s" % (upload, CONFIG.upload_status[upload]))
    print()
    banner(red, "{:^80}".format("Bokeh %r build and upload: FAILURE" % CONFIG.version))
    sys.exit(1)

#--------------------------------------
#
# Check functions
#
#--------------------------------------

def check_environment_var(name, message):
    if name in os.environ:
        passed("Found %s (%s)" % (message, name))
    else:
        failed("Missing %s (%s)" % (message, name))
        abort_checks()

def check_anaconda_creds():
    try:
        token = os.environ['ANACONDA_TOKEN']
        out = run("anaconda -t %s whoami" % token, silent=True)
        if "Anonymous User" in out:
            failed("Could NOT verify Anaconda credentials")
            abort_checks()
        passed("Verified Anaconda credentials")
        return token
    except Exception:
        failed("Could NOT verify Anaconda credentials")
        abort_checks()

def check_cdn_creds():
    try:
        username = os.environ['RSUSER']
        key = os.environ['RSAPIKEY']
        buf = BytesIO()
        c = pycurl.Curl()
        c.setopt(c.CAINFO, certifi.where())
        c.setopt(c.URL, 'https://identity.api.rackspacecloud.com/v2.0/tokens/')
        c.setopt(c.HTTPHEADER, ['Content-type: application/json'])
        c.setopt(c.POSTFIELDS, json.dumps({
            "auth" : {
                "RAX-KSKEY:apiKeyCredentials" : {
                    "username" : username,
                    "apiKey"   : key,
                }
            }
        }))
        c.setopt(c.WRITEDATA, buf)
        c.perform()
        c.close()

        data = json.loads(buf.getvalue().decode())

        cdn_token = data["access"]["token"]["id"]
        cdn_id = [
            d["endpoints"][0]["tenantId"]
            for d in data["access"]["serviceCatalog"]
            if d["name"] == "cloudFiles"
        ][0]

        passed("Retrieved CDN credentials")
        return cdn_token, cdn_id
    except:
        failed("Could NOT retrieve CDN credentials")
        abort_checks()

#--------------------------------------
#
# Build functions
#
#--------------------------------------

@build_wrapper('conda')
def build_conda_packages():
    for v in "27 34 35 36".split():
        # TODO (bev) remove --no-test when conda problems resolved
        run("conda build conda.recipe --quiet --no-test", CONDA_PY=v)
        # TODO (bev) make platform detected or configurable

    # TravisCI will time out if this is all run with one command, problem
    # should go away when new no-arch pkgs canbe used
    files = glob.glob('/home/travis/miniconda/conda-bld/linux-64/bokeh*')
    for file in files:
        for plat in PLATFORMS:
            run("conda convert -p %s %s" % (plat, file))

@build_wrapper('sdist')
def build_sdist_packages():
    run("python setup.py sdist --formats=gztar")

@build_wrapper('docs')
def build_docs():
    cd("sphinx")
    run("make clean all", BOKEH_DOCS_CDN=CONFIG.version, BOKEH_DOCS_VERSION=CONFIG.version)
    cd("..")

@build_wrapper('examples')
def build_examples():
    run("zip -9 -r -X examples-%s.zip examples" % CONFIG.version)

#--------------------------------------
#
# Upload functions
#
#--------------------------------------

@upload_wrapper('cdn')
def upload_cdn(cdn_token, cdn_id):
    subdir = 'dev' if V(CONFIG.version).is_prerelease else 'release'
    version = CONFIG.version

    content_type = "application/javascript"
    for name in ('bokeh', 'bokeh-api', 'bokeh-widgets'):
        for suffix in ('js', 'min.js'):
            local_path = 'bokehjs/build/js/%s.%s' % (name, suffix)
            cdn_path = 'bokeh/bokeh/%s/%s-%s.%s' % (subdir, name, version, suffix)
            cdn_upload(local_path, cdn_path, content_type, cdn_token, cdn_id)

    content_type = "text/css"
    for name in ('bokeh', 'bokeh-widgets'):
        for suffix in ('css', 'min.css'):
            local_path = 'bokehjs/build/css/%s.%s' % (name, suffix)
            cdn_path = 'bokeh/bokeh/%s/%s-%s.%s' % (subdir, name, version, suffix)
            cdn_upload(local_path, cdn_path, content_type, cdn_token, cdn_id)

@upload_wrapper('anaconda')
def upload_anaconda(token):
    for plat in PLATFORMS:
        files = glob.glob("%s/bokeh*.tar.bz2" % plat)
        for file in files:
            cmd = "anaconda -t %s upload -u bokeh %s -c dev --force --no-progress"
            run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file))

@upload_wrapper('pypi')
def upload_pypi():
    run("twine register upload dist/*")

@upload_wrapper('docs')
def upload_docs():
    cd("sphinx")
    if V(CONFIG.version).is_prerelease:
        run("fab deploy:dev")
    else:
        run("fab deploy:%s" % CONFIG.version)
        run("fab latest:%s" % CONFIG.version)
    cd("..")

@upload_wrapper('examples')
def upload_examples(cdn_token, cdn_id):
    local_path = "examples-%s.zip" % CONFIG.version
    cdn_path = 'bokeh/bokeh/examples/%s' % local_path
    cdn_upload(local_path, cdn_path, 'application/zip', cdn_token, cdn_id)

@upload_wrapper('npm')
def upload_npm():
    cd("bokehjs")
    run("npm publish")
    cd("..")

#--------------------------------------
#
# Main
#
#--------------------------------------

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Build and upload all assets for a Bokeh release.')
    parser.add_argument('version',
                        nargs=1,
                        type=str,
                        help='New Bokeh version to build and upload')
    parser.add_argument('--clean',
                        type=bool,
                        default=False,
                        help='Whether to clean the local checkout (default: False)')
    parser.add_argument('--dry-run',
                        action='store_true',
                        default=False,
                        help='Print, but do not execute, commands')
    args = parser.parse_args()

    CONFIG.dry_run = args.dry_run

    banner(blue, "{:^80}".format("Starting a Bokeh release BUILD and UPLOAD"))

    # pre-checks ------------------------------------------------------------

    print("!!! Running pre-checks\n")

    try:
        CONFIG.version = args.version[0]
        passed("%r is a valid version for release" % CONFIG.version)
    except ValueError:
        failed("%r is NOT a valid version for release" % args.version[0])
        abort_checks()

    check_environment_var('ANACONDA_TOKEN', 'access token for Anaconda.org')
    check_environment_var('RSUSER', 'username for CDN')
    check_environment_var('RSAPIKEY', 'API key for CDN')

    anaconda_token = check_anaconda_creds()

    cdn_token, cdn_id = check_cdn_creds()

    # builds ----------------------------------------------------------------

    print()
    print("!!! Building Bokeh release assets\n")

    # build things first, and abort immediately on any failure, in order to
    # prevent any partial uploads from occurring

    build_conda_packages()

    if V(CONFIG.version).is_prerelease:
        print(blue("[SKIP] ") + "Not building PyPI package for pre-releases")
        print(blue("[SKIP] ") + "Not building Examples tarball for pre-releases")
    else:
        build_sdist_packages() # BokehJS also built in this step
        build_examples()

    build_docs()

    # uploads ---------------------------------------------------------------

    print()
    print("!!! Uploading Bokeh release assets\n")

    # upload to CDN first -- if this fails, save the trouble of removing
    # useless packages from Anaconda.org and PyPI
    upload_cdn(cdn_token, cdn_id)

    upload_anaconda(anaconda_token)

    if V(CONFIG.version).is_prerelease:
        print(blue("[SKIP] ") + "Not updating PyPI package for pre-releases")
        print(blue("[SKIP] ") + "Not updating NPM package for pre-releases")
        print(blue("[SKIP] ") + "Not updating Examples tarball for pre-releases")
    else:
        upload_pypi()
        upload_npm()
        upload_examples(cdn_token, cdn_id)

    upload_docs()

    # finish ----------------------------------------------------------------

    if args.clean:
        clean()

    banner(blue, "{:^80}".format("Bokeh %r BUILD and UPLOAD: SUCCESS" % CONFIG.version))
