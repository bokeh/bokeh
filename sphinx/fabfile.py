from fabric.api import run, env, roles
from fabric.contrib.project import rsync_project

env.roledefs = {
    'web': ['bokeh.pydata.org']}

@roles('web')
def deploy(user=False):
    if user:
        env.user = user
    run("rm -rf /www/bokeh-old")
    run("cp -ar /www/bokeh-latest /www/bokeh-old")
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-old /www/bokeh")
    rsync_project(
        local_dir="_build/html/",
        remote_dir="/www/bokeh-latest", delete=True)
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-latest /www/bokeh")
    run("chmod -R g+w /www/bokeh-latest")
