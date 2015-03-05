# This is the bokeh_magic loader and installer, if you want to see the
# bokeh_magic source code check the following url:
# https://github.com/bokeh/bokeh/blob/master/extensions/bokeh_magic.py

from __future__ import absolute_import, print_function
from IPython import get_ipython


def install_bokeh_magic():
    "An alternative way to install the bokeh_magic extension."
    url = "https://raw.github.com/bokeh/bokeh/master/extensions/bokeh_magic.py"
    ip.extension_manager.install_extension(url)
    print("Bokeh_magic has been installed.")

# An alternative way to load the bokeh_magic extension.

ip = get_ipython()
try:
    ip.extension_manager.load_extension("bokeh_magic")
except ImportError:
    print("You need to install the extension first. \n"
          "Don't worry, we will do it for you.")
    install_bokeh_magic()
    ip.extension_manager.load_extension("bokeh_magic")
