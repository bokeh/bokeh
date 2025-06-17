# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Simplify linking to Bokeh Github resources.

This module provides roles that can be used to easily reference information from
various sources in the Bokeh project structure:

``:bokeh-commit:`` : link to a specific commit

``:bokeh-issue:`` : link to an issue

``:bokeh-minpy:`` : provide the minimum supported Python version

``:bokeh-pull:`` : link to a pull request

``:bokeh-requires:`` : list the install requires from pyproject.toml

``:bokeh-tree:`` : (versioned) link to a source tree URL

Examples
--------

The following code:

.. code-block:: rest

    The repo history shows that :bokeh-commit:`bf19bcb` was made in
    in :bokeh-pull:`1698`, which closed :bokeh-issue:`1694`. This included
    updating all of the files in the :bokeh-tree:`examples` subdirectory.

yields the output:

The repo history shows that :bokeh-commit:`bf19bcb` was made in
in :bokeh-pull:`1698`,which closed :bokeh-issue:`1694`. This included
updating all of the files in the :bokeh-tree:`examples` subdirectory.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from os.path import join

# External imports
import toml
from docutils import nodes, utils
from docutils.parsers.rst.roles import set_classes

# Bokeh imports
from . import PARALLEL_SAFE, REPO_TOP

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "bokeh_commit",
    "bokeh_issue",
    "bokeh_minpy",
    "bokeh_pull",
    "bokeh_requires",
    "bokeh_tree",
    "setup",
)

BOKEH_GH = "https://github.com/bokeh/bokeh"

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def bokeh_commit(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app
    node = _make_gh_link_node(app, rawtext, "commit", "commit ", "commit", text, options)
    return [node], []


def bokeh_issue(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app
    try:
        issue_num = int(text)
        if issue_num <= 0:
            raise ValueError
    except ValueError:
        msg = inliner.reporter.error(f"Github issue number must be a number greater than or equal to 1; {text!r} is invalid.", line=lineno)
        prb = inliner.problematic(rawtext, rawtext, msg)
        return [prb], [msg]
    node = _make_gh_link_node(app, rawtext, "issue", "#", "issues", str(issue_num), options)
    return [node], []


def bokeh_minpy(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Provide the minimum supported Python version from pyproject.toml.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    pyproject = toml.load(join(REPO_TOP, "pyproject.toml"))
    node = nodes.Text(pyproject["project"]["requires-python"].lstrip(">="))
    return [node], []


def bokeh_pull(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app
    try:
        issue_num = int(text)
        if issue_num <= 0:
            raise ValueError
    except ValueError:
        msg = inliner.reporter.error(f"Github pull request number must be a number greater than or equal to 1; {text!r} is invalid.", line=lineno)
        prb = inliner.problematic(rawtext, rawtext, msg)
        return [prb], [msg]
    node = _make_gh_link_node(app, rawtext, "pull", "pull request ", "pull", str(issue_num), options)
    return [node], []


def bokeh_requires(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Provide the list of required package dependencies for Bokeh.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    pyproject = toml.load(join(REPO_TOP, "pyproject.toml"))
    node = nodes.bullet_list()
    for dep in pyproject["project"]["dependencies"]:
        node += nodes.list_item("", nodes.Text(dep))
    return [node], []


def bokeh_tree(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a URL in the Bokeh GitHub tree, pointing to appropriate tags
    for releases, or to main otherwise.

    The link text is simply the URL path supplied, so typical usage might
    look like:

    .. code-block:: none

        All of the examples are located in the :bokeh-tree:`examples`
        subdirectory of your Bokeh checkout.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app

    tag = app.env.config["version"]
    if "-" in tag:
        tag = "main"

    url = f"{BOKEH_GH}/tree/{tag}/{text}"
    options = options or {}
    set_classes(options)
    node = nodes.reference(rawtext, text, refuri=url, **options)
    return [node], []


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_role("bokeh-commit", bokeh_commit)
    app.add_role("bokeh-issue", bokeh_issue)
    app.add_role("bokeh-minpy", bokeh_minpy)
    app.add_role("bokeh-pull", bokeh_pull)
    app.add_role("bokeh-requires", bokeh_requires)
    app.add_role("bokeh-tree", bokeh_tree)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


def _make_gh_link_node(app, rawtext, role, kind, api_type, id, options=None):
    """Return a link to a Bokeh Github resource.

    Args:
        app (Sphinx app) : current app
        rawtext (str) : text being replaced with link node.
        role (str) : role name
        kind (str) : resource type (issue, pull, etc.)
        api_type (str) : type for api link
        id : (str) : id of the resource to link to
        options (dict) : options dictionary passed to role function

    """
    url = f"{BOKEH_GH}/{api_type}/{id}"
    options = options or {}
    set_classes(options)
    node = nodes.reference(rawtext, f"{kind}{utils.unescape(id)}", refuri=url, **options)
    return node


# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
