import sys
from os.path import join, dirname, abspath, normpath, realpath, isdir

# Root dir of Bokeh package
ROOT_DIR = dirname(dirname(abspath(__file__)))


def serverdir():
    """ Get the location of the server subpackage
    """
    path = join(ROOT_DIR, 'server')
    path = normpath(path)
    if sys.platform == 'cygwin': path = realpath(path)
    return path


def bokehjsdir(dev=False):
    """ Get the location of the bokehjs source files. If dev is True,
    the files in bokehjs/build are preferred. Otherwise uses the files
    in bokeh/server/static.
    """
    dir1 = join(ROOT_DIR, '..', 'bokehjs', 'build')
    dir2 = join(serverdir(), 'static')
    if dev and isdir(dir1):
        return dir1
    else:
        return dir2
