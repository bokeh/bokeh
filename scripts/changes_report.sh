#!/usr/bin/env bash
LAST=($(git tag --sort=-version:refname | grep -v '[a-zA-Z]'));
CURRENT=$(git describe --tags);
FILENAME=$LAST"_"$CURRENT".txt";
OUTPUT=$(python scripts/api_report.py $LAST $CURRENT);
echo "$OUTPUT" > $FILENAME;
