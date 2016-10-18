#!/usr/bin/env python

from __future__ import print_function

import argparse
import datetime
import dateutil.parser
import dateutil.tz
import gzip
import json
import logging
import pickle
import sys

from collections import OrderedDict
from functools import partial
from itertools import count, groupby
from six.moves.urllib.request import urlopen

logging.basicConfig(level=logging.INFO)

API_PARAMS = {
    'base_url': 'https://api.github.com/repos',
    'owner':    'bokeh',
    'repo':     'bokeh',
}

IGNORE_ISSUE_TYPE = {
    'type: discussion',
    'type: tracker',
}

LOG_SECTION = OrderedDict([  # issue type label -> log section heading
    ('type: bug', 'bugfixes'),
    ('type: feature', 'features'),
    ('type: task', 'tasks'),
])

ISSUES_SORT_KEY = lambda issue: (issue_section_order(issue), int(issue['number']))
ISSUES_BY_SECTION = lambda issue: issue_section(issue)


#######################################
# Object Storage
#######################################
def save_object(filename, obj):
    """Compresses and pickles given object to the given filename."""
    logging.info('saving {}...'.format(filename))
    try:
        with gzip.GzipFile(filename, 'wb') as f:
            f.write(pickle.dumps(obj, 1))
    except Exception as e:
        logging.error('save failure: {}'.format(e))
        raise


def load_object(filename):
    """Unpickles and decompresses the given filename and returns the created object."""
    logging.info('loading {}...'.format(filename))
    try:
        with gzip.GzipFile(filename, 'rb') as f:
            buf = ''
            while True:
                data = f.read()
                if data == '':
                    break
                buf += data
            return pickle.loads(buf)
    except Exception as e:
        logging.error('load failure: {}'.format(e))
        raise


#######################################
# Issues
#######################################
def issue_section_order(issue):
    """Returns the section order for the given issue."""
    try:
        return LOG_SECTION.values().index(issue_section(issue))
    except:
        return -1


def issue_completed(issue):
    """Returns True iff this issue is has been resolved as completed."""
    labels = issue.get('labels', [])
    return any(label['name'] == 'reso: completed' for label in labels)


def issue_section(issue):
    """Returns the section heading for the issue, or None if this issue should be ignored."""
    labels = issue.get('labels', [])
    for label in labels:
        if not label['name'].startswith('type: '):
            continue

        if label['name'] in LOG_SECTION:
            return LOG_SECTION[label['name']]
        elif label['name'] in IGNORE_ISSUE_TYPE:
            return None
        else:
            logging.warn('unknown issue type: "{}" for: {}'.format(label['name'], issue_line(issue)))

    return None


def issue_tags(issue):
    """Returns list of tags for this issue."""
    labels = issue.get('labels', [])
    return [label['name'].replace('tag: ', '') for label in labels if label['name'].startswith('tag: ')]


def closed_issue(issue, after=None):
    """Returns True iff this issue was closed after given date. If after not given, only checks if issue is closed."""
    if issue['state'] == 'closed':
        if after is None or parse_timestamp(issue['closed_at']) > after:
            return True
    return False


def relevent_issue(issue, after):
    """Returns True iff this issue is something we should show in the changelog."""
    return (closed_issue(issue, after) and
            issue_completed(issue) and
            issue_section(issue))


def relevant_issues(issues, after):
    """Yields relevant closed issues (closed after a given datetime) given a list of issues."""
    logging.info('finding relevant issues after {}...'.format(after))
    seen = set()
    for issue in issues:
        if relevent_issue(issue, after) and issue['title'] not in seen:
            seen.add(issue['title'])
            yield issue


def closed_issues(issues, after):
    """Yields closed issues (closed after a given datetime) given a list of issues."""
    logging.info('finding closed issues after {}...'.format(after))
    seen = set()
    for issue in issues:
        if closed_issue(issue, after) and issue['title'] not in seen:
            seen.add(issue['title'])
            yield issue


def all_issues(issues):
    """Yields unique set of issues given a list of issues."""
    logging.info('finding issues...')
    seen = set()
    for issue in issues:
        if issue['title'] not in seen:
            seen.add(issue['title'])
            yield issue


#######################################
# GitHub API
#######################################
def get_labels_url():
    """Returns github API URL for querying labels."""
    return '{base_url}/{owner}/{repo}/labels'.format(**API_PARAMS)


def get_issues_url(page, after):
    """Returns github API URL for querying tags."""
    template = '{base_url}/{owner}/{repo}/issues?state=closed&per_page=100&page={page}&since={after}'
    return template.format(page=page, after=after.isoformat(), **API_PARAMS)


def get_tags_url():
    """Returns github API URL for querying tags."""
    return '{base_url}/{owner}/{repo}/tags'.format(**API_PARAMS)


def parse_timestamp(timestamp):
    """Parse ISO8601 timestamps given by github API."""
    dt = dateutil.parser.parse(timestamp)
    return dt.astimezone(dateutil.tz.tzutc())


