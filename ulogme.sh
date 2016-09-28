#!/bin/bash
# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

if [ "$(uname)" == "Darwin" ]; then
  # This is a Mac
  ./osx/run_ulogme_osx.sh
else
  # Assume Linux
  sudo echo -n ""
  sudo ./keyfreq.sh &
  ./logactivewin.sh
fi
