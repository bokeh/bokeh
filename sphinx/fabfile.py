from fabric.api import run, env, roles
from fabric.contrib.files import exists
from fabric.contrib.project import rsync_project

import sys
sys.path.append("source")
import conf

env.roledefs = {
    'web': ['bokeh.pydata.org']
}
env.user = "bokeh"

@roles('web')
def deploy(v=None):

    if v is None:
        v = conf.version
    elif v == "latest":
        raise RuntimeError("You can not pass 'latest' as fab argument. Use fab latest:x.x.x instead.")

    # make a backup of the old directory
    run("rm -rf /www/bokeh/en/%s.bak" % v)
    run("mkdir -p /www/bokeh/en/%s" % v)
    run("cp -ar /www/bokeh/en/%s /www/bokeh/en/%s.bak" % (v, v))

    rsync_project(
        local_dir="_build/html/",
        remote_dir="/www/bokeh/en/%s" % v,
        delete=True
    )

    # set permissions
    run("chmod -R g+w /www/bokeh/en/%s" % v)

@roles('web')
def latest(v=None):

    if v is None:
        raise RuntimeError("You need to specify a version number: fab latest:x.x.x")

    if exists("/www/bokeh/en/%s" % v):
        # switch the current symlink to new docs
        run("rm /www/bokeh/en/latest")
        run("ln -s /www/bokeh/en/%s /www/bokeh/en/latest" % v)
        run("echo %s > /www/bokeh/en/latest/version.txt" % v)
    else:
        raise RuntimeError("We did not detect a %s docs version, please use fab deploy:%s first." % (v, v))
