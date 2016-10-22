#!/bin/bash
# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

SSS_NOSCREENSAVER=".*no[[:blank:]]screensaver.*"
SSS_NONBLANKED=".*non-blanked.*"
SSS_NOSAVERSTATUS="no saver status on root window"

function alarm {
 ( speaker-test --frequency $1 --test sine > /dev/null 2>&1 )&
  pid=$!
  sleep 0.${2}s
  kill -9 $pid > /dev/null 2>&1
}

while true
do
    MOD_TS=$(stat -c %Y logs/window_$(python ./rewind7am.py).txt)
    NOW=$(date +%s)

    if [ $(( NOW - MOD_TS )) -gt $(( 5 * 60 )) ]; then
        islocked=true
        sss=$(xscreensaver-command -time 2>&1)
        if [[ $sss =~ $SSS_NOSCREENSAVER || $sss =~ $SSS_NONBLANKED || $sss =~ $SSS_NOSAVERSTATUS ]]; then
            islocked=false
            alarm 2000 200
            sleep 0.1
            alarm 2000 200
            sleep 0.1
            alarm 2000 200
            sleep 0.1
            alarm 2000 200
        fi
    fi
    sleep 60
done
