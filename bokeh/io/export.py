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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import io
import warnings
from os.path import abspath
from tempfile import mkstemp

# External imports
from six import raise_from, b

# Bokeh imports
from ..embed import file_html
from ..resources import INLINE
from ..util.dependencies import import_required
from ..util.string import decode_utf8
from .util import default_filename

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'create_webdriver',
    'export_png',
    'export_svgs',
    'get_layout_html',
    'get_screenshot_as_png',
    'get_svgs',
    'terminate_webdriver',
    'webdriver_control',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

    '''

    image = get_screenshot_as_png(obj, height=height, width=width, driver=webdriver)

    if filename is None:
        filename = default_filename("png")

    image.save(filename)

    return abspath(filename)

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
        log.warning("No SVG Plots were found.")
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

# this is part of the API for this module
from .webdriver import webdriver_control
from .webdriver import terminate_webdriver # for back compat

def create_webdriver():
    ''' Create a new webdriver.

    ..note ::
        Here for compatiboility. Prefer methods on the webdriver_control
        object.

    '''
    return webdriver_control.create()

def get_screenshot_as_png(obj, driver=None, **kwargs):
    ''' Get a screenshot of a LayoutDOM object.

    Args:
        obj (LayoutDOM or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        driver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

    Returns:
        cropped_image (PIL.Image.Image) : a pillow image loaded from PNG.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    Image = import_required('PIL.Image',
                            'To use bokeh.io.export_png you need pillow ' +
                            '("conda install pillow" or "pip install pillow")')

    with _tmp_html() as tmp:
        html = get_layout_html(obj, **kwargs)
        with io.open(tmp.path, mode="w", encoding="utf-8") as file:
            file.write(decode_utf8(html))

        web_driver = driver if driver is not None else webdriver_control.get()

        web_driver.get("file:///" + tmp.path)
        web_driver.maximize_window()

        ## resize for PhantomJS compat
        web_driver.execute_script("document.body.style.width = '100%';")

        wait_until_render_complete(web_driver)

        png = web_driver.get_screenshot_as_png()

        b_rect = web_driver.execute_script(_BOUNDING_RECT_SCRIPT)

    image = Image.open(io.BytesIO(png))
    cropped_image = _crop_image(image, **b_rect)

    return cropped_image

def get_svgs(obj, driver=None, **kwargs):
    '''

    '''
    with _tmp_html() as tmp:
        html = get_layout_html(obj, **kwargs)
        with io.open(tmp.path, mode="wb") as file:
            file.write(b(html))

        web_driver = driver if driver is not None else webdriver_control.get()

        web_driver.get("file:///" + tmp.path)

        wait_until_render_complete(web_driver)

        svgs = web_driver.execute_script(_SVG_SCRIPT)

    return svgs

def get_layout_html(obj, resources=INLINE, **kwargs):
    '''

    '''
    resize = False
    if kwargs.get('height') is not None or kwargs.get('width') is not None:
        # Defer this import, it is expensive
        from ..models.plots import Plot
        if not isinstance(obj, Plot):
            warnings.warn("Export method called with height or width kwargs on a non-Plot layout. The size values will be ignored.")
        else:
            resize = True
            old_height = obj.plot_height
            old_width = obj.plot_width
            obj.plot_height = kwargs.get('height', old_height)
            obj.plot_width = kwargs.get('width', old_width)

    try:
        html = file_html(obj, resources, title="", suppress_callback_warning=True, _always_new=True)
    finally:
        if resize:
            obj.plot_height = old_height
            obj.plot_width = old_width

    return html

def wait_until_render_complete(driver):
    '''

    '''
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.common.exceptions import TimeoutException

    def is_bokeh_loaded(driver):
        return driver.execute_script('''
            const b = window.Bokeh;
            return b && b.documents && b.documents.length > 0;
        ''')

    try:
        WebDriverWait(driver, 5, poll_frequency=0.1).until(is_bokeh_loaded)
    except TimeoutException as e:
        raise_from(RuntimeError('Bokeh was not loaded in time. Something may have gone wrong.'), e)

    driver.execute_script(_WAIT_SCRIPT)

    def is_bokeh_render_complete(driver):
        return driver.execute_script('return window._bokeh_render_complete;')

    try:
        WebDriverWait(driver, 5, poll_frequency=0.1).until(is_bokeh_render_complete)
    except TimeoutException:
        log.warning("The webdriver raised a TimeoutException while waiting for \
                     a 'bokeh:idle' event to signify that the layout has rendered. \
                     Something may have gone wrong.")
    finally:
        browser_logs = driver.get_log('browser')
        severe_errors = [l for l in browser_logs if l.get('level') == 'SEVERE']
        if len(severe_errors) > 0:
            log.warning("There were severe browser errors that may have affected your export: {}".format(severe_errors))

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

class _TempFile(object):

    _closed = False

    def __init__(self, prefix="tmp", suffix=""):
        self.fd, self.path = mkstemp(prefix=prefix, suffix=suffix)

    def __enter__(self):
        return self

    def __exit__(self, exc, value, tb):
        self.close()

    def __del__(self):
        self.close()

    def close(self):
        if self._closed:
            return

        try:
            os.close(self.fd)
        except (OSError, IOError):
            pass
        finally:
            self.fd = None

        try:
            os.unlink(self.path)
        except (OSError, IOError):
            pass
        finally:
            self.path = None

        self._closed = True

def _tmp_html():
    return _TempFile(prefix="bokeh", suffix=".html")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
