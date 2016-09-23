import pytest

from bokeh.plotting.helpers import (
    _process_legend_kwargs
)


# _process_legend_kwargs
def test_process_legend_kwargs_raises_error_if_both_legend_and_label():
    with pytest.raises(RuntimeError):
        kwargs = dict(label='1', legend='2')
        _process_legend_kwargs(kwargs)
