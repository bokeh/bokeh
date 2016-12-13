''' Functions useful for loading Bokeh code and data in IPython notebooks.

'''
from __future__ import absolute_import

_notebook_loaded = None

def load_notebook(resources=None, verbose=False, hide_banner=False, load_timeout=5000):
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

    .. warning::
        Clearing the output cell containing the published BokehJS
        resources HTML code may cause Bokeh CSS styling to be removed.

    Returns:
        None

    '''
    html, js = _load_notebook_html(resources, verbose, hide_banner, load_timeout)
    publish_display_data({'text/html': html})
    publish_display_data({'application/javascript': js})

FINALIZE_JS = """
document.getElementById("%s").textContent = "BokehJS is loading...";
"""

def _load_notebook_html(resources=None, verbose=False, hide_banner=False,
                        load_timeout=5000):
    global _notebook_loaded

    from .. import __version__
    from ..core.templates import AUTOLOAD_NB_JS, NOTEBOOK_LOAD
    from ..util.serialization import make_id
    from ..resources import CDN

    if resources is None:
        resources = CDN

    if resources.mode == 'inline':
        js_info = 'inline'
        css_info = 'inline'
    else:
        js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
        css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

    warnings = ["Warning: " + msg['text'] for msg in resources.messages if msg['type'] == 'warn']

    if _notebook_loaded and verbose:
        warnings.append('Warning: BokehJS previously loaded')

    _notebook_loaded = resources

    element_id = make_id()

    html = NOTEBOOK_LOAD.render(
        element_id    = element_id,
        verbose       = verbose,
        js_info       = js_info,
        css_info      = css_info,
        bokeh_version = __version__,
        warnings      = warnings,
        hide_banner   = hide_banner,
    )

    js = AUTOLOAD_NB_JS.render(
        elementid = '' if hide_banner else element_id,
        js_urls  = resources.js_files,
        css_urls = resources.css_files,
        js_raw   = resources.js_raw + [FINALIZE_JS % element_id],
        css_raw  = resources.css_raw_str,
        force    = 1,
        timeout  = load_timeout
    )

    return html, js

def publish_display_data(data, source='bokeh'):
    ''' Compatibility wrapper for IPython ``publish_display_data``

    Later versions of IPython remove the ``source`` (first) argument. This
    function insulates Bokeh library code from this change.

    Args:
        source (str, optional) : the source arg for IPython (default: "bokeh")
        data (dict) : the data dict to pass to ``publish_display_data``
            Typically has the form ``{'text/html': html}``

    '''
    import IPython.core.displaypub as displaypub
    try:
        displaypub.publish_display_data(source, data)
    except TypeError:
        displaypub.publish_display_data(data)

def get_comms(target_name):
    ''' Create a Jupyter comms object for a specific target, that can
    be used to update Bokeh documents in the notebook.

    Args:
        target_name (str) : the target name the Comms object should connect to

    Returns
        Jupyter Comms

    '''
    from ipykernel.comm import Comm
    return Comm(target_name=target_name, data={})
