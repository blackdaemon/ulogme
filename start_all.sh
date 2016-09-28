#!/bin/bash

function kill_process {
#        echo "Killing '$1'"
    pkill -SIGTERM -f "$1"
    while [ 0$(pgrep "$1") -gt 0 ]
    do
        sleep 0.5
        pkill -SIGTERM -f "$1"
    done
}

kill_process ulogme.sh
kill_process ulogme_serve.py
kill_process "/bin/bash ./logactivewin.sh"
kill_process "./keyfreq.sh"

nohup ./ulogme.sh > ./ulogme.log 2>&1 &
nohup python ./ulogme_serve.py > ./ulogme_serve.log 2>&1 &
