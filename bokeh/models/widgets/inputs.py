"""

"""
from __future__ import absolute_import

import six

from ...properties import Bool, Int, Float, String, Date, RelativeDelta, Enum, List, Dict, Tuple, Either
from ..widget import Widget

class InputWidget(Widget):
    """

    """

    title = String(help="""

    """)

    name = String(help="""

    """)

    value = String(help="""

    """)

    @classmethod
    def coerce_value(cls, val):
        """

        """
        prop_obj = cls.lookup('value')
        if isinstance(prop_obj, Float):
            return float(val)
        elif isinstance(prop_obj, Int):
            return int(val)
        elif isinstance(prop_obj, String):
            return str(val)
        else:
            return val

    @classmethod
    def create(cls, *args, **kwargs):
        """ Only called the first time we make an object,
        whereas __init__ is called every time it's loaded

        """
        if kwargs.get('title') is None:
            kwargs['title'] = kwargs['name']
        if kwargs.get('value') is not None:
            kwargs['value'] = cls.coerce_value(kwargs.get('value'))
        return cls(**kwargs)

class TextInput(InputWidget):
    """

    """
    value = String(help="""

    """)

class Select(InputWidget):
    """

    """

    options = List(Either(String, Dict(String, String)), help="""

    """)

    value = String(help="""

    """)

    @classmethod
    def create(self, *args, **kwargs):
        """

        """
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

class MultiSelect(Select):
    """

    """

    value = List(String, help="""

    """)

    @classmethod
    def create(self, *args, **kwargs):
        """

        """
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

class Slider(InputWidget):
    """

    """

    value = Float(help="""

    """)

    start = Float(help="""

    """)

    end = Float(help="""

    """)

    step = Float(help="""

    """)

    orientation = Enum("horizontal", "vertical", help="""

    """)

class DateRangeSlider(InputWidget):
    """

    """

    value = Tuple(Date, Date, help="""

    """)

    bounds = Tuple(Date, Date, help="""

    """)

    range = Tuple(RelativeDelta, RelativeDelta, help="""

    """)

    step = RelativeDelta(help="""

    """)

    # formatter = Either(String, Function(Date))
    # scales = DateRangeSliderScales ... # first, next, stop, label, format

    enabled = Bool(True, help="""

    """)

    arrows = Bool(True, help="""

    """)

    value_labels = Enum("show", "hide", "change", help="""

    """)

    wheel_mode = Enum("scroll", "zoom", default=None, help="""

    """) # nullable=True

class DatePicker(InputWidget):
    """

    """

    value = Date(help="""

    """)

    min_date = Date(default=None, help="""

    """)
    max_date = Date(default=None, help="""

    """)
