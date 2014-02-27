from fabric.api import run, env, roles
from fabric.contrib.project import rsync_project

env.roledefs = {
    'web': ['bokeh.pydata.org']}

dirs = ['_images', '_sources', '_static', 'docs']
files = ['genindex.html', 'index.html', 'objects.inv', 'py-modindex.html', 'search.html', 'searchindex.js']

@roles('web')
def deploy(user=False):
    if user:
        env.user = user

    # remove old files and directories
    for dir in dirs:
        run("rm -rf /www/bokeh-old/%s" % dir)
    for file in files:
        run("rm -f /www/bokeh-old/%s" % file)

    run("cp -ar /www/bokeh-latest/_images /www/bokeh-old/_images")
    run("cp -ar /www/bokeh-latest/_sources /www/bokeh-old/_sources")
    run("cp -ar /www/bokeh-latest/_static /www/bokeh-old/_static")
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
