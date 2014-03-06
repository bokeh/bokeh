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


def parse_timestamp(timestamp):
    """Parse ISO8601 timestamps given by github API."""
    dt = dateutil.parser.parse(timestamp)
    return dt.astimezone(dateutil.tz.tzutc())


def closed(issues, after):
    """Yields only closed issues (closed after a given datetime) given a list of issues."""
    for issue in issues:
        if issue['state'] == 'closed':
            if parse_timestamp(issue['closed_at']) > after:
                yield issue


def changekind(issue):
    """Returns change type name as string, otherwise None."""
    for label in issue.get('labels', []):
        if label['name'] == 'enhancement':
            return 'enhancement'
        elif label['name'] == 'bug':
            return 'bugfix'
    return None


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
    after_group.add_argument('-d', metavar='DATE', type=str, help='ISO8601 date string (local timezone assumed)')
    after_group.add_argument('-t', metavar='TAG_NAME', type=str, help='Git tag name')
    args = parser.parse_args()

    if args.t:
        tags = query_tags()
        after = dateof(args.t, tags)
    elif args.d:
        after = dateutil.parser.parse(args.d)
        after = after.replace(tzinfo=dateutil.tz.tzlocal())

    by_kind_number = lambda issue: (changekind(issue), int(issue['number']))
    by_kind = lambda issue: changekind(issue)

    issues = query_issues()
    relevent_issues = closed(issues, after)
    relevent_issues = sorted(relevent_issues, key=by_kind_number)

    header_params = {
        'since': 'since ' if args.d else '',
        'date': after.date(),
        'tag': args.t if args.t else '',
    }
    print('{since}{date}{tag:>9}'.format(**header_params).rstrip() + ':\n' + '-' * 20)

    for kind, issue_group in groupby(relevent_issues, key=by_kind):
        if(kind):
            print('* {}s:'.format(kind))
        for issue in issue_group:
            if kind:
                print('  - #{} {}'.format(issue['number'], issue['title']))
            else:
                print('* #{} {}'.format(issue['number'], issue['title']))
