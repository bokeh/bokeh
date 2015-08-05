from __future__ import absolute_import

from warnings import warn
from . import callbacks

warn(
    '`bokeh.models.actions` is deprecated in favor of `bokeh.models.callbacks` '
    'and will be removed in v0.10.',
    FutureWarning, stacklevel=2
)


def Action(*args, **kwargs):
    warn(
        '`bokeh.models.actions.Action` is now `bokeh.models.callbacks.Callback`. '
        '`bokeh.models.actions.Actions` will be removed in v0.10.',
        FutureWarning, stacklevel=2
    )
    return callbacks.CustomJS(*args, **kwargs)


def Callback(*args, **kwargs):
    warn(
        '`bokeh.models.actions.Callback` is now `bokeh.models.callbacks.CustomJS`. '
        'You can use `from bokeh.models import CustomJS`, and use `CustomJS` just '
        'as you did before. `bokeh.models.actions.Callback` will be removed in v0.10.',
        FutureWarning, stacklevel=2
    )
    return callbacks.CustomJS(*args, **kwargs)


def OpenURL(*args, **kwargs):
    warn(
        '`bokeh.models.actions.OpenURL` is now `bokeh.models.callbacks.OpenURL`.'
        'You can use `from bokeh.models import OpenURL`, and use `OpenURL` just '
        'as you did before. `bokeh.models.actions.OpenURL` will be removed in v0.10.',
        FutureWarning, stacklevel=2
    )
    return callbacks.OpenURL(*args, **kwargs)
