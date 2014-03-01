from fabric.api import run, env, roles, put
from fabric.contrib.project import rsync_project

env.roledefs = {
    'web': ['bokeh.pydata.org']}

dirs = ['_images', '_sources', '_static', 'docs', 'tutorial']
files = ['genindex.html', 'index.html', 'objects.inv', 'py-modindex.html', 'search.html', 'searchindex.js']

@roles('web')
def deploy(user=False):
    if user:
        env.user = user

    # remove and archive old files and directories
    for dir in dirs:
        run("rm -rf /www/bokeh-old/%s" % dir)
        run("cp -ar /www/bokeh-latest/_images /www/bokeh-old/%s" % dir)
    for file in files:
        run("rm -f /www/bokeh-old/%s" % file)
        run("cp -a /www/bokeh-latest/index.html /www/bokeh-old/%s" % file)

    # switch current symlink to archive docs
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-old /www/bokeh")

    # upload the new files and directories
    for dir in dirs:
        rsync_project(
            local_dir="_build/html/%s/" % dir,
            remote_dir="/www/bokeh-latest/%s" % dir, delete=True)
    for file in files:
        put(
            local_path="_build/html/%s" % file,
            remote_path="/www/bokeh-latest/%s" % file)

    # switch the current symlink to new docs
    run("rm /www/bokeh")
    run("ln -s /www/bokeh-latest /www/bokeh")

    # set permissions
    run("chmod -R g+w /www/bokeh-latest")
