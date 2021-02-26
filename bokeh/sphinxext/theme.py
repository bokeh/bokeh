# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Install some functions for the bokeh theme to make use of.


"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# External imports
import sphinx.builders.html
from docutils import nodes
from sphinx.locale import admonitionlabels
from sphinx.writers.html5 import HTML5Translator

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ("setup",)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# Mapping of admonition classes to Bootstrap contextual classes
alert_classes = {
    "attention": "primary",
    "caution": "warning",
    "danger": "danger",
    "error": "danger",
    "hint": "info",
    "important": "primary",
    "note": "info",
    "seealso": "info",
    "tip": "primary",
    "warning": "warning",
    "todo": "info",
    "example": "info",
}


class BootstrapHTML5Translator(HTML5Translator):
    """Custom HTML Translator for a Bootstrap-ified Sphinx layout
    This is a specialization of the HTML5 Translator of sphinx.
    Only a couple of functions have been overridden to produce valid HTML to be
    directly styled with Bootstrap.
    """

    def __init__(self, *args, **kwds):
        super().__init__(*args, **kwds)
        self.settings.table_style = "table"

    def visit_admonition(self, node: nodes.Element, name: str = "") -> None:
        # copy of sphinx source to add alert classes
        classes = ["alert"]
        if name:
            classes.append("alert-{0}".format(alert_classes[name]))
        self.body.append(self.starttag(node, "div", CLASS=" ".join(classes)))
        if name:
            node.insert(0, nodes.title(name, admonitionlabels[name]))

    def visit_table(self, node: nodes.Element) -> None:
        # copy of sphinx source to *not* add 'docutils' and 'align-default' classes but add 'table' class
        self.generate_targets_for_table(node)

        self._table_row_index = 0

        classes = [cls.strip(" \t\n") for cls in self.settings.table_style.split(",")]
        tag = self.starttag(node, "table", CLASS=" ".join(classes))
        self.body.append(tag)


def convert_docutils_node(list_item, only_pages=False):
    if not list_item.children:
        return None
    reference = list_item.children[0].children[0]
    title = reference.astext()
    url = reference.attributes["refuri"]
    active = "current" in list_item.attributes["classes"]

    if only_pages and "#" in url:
        return None

    nav = {}
    nav["title"] = title
    nav["url"] = url
    nav["children"] = []
    nav["active"] = active

    if len(list_item.children) > 1:
        for child_item in list_item.children[1].children:
            child_nav = convert_docutils_node(child_item, only_pages=only_pages)
            if child_nav is not None:
                nav["children"].append(child_nav)

    return nav


def update_page_context(self, pagename, templatename, ctx, event_arg):
    from sphinx.environment.adapters.toctree import TocTree

    def get_nav_object(**kwds):
        toctree = TocTree(self.env).get_toctree_for(pagename, self, collapse=True, **kwds)

        nav = []
        for child in toctree.children[0].children:
            child_nav = convert_docutils_node(child, only_pages=True)
            nav.append(child_nav)

        return nav

    def get_page_toc_object():
        self_toc = TocTree(self.env).get_toc_for(pagename, self)

        try:
            nav = convert_docutils_node(self_toc.children[0])
            return nav
        except Exception:
            return {}

    ctx["get_nav_object"] = get_nav_object
    ctx["get_page_toc_object"] = get_page_toc_object
    return None


sphinx.builders.html.StandaloneHTMLBuilder.update_page_context = update_page_context


def setup(app):
    app.set_translator("html", BootstrapHTML5Translator)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
