''' Granular event classes for use with the event system
'''

from __future__ import absolute_import

class Event(object):

    event_classes = []
    event_name = None
class MouseMove(Event):

    event_name = 'mousemove'

    def __init__(self, sx=None,sy=None, x=None, y=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y


class KeyDown(Event):

    event_name = 'keydown'

    def __init__(self, key=None):
        self.key = key


class PointEvent(Event):

    event_name = None

    def __init__(self, sx=None,sy=None, x=None, y=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y


class Tap(PointEvent):

    event_name = 'tap'


class DoubleTap(PointEvent):

    event_name = 'doubletap'

class Press(PointEvent):

    event_name = 'press'




Event.event_classes = [v for v in locals().values()
                       if (type(v)==type and issubclass(v,Event))]
