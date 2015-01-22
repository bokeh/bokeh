
from docutils import nodes, utils
from docutils.parsers.rst.roles import set_classes

BOKEH_GH = "https://github.com/bokeh/bokeh"

def bokeh_commit(name, rawtext, text, lineno, inliner, options={}, content=[]):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    node = make_gh_link_node(rawtext, 'commit', 'commit', text, options)
    return [node], []

def bokeh_issue(name, rawtext, text, lineno, inliner, options={}, content=[]):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
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
    node = make_gh_link_node(rawtext, 'issue', 'issues', str(issue_num), options)
    return [node], []

def bokeh_milestone(name, rawtext, text, lineno, inliner, options={}, content=[]):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
    node = make_gh_link_node(rawtext, 'milestone', 'milestones', text, options)
    return [node], []

def bokeh_pull(name, rawtext, text, lineno, inliner, options={}, content=[]):
    """Link to a Bokeh Github issue.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    """
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
    node = make_gh_link_node(rawtext, 'pull request', 'pull', str(issue_num), options)
    return [node], []

def make_gh_link_node(rawtext, kind, api_type, id, options={}):
    """ Return a link to a Bokeh Github resource.

    Args:
        rawtext (str) : text being replaced with link node.
        kind (str) : resource type (issue, pull, etc.)
        api_type (str) : type for api link
        id : (str) : id of the resource to link to
        options (dict) : options dictionary passed to role function

    """
    ref = "%s/%s/%s" % (BOKEH_GH, api_type, id)
    set_classes(options)
    node = nodes.reference(
        rawtext, kind + ' ' + utils.unescape(id), refuri=ref, **options)
    return node

def setup(app):
    app.add_role('bokeh-commit', bokeh_commit)
    app.add_role('bokeh-issue', bokeh_issue)
    app.add_role('bokeh-milestone', bokeh_milestone)
    app.add_role('bokeh-pull', bokeh_pull)
