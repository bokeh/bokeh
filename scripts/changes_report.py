from __future__ import print_function
import subprocess, shlex

from api_report import diff_versions

current = subprocess.check_output(shlex.split("git describe --tags"))
previous = subprocess.check_output(shlex.split("git tag --sort=-version:refname"))
previous = str.split(previous, "\n")
previous = [x for x in previous if not any(y.isalpha() for y in x)][0]
diff = diff_versions(previous, current)

if __name__ == "__main__" and __package__ is None:
    import os, sys
    sys.path.append(os.path.abspath("tests"))
    from plugins.upload_to_s3 import upload_file_to_s3_by_job_id
