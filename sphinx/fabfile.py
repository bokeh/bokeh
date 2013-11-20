from fabric.api import run, env, roles
from fabric.contrib.project import rsync_project

env.roledefs = {
    'web': ['bokeh.pydata.org']}

@roles('web')
def deploy():
    run("rm -rf /www/bokeh-old")
    run("cp -r /www/bokeh-latest /www/bokeh-old")
    rsync_project(
        local_dir="_build/html/",
        remote_dir="/www/bokeh-latest", delete=True)
