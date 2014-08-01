#!/usr/bin/env python

from __future__ import print_function

import argparse
import os.path
import subprocess

from glob import glob
from itertools import count

def exercise_lines(path):
    """Yields lines of the given exercise file which are exercise comments."""
    with open(path) as fin:
        within_exercise = False
        for line, line_number in zip(fin, count(1)):
            line = line.lstrip()

            if within_exercise and line.startswith('#'):
                yield line_number
            elif not within_exercise and line.startswith('#') and 'EXERCISE:' in line:
                within_exercise = True
                yield line_number
            else:
                within_exercise = False


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prints out exercise comment line numbers of python files in the specified directory.')
    parser.add_argument('directory', metavar='DIRECTORY', type=str, nargs='?', help='If given, overrides the default search directory.')
    args = parser.parse_args()

    if args.directory:
        directory = args.directory
    else:
        root = subprocess.check_output(['git', 'rev-parse', '--show-toplevel']).strip()
        directory = os.path.join(root, 'sphinx', 'source', 'tutorial', 'exercises')

    for path in glob(os.path.join(directory, '*.py')):
        lines = exercise_lines(path)
        print('{}: {}'.format(path, ','.join(str(line) for line in lines)))
