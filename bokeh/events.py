''' Granular event classes for use with the event system
'''

from __future__ import absolute_import

class Event(object):

    event_classes = []
    event_name = None

    def __init__(self, model_id=None):
        self.model_id = model_id

    @classmethod
    def from_JSON(cls, json):
        eventclasses = [eventcls for eventcls in cls.event_classes]
        for eventscls in eventclasses:
            if eventscls.event_name == json['event_name']:
                return eventscls(**json['event_values'])
        print('Warning: Could not find appropriate Event class')


class ButtonClick(Event):

    event_name = 'button_click'

    def __init__(self, model_id=None):
        super(ButtonClick, self).__init__(model_id=model_id)


class MouseMove(Event):

    event_name = 'mousemove'

    def __init__(self, sx=None,sy=None, x=None, y=None, model_id=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super(MouseMove, self).__init__(model_id=model_id)


class LODStart(Event):

    event_name = 'lodstart'

    def __init__(self, model_id=None):
        super(LODStart, self).__init__(model_id=model_id)

class LODEnd(Event):

    event_name = 'lodend'

    def __init__(self, model_id=None):
        super(LODEnd, self).__init__(model_id=model_id)

class KeyDown(Event):

    event_name = 'keydown'

    def __init__(self, key=None, model_id=None):
        self.key = key
        super(KeyDown, self).__init__(model_id=model_id)


class PointEvent(Event):

    event_name = None

    def __init__(self, sx=None,sy=None, x=None, y=None, model_id=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super(PointEvent, self).__init__(model_id=model_id)


class Tap(PointEvent):

    event_name = 'tap'


class DoubleTap(PointEvent):

    event_name = 'doubletap'

class Press(PointEvent):

    event_name = 'press'

class PanStart(PointEvent):

    event_name = 'panstart'

class PanEnd(PointEvent):

    event_name = 'panend'


class Pan(PointEvent):

    event_name = 'pan'

    def __init__(self, deltaX=None, deltaY=None, direction=None, **kwargs):
        self.deltaX = deltaX
        self.deltaY = deltaY
        self.direction = direction
        super(Pan, self).__init__(**kwargs)



Event.event_classes = [v for v in locals().values()
                       if (type(v)==type and issubclass(v,Event))]
