#!/usr/bin/env python

from __future__ import print_function

import argparse
import dateutil.parser
import dateutil.tz
import json
import urllib2

from datetime import datetime
from itertools import groupby
from pprint import pprint


API_PARAMS = {
    'owner': 'ContinuumIO',
    'repo': 'bokeh',
}
ISSUES_URL = 'https://api.github.com/repos/{owner}/{repo}/issues?state=closed'.format(**API_PARAMS)
TAGS_URL = 'https://api.github.com/repos/{owner}/{repo}/tags'.format(**API_PARAMS)
CHANGEKIND_ORDER = [None, 'enhancements', 'bugfixes', 'test', 'docs']
CHANGEKIND_SHOW = CHANGEKIND_ORDER[:3] # show only these change kinds


def parse_timestamp(timestamp):
    """Parse ISO8601 timestamps given by github API."""
    dt = dateutil.parser.parse(timestamp)
    return dt.astimezone(dateutil.tz.tzutc())


def changekind(issue):
    """Returns change kind name of given issue, or None if it has no kind."""
    for label in issue.get('labels', []):
        if label['name'] == 'enhancement':
            return 'enhancements'
        elif label['name'] == 'bug':
            return 'bugfixes'
        elif label['name'] == 'docs':
            return 'documentation'
        elif label['name'] == 'test':
            return 'tests'
    return None


def relevant_issues(issues, after):
    """Yields relevant closed issues (closed after a given datetime) given a list of issues."""
    seen = set()
    for issue in issues:
        if (issue['state'] == 'closed' and
            parse_timestamp(issue['closed_at']) > after and
            changekind(issue) in CHANGEKIND_SHOW and
            not issue['title'] in seen):
                seen.add(issue['title'])
                yield issue


def query_tags():
    """Hits the github API for repository tags and returns the data."""
    r = urllib2.urlopen(TAGS_URL).read()
    return json.loads(r)


def query_issues():
    """Hits the github API for closed issues and returns the data."""
    r = urllib2.urlopen(ISSUES_URL).read()
    return json.loads(r)


def dateof(tag_name, tags):
    """Given a list of tags, returns the datetime of the tag with the given name; Otherwise None."""
    for tag in tags:
        if tag['name'] == tag_name:
            r = urllib2.urlopen(tag['commit']['url']).read()
            commit = json.loads(r)
            return parse_timestamp(commit['commit']['committer']['date'])
    return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates a change log since the given tag using the github API.')
    after_group = parser.add_mutually_exclusive_group(required=True)
    after_group.add_argument('-d', metavar='DATE', type=str, help='select changes that occurred after the given ISO8601 date')
    after_group.add_argument('-t', metavar='TAG', type=str, help='select changes that occurred after the given git tag')
    parser.add_argument('-v', metavar='VERSION', type=str, help="generate header using today's date and the given version")
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

    sort_key = lambda issue: (CHANGEKIND_ORDER.index(changekind(issue)), int(issue['number']))
    by_kind = lambda issue: changekind(issue)

    issues = query_issues()
    issues = relevant_issues(issues, after)
    issues = sorted(issues, key=sort_key)

    print(label + '\n' + '-' * 20)
    for kind, issue_group in groupby(issues, key=by_kind):
        if(kind):
            print('  * {}:'.format(kind))
        for issue in issue_group:
            prefix = '    - ' if kind else '  * '
            title = issue['title'].capitalize().rstrip('.')
            print(prefix + '#{} {}'.format(issue['number'], title))
