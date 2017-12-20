#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import io
from os.path import abspath, devnull
from tempfile import NamedTemporaryFile
from warnings import warn

# External imports

# Bokeh imports
from ..resources import INLINE
from ..util.dependencies import import_required, detect_phantomjs
from .saving import save
from .util import default_filename

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
def export_png(obj, filename=None, height=None, width=None, webdriver=None):
    ''' Export the LayoutDOM object or document as a PNG.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.png``)

    Args:
        obj (LayoutDOM or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        filename (str, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

    Returns:
        filename (str) : the filename where the static file is saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    .. warning::
        Glyphs that are rendered via webgl won't be included in the generated PNG.

    '''

    image = get_screenshot_as_png(obj, height=height, width=width, driver=webdriver)

    if filename is None:
        filename = default_filename("png")

    image.save(filename)

    return abspath(filename)


@general((1,0,0))
def export_svgs(obj, filename=None, height=None, width=None, webdriver=None):
    ''' Export the SVG-enabled plots within a layout. Each plot will result
    in a distinct SVG file.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.svg``)

    Args:
        obj (LayoutDOM object) : a Layout (Row/Column), Plot or Widget object to display

        filename (str, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

    Returns:
        filenames (list(str)) : the list of filenames where the SVGs files
            are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = get_svgs(obj, height=height, width=width, driver=webdriver)

    if len(svgs) == 0:
        log.warn("No SVG Plots were found.")
        return

    if filename is None:
        filename = default_filename("svg")

    filenames = []

    for i, svg in enumerate(svgs):
        if i == 0:
            filename = filename
        else:
            idx = filename.find(".svg")
            filename = filename[:idx] + "_{}".format(i) + filename[idx:]

        with io.open(filename, mode="w", encoding="utf-8") as f:
            f.write(svg)

        filenames.append(filename)

    return filenames

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dev((1,0,0))
def get_screenshot_as_png(obj, driver=None, **kwargs):
    '''

    '''
    Image = import_required('PIL.Image',
                            'To use bokeh.io.export_png you need pillow ' +
                            '("conda install pillow" or "pip install pillow")')

    html_path = save_layout_html(obj, **kwargs)

    web_driver = driver if driver is not None else _create_default_webdriver()

    web_driver.get("file:///" + html_path)
    web_driver.maximize_window()

    ## resize for PhantomJS compat
    web_driver.execute_script("document.body.style.width = '100%';")

    wait_until_render_complete(web_driver)

    png = web_driver.get_screenshot_as_png()

    b_rect = web_driver.execute_script(_BOUNDING_RECT_SCRIPT)

    if driver is None: # only quit webdriver if not passed in as arg
        web_driver.quit()

    image = Image.open(io.BytesIO(png))
    cropped_image = _crop_image(image, **b_rect)

    return cropped_image

@dev((1,0,0))
def get_svgs(obj, driver=None, **kwargs):
    '''

    '''
    html_path = save_layout_html(obj, **kwargs)

    web_driver = driver if driver is not None else _create_default_webdriver()
    web_driver.get("file:///" + html_path)

    wait_until_render_complete(web_driver)

    svgs = web_driver.execute_script(_SVG_SCRIPT)

    if driver is None: # only quit webdriver if not passed in as arg
        web_driver.quit()


    return svgs

@dev((1,0,0))
def save_layout_html(obj, resources=INLINE, **kwargs):
    '''

    '''
    resize = False
    if kwargs.get('height') is not None or kwargs.get('width') is not None:
        # Defer this import, it is expensive
        from ..models.plots import Plot
        if not isinstance(obj, Plot):
            warn("Export method called with height or width kwargs on a non-Plot layout. The size values will be ignored.")
        else:
            resize = True
            old_height = obj.plot_height
            old_width = obj.plot_width
            obj.plot_height = kwargs.get('height', old_height)
            obj.plot_width = kwargs.get('width', old_width)

    html_path = NamedTemporaryFile(suffix=".html").name
    save(obj, filename=html_path, resources=resources, title="")

    if resize:
        obj.plot_height = old_height
        obj.plot_width = old_width

    return html_path

@dev((1,0,0))
def wait_until_render_complete(driver):
    '''

    '''
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.common.exceptions import TimeoutException

    driver.execute_script(_WAIT_SCRIPT)

    def is_bokeh_render_complete(driver):
        return driver.execute_script('return window._bokeh_render_complete;')

    try:
        WebDriverWait(driver, 5, poll_frequency=0.1).until(is_bokeh_render_complete)
    except TimeoutException:
        log.warn("The webdriver raised a TimeoutException while waiting for \
                     a 'bokeh:idle' event to signify that the layout has rendered. \
                     Something may have gone wrong.")
    finally:
        browser_logs = driver.get_log('browser')
        severe_errors = [l for l in browser_logs if l.get('level') == 'SEVERE']
        if len(severe_errors) > 0:
            log.warn("There were severe browser errors that may have affected your export: {}".format(severe_errors))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_BOUNDING_RECT_SCRIPT = """
return document.getElementsByClassName('bk-root')[0].children[0].getBoundingClientRect()
"""

_SVG_SCRIPT = """
var serialized_svgs = [];
var svgs = document.getElementsByClassName('bk-root')[0].getElementsByTagName("svg");
for (var i = 0; i < svgs.length; i++) {
    var source = (new XMLSerializer()).serializeToString(svgs[i]);
    serialized_svgs.push(source);
};
return serialized_svgs
"""

_WAIT_SCRIPT = """
// add private window prop to check that render is complete
window._bokeh_render_complete = false;
function done() {
  window._bokeh_render_complete = true;
}

var doc = window.Bokeh.documents[0];

if (doc.is_idle)
  done();
else
  doc.idle.connect(done);
"""

def _crop_image(image, left=0, top=0, right=0, bottom=0, **kwargs):
    ''' Crop the border from the layout

    '''
    return image.crop((left, top, right, bottom))

def _create_default_webdriver():
    webdriver = import_required('selenium.webdriver',
                                'To use bokeh.io image export functions you need selenium ' +
                                '("conda install -c bokeh selenium" or "pip install selenium")')

    phantomjs_path = detect_phantomjs()
    return webdriver.PhantomJS(executable_path=phantomjs_path, service_log_path=devnull)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
