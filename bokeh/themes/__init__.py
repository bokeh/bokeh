''' Provides API for loading themes

'''
from __future__ import absolute_import

from os.path import join

from .theme import Theme

default = Theme(json={})

del join
