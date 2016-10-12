#!/bin/bash
# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

set -o nounset

LANGUAGE=en_US
LANG=en_US.utf8

for logfile in logs/keyfreq_*.txt; do 
	if [ ! -s "$logfile" ]; then
		continue
	fi
	grep -s -v " 0$" -A 1 -B 1 "$logfile" | sort -u | grep -s -v "^\-\-$" > "${logfile}.compressed"
	ls -hsx ${logfile}*
	mv -f "${logfile}.compressed" "$logfile"
done