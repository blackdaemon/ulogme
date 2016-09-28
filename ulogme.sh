#!/bin/bash
# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

cd "$( dirname "${BASH_SOURCE[0]}" )"

if [ "$(uname)" == "Darwin" ]; then
  # This is a Mac
  ./osx/run_ulogme_osx.sh
else
  # Assume Linux
  ./keyfreq.sh &
  ./logactivewin.sh
fi
