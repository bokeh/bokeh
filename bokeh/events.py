''' Granular event classes for use with the event system
'''

from __future__ import absolute_import

class Event(object):

    event_classes = []
    event_name = None
class KeyDown(Event):

    event_name = 'keydown'

    def __init__(self, key=None):
        self.key = key
