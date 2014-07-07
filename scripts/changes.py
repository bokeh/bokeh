#!/usr/bin/env python

from __future__ import print_function

import argparse
import dateutil.parser
import dateutil.tz
import json
import logging
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
    ('enhancement', 'enhancements'),
    ('bug', 'bugfixes'),
    ('tests', 'tests'),
    ('docs', 'documentation'),
    ('FailedReview', None),
    ('HOTFIX', None),
    ('NeedsReview', None),
    ('PassedReview', None),
    ('Superceded', None),
    ('WIP', None),
    ('discussion', None),
    ('duplicate', None),
    ('invalid', None),
    ('python3', None),
    ('question', None),
    ('upstream', None),
    ('wontfix', None)
])


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
    seen = set()
    for issue in issues:
        if relevent_issue(issue, after) and not issue['title'] in seen:
            seen.add(issue['title'])
            yield issue


def query_tags():
    """Hits the github API for repository tags and returns the data."""
    url = get_tags_url()
    logging.debug('reading {url} ...'.format(url=url))
    r = urllib2.urlopen(url).read()
    return json.loads(r)


def query_issues(page, after):
    """Hits the github API for a single page of closed issues and returns the data."""
    url = get_issues_url(page, after)
    logging.debug('reading {url} ...'.format(url=url))
    r = urllib2.urlopen(url).read()
    return json.loads(r)


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
            url = tag['commit']['url']
            logging.debug('reading {url} ...'.format(url=url))
            r = urllib2.urlopen(url).read()
            commit = json.loads(r)
            return parse_timestamp(commit['commit']['committer']['date'])
    return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates a bokeh changelog using the github API.')
    after_group = parser.add_mutually_exclusive_group(required=True)
    after_group.add_argument('-d', metavar='DATE',
                             help='select changes that occurred after the given ISO8601 date')
    after_group.add_argument('-t', metavar='TAG',
                             help='select changes that occurred after the given git tag')
    parser.add_argument('-v', metavar='VERSION',
                        help="generate header using today's date and the given version")
    args = parser.parse_args()

    if args.t:
        tags = query_tags()
        after = dateof(args.t, tags)
        label = 'Since {:>14}:'.format(args.t)
    elif args.d:
        after = dateutil.parser.parse(args.d)
        after = after.replace(tzinfo=dateutil.tz.tzlocal())
        label = 'Since {:>14}:'.format(after.date())

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
