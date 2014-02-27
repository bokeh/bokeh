from fabric.api import run, env, roles
from fabric.contrib.project import rsync_project

env.roledefs = {
    'web': ['bokeh.pydata.org']}

@roles('web')
def deploy(user=False):
    if user:
        env.user = user
    run("rm -rf /www/bokeh-old/docs")
    run("rm -f /www/bokeh-old/index.html")
    run("cp -ar /www/bokeh-latest/docs /www/bokeh-old/docs")
    run("cp -a /www/bokeh-latest/index.html /www/bokeh-old/index.html")
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-old /www/bokeh")
    rsync_project(
        local_dir="_build/html/docs",
        remote_dir="/www/bokeh-latest/docs", delete=True)
    # TODO how to copy up index.html?
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-latest /www/bokeh")
    run("chmod -R g+w /www/bokeh-latest")
