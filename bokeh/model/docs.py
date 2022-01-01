#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for all objects (called Bokeh Models) that can go in
a Bokeh |Document|.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from operator import itemgetter
from typing import TYPE_CHECKING, Any, Type

# Bokeh imports
from ..util.serialization import make_id
from ..util.string import append_docstring

if TYPE_CHECKING:
    from .model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'html_repr',
    'process_example'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def html_repr(obj: Model):

    module = obj.__class__.__module__
    name = obj.__class__.__name__

    _id = getattr(obj, "_id", None)

    cls_name = make_id()

    def row(c: str):
        return f'<div style="display: table-row;">{c}</div>'
    def hidden_row(c: str):
        return f'<div class="{cls_name}" style="display: none;">{c}</div>'
    def cell(c: str):
        return f'<div style="display: table-cell;">{c}</div>'

    html = ''
    html += '<div style="display: table;">'

    ellipsis_id = make_id()
    ellipsis = f'<span id="{ellipsis_id}" style="cursor: pointer;">&hellip;)</span>'

    prefix = cell(f'<b title="{module}.{name}">{name}</b>(')
    html += row(prefix + cell('id' + '&nbsp;=&nbsp;' + repr(_id) + ', ' + ellipsis))

    props = obj.properties_with_values().items()
    sorted_props = sorted(props, key=itemgetter(0))
    all_props = sorted_props
    for i, (prop, value) in enumerate(all_props):
        end = ')' if i == len(all_props)-1 else ','
        html += hidden_row(cell("") + cell(prop + '&nbsp;=&nbsp;' + repr(value) + end))

    html += '</div>'
    html += _HTML_REPR % dict(ellipsis_id=ellipsis_id, cls_name=cls_name)

    return html

def process_example(cls: Type[Any]) -> None:
    ''' A decorator to mark abstract base classes derived from |HasProps|.

    '''
    if "__example__" in cls.__dict__:
        cls.__doc__ = append_docstring(cls.__doc__, _EXAMPLE_TEMPLATE.format(path=cls.__dict__["__example__"]))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_HTML_REPR = """
<script>
(function() {
  let expanded = false;
  const ellipsis = document.getElementById("%(ellipsis_id)s");
  ellipsis.addEventListener("click", function() {
    const rows = document.getElementsByClassName("%(cls_name)s");
    for (let i = 0; i < rows.length; i++) {
      const el = rows[i];
      el.style.display = expanded ? "none" : "table-row";
    }
    ellipsis.innerHTML = expanded ? "&hellip;)" : "&lsaquo;&lsaquo;&lsaquo;";
    expanded = !expanded;
  });
})();
</script>
"""

# The "../../" is needed for bokeh-plot to construct the correct path to examples
_EXAMPLE_TEMPLATE = '''

    Example
    -------

    .. bokeh-plot:: ../../{path}
        :source-position: below

'''

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
