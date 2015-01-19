from fabric.api import run, env, roles
from fabric.contrib.project import rsync_project

import sys
sys.path.append("source")
import conf

env.roledefs = {
    'web': ['bokeh.pydata.org']
}
env.user = "bokeh"

@roles('web')
def deploy():

    v = conf.version

    # make a backup of the old directory
    run("rm -rf /www/bokeh/en/%s.bak" % v)
    run("mkdir -p /www/bokeh/en/%s" % v)
    run("cp -ar /www/bokeh/en/%s /www/bokeh/en/%s.bak" % (v, v))

    # switch latest symlink to archive docs
    run("rm /www/bokeh/en/latest")
    run("ln -s /www/bokeh/en/%s.bak /www/bokeh/en/latest" % v)

    rsync_project(
        local_dir="_build/html/",
        remote_dir="/www/bokeh/en/%s" % v,
        delete=True
    )

    # set permissions
    run("chmod -R g+w /www/bokeh/en/%s" % v)

    # switch the current symlink to new docs
    run("rm /www/bokeh/en/latest")
    run("ln -s /www/bokeh/en/%s /www/bokeh/en/latest" % v)

@roles('web')
def update(v=None):

    # TODO (bev) confirm this version is not the latest
    if v is None:
        v = conf.version

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
