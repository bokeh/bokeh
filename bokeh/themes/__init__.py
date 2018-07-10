''' Provides API for loading themes

'''
from __future__ import absolute_import

from os.path import dirname, realpath, join

from .theme import Theme

THIS_DIR = dirname(realpath(__file__))

default = Theme(json={})
light_minimal = Theme(filename=join(THIS_DIR, 'light_minimal.json'))
dark_minimal = Theme(filename=join(THIS_DIR, 'dark_minimal.json'))

del dirname, realpath, join
