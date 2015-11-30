""" Functions useful for loading Bokeh code and data in IPython notebooks.

"""
from __future__ import absolute_import

_notebook_loaded = None


def load_notebook(resources=None, verbose=False, hide_banner=False):
    """ Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) :
            how and where to load BokehJS from

        verbose (bool, optional) :
            whether to report detailed settings (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

    .. warning::
        Clearing the output cell containing the published BokehJS
        resources HTML code may cause Bokeh CSS styling to be removed.

    Returns:
        None

    """
    global _notebook_loaded

    from .. import __version__
    from ..resources import CDN
    from ..templates import NOTEBOOK_LOAD

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

    html = NOTEBOOK_LOAD.render(
        bokeh_js=resources.render_js(),
        bokeh_css=resources.render_css(),
        logo_url=resources.logo_url,
        verbose=verbose,
        js_info=js_info,
        css_info=css_info,
        bokeh_version=__version__,
        warnings=warnings,
        hide_banner=hide_banner,
    )
    publish_display_data({'text/html': html})


def publish_display_data(data, source='bokeh'):
    """ Compatibility wrapper for IPython ``publish_display_data``

    Later versions of IPython remove the ``source`` (first) argument. This
    function insulates Bokeh library code from this change.

    Args:
        source (str, optional) : the source arg for IPython (default: "bokeh")
        data (dict) : the data dict to pass to ``publish_display_data``
            Typically has the form ``{'text/html': html}``

    """
    import IPython.core.displaypub as displaypub
    try:
        displaypub.publish_display_data(source, data)
    except TypeError:
        displaypub.publish_display_data(data)
