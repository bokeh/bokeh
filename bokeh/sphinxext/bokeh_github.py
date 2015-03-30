""" Simplify linking to Bokeh Github resources.

This module proved four new roles that can be uses to easily link
to various resources in the Bokeh Github repository:

``:bokeh-commit:`` : link to a specific commit

``:bokeh-issue:`` : link to an issue

``:bokeh-milestone:`` : link to a milestone page

``:bokeh-pull:`` : link to a pull request

Examples
--------

The following code::

    The repo history shows that :bokeh-commit:`bf19bcb` was made in
    in :bokeh-pull:`1698`,which closed :bokeh-issue:`1694` as part of
    :bokeh-milestone:`0.8`.

yields the output:

The repo history shows that :bokeh-commit:`bf19bcb` was made in
in :bokeh-pull:`1698`,which closed :bokeh-issue:`1694` as part of
:bokeh-milestone:`0.8`.

"""
from __future__ import absolute_import

from docutils import nodes, utils
from docutils.parsers.rst.roles import set_classes

from six.moves import urllib

BOKEH_GH = "https://github.com/bokeh/bokeh"

def bokeh_commit(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app
    node = make_gh_link_node(app, rawtext, 'commit', 'commit', 'commit', text, options)
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
        msg = inliner.reporter.error(
            'Github issue number must be a number greater than or equal to 1; '
            '"%s" is invalid.' % text, line=lineno)
        prb = inliner.problematic(rawtext, rawtext, msg)
        return [prb], [msg]
    node = make_gh_link_node(app, rawtext, 'issue', 'issue', 'issues', str(issue_num), options)
    return [node], []

def bokeh_milestone(name, rawtext, text, lineno, inliner, options=None, content=None):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    app = inliner.document.settings.env.app
    node = make_gh_link_node(app, rawtext, 'milestone', 'milestone', 'milestones', text, options)
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
        msg = inliner.reporter.error(
            'Github pull request number must be a number greater than or equal to 1; '
            '"%s" is invalid.' % text, line=lineno)
        prb = inliner.problematic(rawtext, rawtext, msg)
        return [prb], [msg]
    node = make_gh_link_node(app, rawtext, 'pull', 'pull request', 'pull', str(issue_num), options)
    return [node], []

def make_gh_link_node(app, rawtext, role, kind, api_type, id, options=None):
    """ Return a link to a Bokeh Github resource.

    Args:
        app (Sphinx app) : current app
        rawtext (str) : text being replaced with link node.
        role (str) : role name
        kind (str) : resource type (issue, pull, etc.)
        api_type (str) : type for api link
        id : (str) : id of the resource to link to
        options (dict) : options dictionary passed to role function

    """
    url = "%s/%s/%s" % (BOKEH_GH, api_type, id)
    options = options or {}
    try:
        request = urllib.request.Request(url)
        request.get_method = lambda : 'HEAD'
        response = urllib.request.urlopen(request, timeout=5)
    except (urllib.error.HTTPError, urllib.error.URLError):
        app.warn("URL '%s' for :bokeh-%s: role could not be loaded" % (url, role))
    else:
        if response.getcode() >= 400:
            app.warn("URL '%s' for :bokeh-%s: role could not be loaded" % (url, role))
    set_classes(options)
    node = nodes.reference(
        rawtext, kind + ' ' + utils.unescape(id), refuri=url, **options)
    return node

def setup(app):
    app.add_role('bokeh-commit', bokeh_commit)
    app.add_role('bokeh-issue', bokeh_issue)
    app.add_role('bokeh-milestone', bokeh_milestone)
    app.add_role('bokeh-pull', bokeh_pull)
