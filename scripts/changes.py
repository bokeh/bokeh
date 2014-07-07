#!/usr/bin/env python

from __future__ import print_function

import argparse
import dateutil.parser
import dateutil.tz
import json
import logging
import sys
import urllib2

from datetime import datetime
from itertools import count, groupby
from collections import OrderedDict

logging.basicConfig(level=logging.INFO)

API_PARAMS = {
    'base_url': 'https://api.github.com/repos',
    'owner': 'ContinuumIO',
    'repo': 'bokeh',
}
CHANGEKIND_NAME = OrderedDict([  # issue label -> change kind name (or None to ignore)
    ('', 'unlabeled'),  # special "label" to indicate issue has no labels
    ('type: feature', 'features'),
    ('type: bug', 'bugfixes'),
    ('tests', 'tests'),
    ('docs', 'documentation'),
    ('duplicate', None),
    ('invalid', None),
    ('python3', None),
    ('status: WIP', None),
    ('status: accepted', None),
    ('status: ready', None),
    ('status: rejected', None),
    ('superceded', None),
    ('type: discussion', None),
    ('type: question', None),
    ('type: task', None),
    ('upstream', None),
    ('wontfix', None),
])


def get_labels_url():
    """Returns github API URL for querying labels."""
    return '{base_url}/{owner}/{repo}/labels'.format(**API_PARAMS)


def get_issues_url(page, after):
    """Returns github API URL for querying tags."""
    return '{base_url}/{owner}/{repo}/issues?state=closed&per_page=100&page={page}&since={after}'.format(
        page=page, after=after.isoformat(), **API_PARAMS)


def get_tags_url():
    """Returns github API URL for querying tags."""
    return '{base_url}/{owner}/{repo}/tags'.format(**API_PARAMS)


def changekind_order(issue):
    return CHANGEKIND_NAME.values().index(changekind(issue))


def parse_timestamp(timestamp):
    """Parse ISO8601 timestamps given by github API."""
    dt = dateutil.parser.parse(timestamp)
    return dt.astimezone(dateutil.tz.tzutc())


def changekind(issue):
    """Returns change kind name of the given issue, otherwise None."""
    labels = issue.get('labels', [])
    if not labels:
        return 'unlabeled'
    for label in labels:
        name = CHANGEKIND_NAME.get(label['name'], None)
        if name:
            return name
    return None


def relevent_issue(issue, after):
    """Returns True iff this issue is something we should show in the changelog."""
    return (issue['state'] == 'closed' and
            parse_timestamp(issue['closed_at']) > after and
            changekind(issue))


def relevant_issues(issues, after):
    """Yields relevant closed issues (closed after a given datetime) given a list of issues."""
    print('finding relevant issues after {}...'.format(after))
    seen = set()
    for issue in issues:
        if relevent_issue(issue, after) and not issue['title'] in seen:
            seen.add(issue['title'])
            yield issue


def read_url(url):
    """Reads given URL as JSON and returns data as loaded python object."""
    logging.debug('reading {url} ...'.format(url=url))
    r = urllib2.urlopen(url).read()
    return json.loads(r)


def query_labels():
    """Hits the github API for repository labels and returns the data."""
    return read_url(get_labels_url())


def query_tags():
    """Hits the github API for repository tags and returns the data."""
    return read_url(get_tags_url())


def query_issues(page, after):
    """Hits the github API for a single page of closed issues and returns the data."""
    return read_url(get_issues_url(page, after))


def query_all_issues(after):
    """Hits the github API for all closed issues after the given date, returns the data."""
    page = count(1)
    data = []
    while True:
        page_data = query_issues(next(page), after)
        if not page_data:
            break
        data.extend(page_data)
    return data


def dateof(tag_name, tags):
    """Given a list of tags, returns the datetime of the tag with the given name; Otherwise None."""
    for tag in tags:
        if tag['name'] == tag_name:
            commit = read_url(tag['commit']['url'])
            return parse_timestamp(commit['commit']['committer']['date'])
    return None


def list_tags():
    """List known repository tags compared to current change kind configuration."""
    data = []
    labels = query_labels()
    label_names = set(label['name'] for label in labels)

    # check current labels against config
    for name in label_names:
        if name in CHANGEKIND_NAME:
            if CHANGEKIND_NAME[name]:
                kind = str(CHANGEKIND_NAME[name])
                index = str(CHANGEKIND_NAME.keys().index(name))
            else:
                kind = ''
                index = 'disabled'
        else:
            kind = ''
            index = 'not configured'
        data.append([name, kind, index])

    # check for defunct config
    for name in CHANGEKIND_NAME.keys():
        if name and name not in label_names:
            data.append([name, '', 'defunct'])

    col_width = max(len(word) for row in data for word in row) + 2
    print(''.join(word.ljust(col_width) for word in ['name', 'change kind', 'log order']))
    for row in sorted(data, key=lambda d: d[2]):
        print(''.join(word.ljust(col_width) for word in row))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates a bokeh changelog using the github API.')
    agroup = parser.add_mutually_exclusive_group()
    agroup.add_argument('-d', metavar='DATE',
                        help='select changes that occurred after the given ISO8601 date')
    agroup.add_argument('-t', metavar='TAG',
                        help='select changes that occurred after the given git tag')
    parser.add_argument('-v', metavar='VERSION',
                        help="generate header using today's date and the given version")
    parser.add_argument("-l", "--list-tags", action="store_true", default=False,
                        help="list all currently known tags for bokeh")
    args = parser.parse_args()

    if args.list_tags:
        list_tags()
        sys.exit(0)

    if args.t:
        tags = query_tags()
        after = dateof(args.t, tags)
        label = 'Since {:>14}:'.format(args.t)
    elif args.d:
        after = dateutil.parser.parse(args.d)
        after = after.replace(tzinfo=dateutil.tz.tzlocal())
        label = 'Since {:>14}:'.format(after.date())
    else:
        print('error: one of the arguments -d or -t is required', file=sys.stderr)
        sys.exit(1)

    if args.v:
        label = '{}{:>9}:'.format(datetime.now().date(), args.v)

    sort_key = lambda issue: (changekind_order(issue), int(issue['number']))
    by_kind = lambda issue: changekind(issue)

    issues = query_all_issues(after)
    issues = relevant_issues(issues, after)
    issues = sorted(issues, key=sort_key)

    print(label + '\n' + '-' * 20)
    for kind, issue_group in groupby(issues, key=by_kind):
        if kind != 'unlabeled':
            print('  * {}:'.format(kind))
        for issue in issue_group:
            prefix = '    - ' if kind != 'unlabeled' else '  * '
            title = issue['title'].capitalize().rstrip('.')
            print(prefix + '#{} {}'.format(issue['number'], title))
