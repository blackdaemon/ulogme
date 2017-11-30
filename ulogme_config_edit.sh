#!/bin/bash

SCRIPT_DIR="$(dirname $0)"
find $SCRIPT_DIR/conf/*.* | grep -vE "_example.|~$" | xargs -n1 ${FCEDIT:-${VISUAL:-${EDITOR:-vim}}}
