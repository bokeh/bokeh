''' Provides API for loading themes

'''
from __future__ import absolute_import

from os.path import dirname, realpath, join

from .theme import Theme

_THIS_DIR = dirname(realpath(__file__))
_FP_FMT = join(_THIS_DIR, '{0}.json')

LIGHT_MINIMAL = 'light_minimal'
DARK_MINIMAL = 'dark_minimal'
CALIBER = 'caliber'

default = Theme(json={})
built_in_themes = {
    LIGHT_MINIMAL: Theme(filename=_FP_FMT.format(LIGHT_MINIMAL)),
    DARK_MINIMAL: Theme(filename=_FP_FMT.format(DARK_MINIMAL)),
    CALIBER: Theme(filename=_FP_FMT.format(CALIBER))
}

del dirname, realpath, join
