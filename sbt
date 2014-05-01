#!/bin/bash

function usage {
    echo "Usage: `basename $0` [OPTION|COMMAND]... -- [JVM OPTION]..."
}

while getopts h OPT;
do
    case "$OPT" in
        h)
            usage
            exit 0
            ;;
        \?)
            usage
            exit 1;
            ;;
    esac
done

shift `expr $OPTIND - 1`

SEP=" -- "
OPTS=$@

SBT_OPTS="${OPTS%$SEP*}"

if [ "$SBT_OPTS" != "$OPTS" ]; then
    JVM_OPTS="${OPTS#*$SEP}"
else
    JVM_OPTS=""
fi

JVM_DEFAULTS="-Dfile.encoding=UTF-8 -Xss8M -Xmx2G -XX:MaxPermSize=1024M -XX:ReservedCodeCacheSize=64M -XX:+UseConcMarkSweepGC -XX:+CMSClassUnloadingEnabled"
JVM_OPTS="$JVM_DEFAULTS $JVM_OPTS"

SBT_VERSION=$(cat project/build.properties | grep sbt.version | cut -d'=' -f2)
SBT_LAUNCHER="$(dirname $0)/project/sbt-launch-$SBT_VERSION.jar"

if [ ! -e "$SBT_LAUNCHER" ]; then
    URL="http://repo.typesafe.com/typesafe/ivy-releases/org.scala-sbt/sbt-launch/$SBT_VERSION/sbt-launch.jar"
    curl -o $SBT_LAUNCHER $URL
fi

java $JVM_OPTS -jar $SBT_LAUNCHER $SBT_OPTS
