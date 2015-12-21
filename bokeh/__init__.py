""" Bokeh is a Python interactive visualization library that targets modern
web browsers for presentation.

Its goal is to provide elegant, concise construction of novel graphics in the
style of d3.js, but also deliver this capability with high-performance
interactivity over very large or streaming datasets. Bokeh can help anyone
who would like to quickly and easily create interactive plots, dashboards,
and data applications.

For full documentation, please visit: http://bokeh.pydata.org

"""
from __future__ import absolute_import, print_function

# configure Bokeh version
from .util.version import __version__; __version__
from .util.version import __base_version__; __base_version__

# configure Bokeh logger
from .util import logconfig
del logconfig

# configure deprecation warnings
import warnings
from .util.deprecate import BokehDeprecationWarning
warnings.simplefilter('always', BokehDeprecationWarning)

# imports below are names we want to make available in the bokeh
# module as transitive imports

from . import sampledata; sampledata


def test(args=None):
    ''' Run the Bokeh tests under the bokeh python directory using pytest.

    Does not run tests from bokehjs or examples.

    Args:
        args(list, optional): command line arguments accepted by py.test

            e.g. args=['-s', '-k charts'] prevents capture of standard out
            and only runs tests that match charts. For more py.test options
            see http://pytest.org/latest/usage.html#usage.

    Returns:
        int: pytest exitcode

    '''
    from .util.testing import runtests
    return runtests(args)

def license():
    ''' Print the Bokeh license to the console.

    Returns:
        None

    '''
    from os.path import join
    with open(join(__path__[0], 'LICENSE.txt')) as lic:
        print(lic.read())