def read_url(url):
    """Reads given URL as JSON and returns data as loaded python object."""
    logging.debug('reading {url} ...'.format(url=url))
    r = urlopen(url).read()
    return json.loads(r.decode("UTF-8"))


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


def get_data(query_func, load_data=False, save_data=False):
    """Gets data from query_func, optionally saving that data to a file; or loads data from a file."""
    if hasattr(query_func, '__name__'):
        func_name = query_func.__name__
    elif hasattr(query_func, 'func'):
        func_name = query_func.func.__name__

    pickle_file = '{}.pickle'.format(func_name)

    if load_data:
        data = load_object(pickle_file)
    else:
        data = query_func()
        if save_data:
            save_object(pickle_file, data)
    return data


#######################################
# Validation
#######################################
def check_issue(issue, after):
    have_warnings = False
    labels = issue.get('labels', [])
    if 'pull_request' in issue:
        if not any(label['name'].startswith('status: ') for label in labels):
            logging.warn('pull request without status label: {}'.format(issue_line(issue)))
            have_warnings = True
    else:
        if not any(label['name'].startswith('type: ') for label in labels):
            if not any(label['name']=="reso: duplicate" for label in labels):
                logging.warn('issue with no type label: {}'.format(issue_line((issue))))
                have_warnings = True

        if closed_issue(issue, after):
            if not any(label['name'].startswith('reso: ') for label in labels):
                if not any(label['name'] in IGNORE_ISSUE_TYPE for label in labels):
                    logging.warn('closed issue with no reso label: {}'.format(issue_line((issue))))
                    have_warnings = True

    return have_warnings

def check_issues(issues, after=None):
    """Checks issues for BEP 1 compliance."""
    issues = closed_issues(issues, after) if after else all_issues(issues)
    issues = sorted(issues, key=ISSUES_SORT_KEY)

    have_warnings = False

    for section, issue_group in groupby(issues, key=ISSUES_BY_SECTION):
        for issue in issue_group:
            have_warnings |= check_issue(issue, after)

    return have_warnings

#######################################
# Changelog
#######################################
def issue_line(issue):
    """Returns log line for given issue."""
    template = '#{number} {tags}{title}'
    tags = issue_tags(issue)
    params = {
        'title': issue['title'].capitalize().rstrip('.'),
        'number': issue['number'],
        'tags': ' '.join('[{}]'.format(tag) for tag in tags) + (' ' if tags else '')
    }
    return template.format(**params)


def generate_changelog(issues, after, heading, rtag=False):
    """Prints out changelog."""
    relevent = relevant_issues(issues, after)
    relevent = sorted(relevent, key=ISSUES_BY_SECTION)

    def write(func, endofline="", append=""):
        func(heading + '\n' + '-' * 20 + endofline)
        for section, issue_group in groupby(relevent, key=ISSUES_BY_SECTION):
            func('  * {}:'.format(section) + endofline)
            for issue in reversed(list(issue_group)):
                func('    - {}'.format(issue_line(issue)) + endofline)
        func(endofline + append)

    if rtag is not False:
        with open("../CHANGELOG", "r+") as f:
            content = f.read()
            f.seek(0)
            write(f.write, '\n', content)
    else:
        write(print)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates a bokeh changelog using the github API.')

    limit_group = parser.add_mutually_exclusive_group(required=True)
    limit_group.add_argument('-d', '--since-date', metavar='DATE',
                             help='select issues that occurred after the given ISO8601 date')
    limit_group.add_argument('-p', '--since-tag', metavar='TAG',
                             help='select issues that occurred after the given git tag')

    parser.add_argument('-c', '--check', action='store_true', default=False,
                        help='check closed issues for BEP 1 compliance')
    parser.add_argument('-r', '--release-tag', metavar='RELEASE',
                        help='the proposed new release tag.\n'
                             'NOTE: this will automatically write the output to the CHANGELOG')

    data_group = parser.add_mutually_exclusive_group()
    data_group.add_argument('-s', '--save-data', action='store_true', default=False,
                            help='save api query result data; useful for testing')
    data_group.add_argument('-l', '--load-data', action='store_true', default=False,
                            help='load api data from previously saved data; useful for testing')

    args = parser.parse_args()

    if args.since_tag:
        tags = get_data(query_tags, load_data=args.load_data, save_data=args.save_data)
        after = dateof(args.since_tag, tags)
        heading = 'Since {:>14}:'.format(args.since_tag)
    elif args.since_date:
        after = dateutil.parser.parse(args.since_date)
        after = after.replace(tzinfo=dateutil.tz.tzlocal())
        heading = 'Since {:>14}:'.format(after.date().isoformat())

    issues = get_data(partial(query_all_issues, after), load_data=args.load_data, save_data=args.save_data)

    if args.check:
        have_warnings = check_issues(issues)
        if have_warnings:
            sys.exit(1)
        sys.exit(0)

    if args.release_tag:
        heading = '{} {:>8}:'.format(str(datetime.date.today()), args.release_tag)
        generate_changelog(issues, after, heading, args.release_tag)
    else:
        generate_changelog(issues, after, heading)
