''' This specialized toctree subclass sorts toctree entries for releases.

it is convenient to add a glob for release notes in the top level
``index.rst`` file, so that the list does not have to be constantly
updated and maintained:

.. code-block:: rst

    .. bokeh-index-toctree::
        :hidden:
        :glob:

        docs/installation
        docs/user_guide
        docs/user_guide/quickstart
        docs/releases/*

But the release files are named ``0.1.0.rst``, ``0.12.2.rst``, etc, and
and default alphabetic sort will not produce good results. This directive
will re-order any release documents according to semantic version.

'''
from __future__ import absolute_import
from packaging.version import Version as V
from sphinx.directives import TocTree

def _ver_sort(x):
    # x is an "entries" tuple
    return V(x[1].split("docs/releases/")[1])

class BokehIndexTocTree(TocTree):
    def run(self):
        rst = super(BokehIndexTocTree, self).run()

        # entries are tuples something like: (None, 'docs/dev_guide/env_vars')
        entries = rst[0][0]['entries']

        # find the slice i:j of the entries that has the releases docs
        i = -1
        j = None
        for ind, item in enumerate(entries):
            if i < 0:
                if item[1].startswith("docs/releases"):
                    i = ind
            else:
                if not item[1].startswith("docs/releases"):
                    j = ind
                    break

        if i >= 0:
            # have to modfy in-place for changes to have effect
            entries[i:j] = sorted(entries[i:j], key=_ver_sort, reverse=True)

        return rst

def setup(app):
    app.add_directive('bokeh-index-toctree', BokehIndexTocTree)
