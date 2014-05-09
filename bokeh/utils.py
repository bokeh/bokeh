from __future__ import print_function

import platform
import sys
import math
from six.moves.urllib.parse import urljoin as sys_urljoin
import copy
from functools import reduce

def urljoin(*args):
    return reduce(sys_urljoin, args)

def get_json(request):
    """request from requests library handles backwards compatability for
    requests < 1.0
    """
    if hasattr(request.json, '__call__'):
        return request.json()
    else:
        return request.json

def encode_utf8(u):
    if sys.version_info[0] == 2:
        u = u.encode('utf-8')
    return u

def decode_utf8(u):
    if sys.version_info[0] == 2:
        u = u.decode('utf-8')
    return u

_scales = [1e0, 1e3, 1e6, 1e9]
_units = ['s', 'ms', 'us', 'ns']

def scale_delta(time):
    if time > 0.0:
        order = min(-int(math.floor(math.log10(time)) // 3), 3)
    else:
        order = 3

    return time*_scales[order], _units[order]

def is_py3():
    return sys.version_info[0] == 3

def is_pypy():
    return platform.python_implementation() == "PyPy"

def json_apply(json_obj, func):
    processed = set()
    queue = [json_obj]
    while queue:
        node = queue.pop(0)
        if id(node) in processed:
            continue
        func(node)
        processed.add(id(node))
        if isinstance(node, list):
            for idx, x in enumerate(node):
                queue.append(x)
        if isinstance(node, dict):
            for k,v in node.iteritems():
                queue.append(v)

def get_ref(obj):
    return obj.get_ref()

def convert_references(json_obj):
    from .plot_object import PlotObject
    from .properties import HasProps
    def convert(obj):
        if isinstance(obj, PlotObject):
            return get_ref(obj)
        elif isinstance(obj, HasProps):
            return obj.to_dict()
        else:
            return obj
    def helper(json_obj):
        if isinstance(json_obj, list):
            for idx, x in enumerate(json_obj):
                json_obj[idx] = convert(x)
        if isinstance(json_obj, dict):
            for k, x in json_obj.iteritems():
                json_obj[k] = convert(x)
    json_apply(json_obj, helper)
    return json_obj

def dump(objs, docid):
    json_objs = []
    for obj in objs:
        ref = get_ref(obj)
        ref["attributes"] = obj.vm_serialize()
        ref["attributes"].update({"id": ref["id"], "docid" : docid})
        json_objs.append(ref)
    return json_objs

def print_versions():
    """Print all the versions of software that Bokeh relies on."""
    import sys, platform
    from . import __version__
    print("-=" * 38)
    print("Bokeh version: %s" % __version__)
    print("Python version: %s" % sys.version)
    (sysname, nodename, release, version, machine, processor) = \
        platform.uname()
    print("Platform: %s-%s-%s (%s)" % (sysname, release, machine, version))
    print("-=" * 38)

def test(verbosity=1, xunitfile=None, exit=False):
    """
    Runs the full Bokeh test suite, outputting
    the results of the tests to sys.stdout.

    This uses nose tests to discover which tests to
    run, and runs tests in any 'tests' subdirectory
    within the Bokeh module.

    Parameters
    ----------
    verbosity : int, optional
        Value 0 prints very little, 1 prints a little bit,
        and 2 prints the test names while testing.
    xunitfile : string, optional
        If provided, writes the test results to an xunit
        style xml file. This is useful for running the tests
        in a CI server such as Jenkins.
    exit : bool, optional
        If True, the function will call sys.exit with an
        error code after the tests are finished.
    """
    import nose
    import os
    import sys
    argv = ['nosetests', '--verbosity=%d' % verbosity]
    # Output an xunit file if requested
    if xunitfile:
        argv.extend(['--with-xunit', '--xunit-file=%s' % xunitfile])
    # Set the logging level to warn
    argv.extend(['--logging-level=WARN'])
    # Add all 'tests' subdirectories to the options
    rootdir = os.path.dirname(__file__)
    for root, dirs, files in os.walk(rootdir):
        if 'tests' in dirs:
            testsdir = os.path.join(root, 'tests')
            argv.append(testsdir)
            print('Test dir: %s' % testsdir[len(rootdir)+1:])
    # print versions (handy when reporting problems)
    print_versions()
    sys.stdout.flush()
    # Ask nose to do its thing
    return nose.main(argv=argv, exit=exit)

_notebook_loaded = None

def load_notebook(resources=None, verbose=False, force=False):
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) : a resource object describing how and where to load BokehJS from
        verbose (bool, optional) : whether to report detailed settings (default: False)
        force (bool, optional) : whether to skip IPython notebook check (default: False)

    Returns:
        None

    '''
    global _notebook_loaded

    # It's possible the IPython folks will chance things in the future, `force` parameter
    # provides an escape hatch as long as `displaypub` works
    if not force:
        notebook = False
        try:
            notebook = 'notebook' in get_ipython().config['IPKernelApp']['parent_appname']
        except Exception:
            pass
        if not notebook:
            raise RuntimeError('load_notebook() only works inside an IPython Notebook.')

    import IPython.core.displaypub as displaypub
    from . import __version__
    from .resources import INLINE
    from .templates import NOTEBOOK_LOAD, RESOURCES

    if resources is None:
        resources = INLINE

    plot_resources = RESOURCES.render(
        js_raw = resources.js_raw,
        css_raw = resources.css_raw,
        js_files = resources.js_files,
        css_files = resources.css_files,
    )

    if resources.mode == 'inline':
        js_info = 'inline'
        css_info = 'inline'
    else:
        js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
        css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

    warnings = ["Warning: " + msg['text'] for msg in resources.messages if msg['type'] == 'warn']

    if _notebook_loaded:
        warnings.append('Warning: BokehJS previously loaded')

    _notebook_loaded = resources

    html = NOTEBOOK_LOAD.render(
        plot_resources = plot_resources,
        logo_url = resources.logo_url,
        verbose = verbose,
        js_info = js_info,
        css_info = css_info,
        bokeh_version = __version__,
        warnings = warnings,
    )
    displaypub.publish_display_data('bokeh', {'text/html': html})

class Settings(object):
    _prefix = "BOKEH_"

    @property
    def _environ(self):
        import os
        return os.environ

    def _get_str(self, key, default):
        return self._environ.get(self._prefix + key, default)

    def _get_bool(self, key, default):
        value = self._environ.get(self._prefix + key)

        if value is None:
            value = default
        elif value.lower() in ["true", "yes", "on", "1"]:
            value = True
        elif value.lower() in ["false", "no", "off", "0"]:
            value = False
        else:
            raise ValueError("invalid value %r for boolean property %s%s" % (value, self._prefix, key))

        return value

    def browser(self, default=None):
        return self._get_str("BROWSER", default)

    def resources(self, default=None):
        return self._get_str("RESOURCES", default)

    def rootdir(self, default=None):
        return self._get_str("ROOTDIR", default)

    def version(self, default=None):
        return self._get_str("VERSION", default)

    def minified(self, default=None):
        return self._get_bool("MINIFIED", default)

    def pretty(self, default=None):
        return self._get_bool("PRETTY", default)

    def pythonlib(self, default=None):
        return self._get_str("PYTHONLIB", default)
