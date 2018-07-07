''' Provides API for loading themes

'''
from __future__ import absolute_import

from os.path import dirname, realpath, join

from .theme import Theme

THIS_DIR = dirname(realpath(__file__))

default = Theme(json={})
lite = Theme(filename=join(THIS_DIR, 'lite.json'))
dark_lite = Theme(filename=join(THIS_DIR, 'dark_lite.json'))

del dirname, realpath, join
