''' Functions useful for loading Bokeh code and data in Jupyter/Zeppelin notebooks.

'''
from __future__ import absolute_import

from ..core.templates import SCRIPT_TAG, AUTOLOAD_NB_JS

HTML_MIME_TYPE = 'text/html'
JS_MIME_TYPE   = 'application/javascript'
LOAD_MIME_TYPE = 'application/vnd.bokehjs_load.v0+json'
EXEC_MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json'

_notebook_loaded = None

# TODO (bev) notebook_type and zeppelin bits should be removed after external zeppelin hook available
def load_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000, notebook_type='jupyter'):
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) :
            how and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to report detailed settings (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

        notebook_type (string):
            notebook_type (default: jupyter)

    .. warning::
        Clearing the output cell containing the published BokehJS
        resources HTML code may cause Bokeh CSS styling to be removed.

    Returns:
        None

    '''

    global _notebook_loaded

    from IPython.display import publish_display_data

    from .. import __version__
    from ..core.templates import NOTEBOOK_LOAD
    from ..util.serialization import make_id
    from ..resources import CDN
    from ..util.compiler import bundle_all_models

    if resources is None:
        resources = CDN

    if not hide_banner:

        if resources.mode == 'inline':
            js_info = 'inline'
            css_info = 'inline'
        else:
            js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
            css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

        warnings = ["Warning: " + msg['text'] for msg in resources.messages if msg['type'] == 'warn']
        if _notebook_loaded and verbose:
            warnings.append('Warning: BokehJS previously loaded')

        element_id = make_id()

        html = NOTEBOOK_LOAD.render(
            element_id    = element_id,
            verbose       = verbose,
            js_info       = js_info,
            css_info      = css_info,
            bokeh_version = __version__,
            warnings      = warnings,
        )

    else:
        element_id = None

    _notebook_loaded = resources

    custom_models_js = bundle_all_models()

    nb_js = _loading_js(resources, element_id, custom_models_js, load_timeout, register_mime=True)
    jl_js = _loading_js(resources, element_id, custom_models_js, load_timeout, register_mime=False)

    if notebook_type=='jupyter':
        if not hide_banner:
            publish_display_data({'text/html': html})
        publish_display_data({
            JS_MIME_TYPE   : nb_js,
            LOAD_MIME_TYPE : jl_js
        })

    else:
        if not hide_banner:
            _publish_zeppelin_data(html)
        _publish_zeppelin_data(SCRIPT_TAG.render(js_code=jl_js))

# TODO (bev) This will eventually go away
def _publish_zeppelin_data(html):
    '''Embed html content via %html magic'''
    print('%html ' + html)

def _loading_js(resources, element_id, custom_models_js, load_timeout=5000, register_mime=True):

    return AUTOLOAD_NB_JS.render(
        elementid = element_id,
        js_urls   = resources.js_files,
        css_urls  = resources.css_files,
        js_raw    = resources.js_raw + [custom_models_js],
        css_raw   = resources.css_raw_str,
        force     = True,
        timeout   = load_timeout,
        register_mime = register_mime
    )

def get_comms(target_name):
    ''' Create a Jupyter comms object for a specific target, that can
    be used to update Bokeh documents in the Jupyter notebook.

    Args:
        target_name (str) : the target name the Comms object should connect to

    Returns
        Jupyter Comms

    '''
    from ipykernel.comm import Comm
    return Comm(target_name=target_name, data={})
