#!/bin/bash

banner() {
  echo
  echo "+------------------------------------------------------------------------------------+"
  printf "| %-80s   |\n" "$@"
  echo "+------------------------------------------------------------------------------------+"
  echo
}

set -x #echo on

# There is deliberately no `set -e` here: every downstream suite must run even when an
# earlier one fails. Instead each suite's exit status is captured and classified, and
# this script exits non-zero only on unambiguous "this suite could not run" signals.
# See classify() for the mapping.

# Panel and HoloViews both set `asyncio_mode = "auto"`, which is restored below with -o.
# pytest accepts that option even when the plugin is absent and then silently ignores it,
# turning every async test into "async def functions are not natively supported", 200+
# ordinary-looking failures instead of an obvious error. Fail loudly instead.
if ! python -c 'import pytest_asyncio' 2> /dev/null; then
  banner "pytest-asyncio is not installed, see conda/environment-test-downstream.yml"
  exit 1
fi

RESULTS_DIR="${RUNNER_TEMP:-/tmp}/downstream-results"
mkdir -p "$RESULTS_DIR"

SUMMARY_ROWS=()
FAILED_SUITES=()
HARD_FAIL=0

# Classify one suite's outcome and record a summary row.
#
# pytest exit codes: 0 ok, 1 tests failed, 2 interrupted (this is what a collection or
# import error produces), 3 internal error, 4 usage error, 5 no tests collected.
#
# A missing JUnit XML means the suite never reached the end of its session, e.g. it was
# hard-killed by pytest-timeout (which calls os._exit(1)) or the working directory did
# not exist. That is indistinguishable from an ordinary test failure by exit code alone,
# so the results file is what separates the two.
classify() {
  local name=$1 rc=$2 xml=$3 min=$4
  local status counts="-" tests="" failures="" errors="" skipped=""

  if [[ -f $xml ]]; then
    read -r tests failures errors skipped <<<"$(python -c '
import sys, xml.etree.ElementTree as ET
s = ET.parse(sys.argv[1]).getroot().find("testsuite")
print(s.get("tests"), s.get("failures"), s.get("errors"), s.get("skipped"))
' "$xml" 2> /dev/null)"
    [[ -n $tests ]] && counts="$tests tests, $failures failed, $errors errors, $skipped skipped"
  fi

  case $rc in
    0)   status="pass" ;;
    1)   if [[ -f $xml ]]; then
           status="tests failed"
         else
           status="CRASHED (no results written)"; HARD_FAIL=1
         fi ;;
    2)   status="ERROR: collection/import failure"; HARD_FAIL=1 ;;
    5)   status="ERROR: no tests collected";        HARD_FAIL=1 ;;
    127) status="ERROR: command not found";         HARD_FAIL=1 ;;
    *)   status="ERROR: exit $rc";                  HARD_FAIL=1 ;;
  esac

  # A suite that quietly stops collecting most of its tests is the same failure this
  # script exists to catch, and pytest reports it as success. The floors are catastrophic
  # drop tripwires at roughly half the observed count, not exact expectations.
  if [[ $status == pass || $status == "tests failed" ]] \
     && [[ $tests =~ ^[0-9]+$ ]] && (( tests < min )); then
    status="ERROR: only $tests tests collected, expected at least $min"
    HARD_FAIL=1
  fi

  [[ $status == ERROR* || $status == CRASHED* ]] && FAILED_SUITES+=("$name")
  SUMMARY_ROWS+=("| $name | $status | $rc | $counts |")
}

# run_suite <display name> <results slug> <working directory> <min tests> <pytest args...>
run_suite() {
  local name=$1 slug=$2 workdir=$3 min=$4
  shift 4
  local xml="$RESULTS_DIR/$slug.xml"

  # A leftover results file would make a crashed suite look like it merely failed.
  rm -f "$xml"

  banner "$name" 2> /dev/null
  ( cd "$workdir" && pytest "$@" "--junitxml=$xml" )
  local rc=$?

  classify "$name" "$rc" "$xml" "$min"
}

SITE_PACKAGES=$(python -c 'import site; print(site.getsitepackages()[0])')

run_suite "Dask -- dask/diagnostics"      dask        dask               15 dask/diagnostics
run_suite "Dask -- distributed/dashboard" distributed distributed        35 distributed/dashboard

# Panel and HoloViews are tested as installed, so their own pyproject.toml pytest
# configuration does not apply. Only the settings that change what actually runs are
# restored here: `asyncio_mode` for both, plus `python_classes` for HoloViews, whose
# suite has classes such as BokehRendererTest that pytest's default `Test*` pattern
# does not match (37 tests). Their `filterwarnings = ["error", ...]` is deliberately not
# replicated, since warnings-as-errors against a Bokeh dev build would fail for
# unrelated reasons.
run_suite "Panel"                         panel       "$SITE_PACKAGES" 1500 panel/tests \
    -o asyncio_mode=auto -o asyncio_default_fixture_loop_scope=function

run_suite "HoloViews"                     holoviews   "$SITE_PACKAGES"  400 holoviews/tests/plotting/bokeh \
    -o asyncio_mode=auto -o asyncio_default_fixture_loop_scope=function \
    -o 'python_classes=*Test*'

set +x
{
  echo "## Downstream test results"
  echo
  echo "| Suite | Status | Exit | Counts |"
  echo "| --- | --- | --- | --- |"
  printf '%s\n' "${SUMMARY_ROWS[@]}"
  echo
  echo "_Ordinary test failures are reported but do not fail this job._"
} | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"

# Consumed by the notify-failure job so the notification can name the broken suites.
if [[ -n ${GITHUB_OUTPUT:-} ]]; then
  printf 'failed-suites=%s\n' "$(IFS=,; echo "${FAILED_SUITES[*]}")" >> "$GITHUB_OUTPUT"
fi

exit $HARD_FAIL
