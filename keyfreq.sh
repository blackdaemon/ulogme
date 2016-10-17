#!/bin/bash
# vim:set ff=unix tabstop=2 shiftwidth=2 expandtab:

# logs the key press frequency over 9 second window. Logs are written
# in logs/keyfreqX.txt every 9 seconds, where X is unix timestamp of 7am of the
# recording day.

set -o nounset

#############################################
# CONSTANTS
#############################################

readonly LANGUAGE=en_US
readonly LANG=en_US.utf8


#############################################
# CONFIGURATION VARIABLES
#############################################

POLLING_INTERVAL=9
COMPRESS_LOG_FILE=true
# Modifier keys will not be counted
readonly MODIFIER_KEYS="$(xmodmap -pk | grep -iE '\b(shift_[lr]|alt_[lr]|control_[lr]|caps_lock)\b' | cut -f 1 | xargs | tr ' ' '|')"
readonly HELPER_FILE=/dev/shm/keyfreqraw


#############################################
# FUNCTIONS & INIT
#############################################


#############################################
# MAIN
#############################################

mkdir -p logs

last_log_file=""

while true
do
  # check each possible keyboard
  keyboardIds=$(xinput | grep 'slave  keyboard' | grep -o 'id=[0-9]*' | cut -d= -f2)
  # and grep only the updated ones
  filesToGrep=''
  for kbd_id in $keyboardIds; do
    fileName="${HELPER_FILE}.$kbd_id"
    # Works in windows of 9 seconds.
    # Use stdbuf to remove output buffering otherwise it does not log keys before it's terminated by timeout command
    { (stdbuf -o0 timeout -s 9 $POLLING_INTERVAL xinput test $kbd_id 2>/dev/null `# Grab key events for 9 seconds` \
    	| grep press 2>/dev/null `# Filter out only press events (I am getting doubled release events for some reason)` \
    	| tr -dc '0-9\n' `# Keep only keycodes` \
    	| grep -vE "$MODIFIER_KEYS" `# Remove modifier keys` \
    	| tr -c '\n' '0' `# Replace keycodes with 0 for added security` \
    	) > "$fileName"; } &
    filesToGrep+="$fileName "
  done

  wait

  # count number of key release events
  num=$(cat $filesToGrep | wc -l)
  # append unix time stamp and the number into file
  log_file="logs/keyfreq_$(python rewind7am.py).txt"
  echo "$(date +%s) $num" >> "$log_file"
  echo "logged key frequency: $(date) $num keypress events detected into $log_file"
  if [ "$last_log_file" != "$log_file" ]; then
    # Optionally compress the log file (remove extraneous 0 key counts)
    if [ $COMPRESS_LOG_FILE = true ] && [ -s "$last_log_file" ]; then
      grep -s -v " 0$" -A 1 -B 1 "$last_log_file" | sort -u | grep -s -v "^\-\-$" > "${last_log_file}.compressed"
      echo "Compressing keyfreq log file: $(ls -hsx ${last_log_file}*)"
      mv -f -- "${last_log_file}.compressed" "$last_log_file"
    fi
    # Create symlink to most recent log file everytime it changes its name,
    # so we can use something like "tail -F logs/keyfreq_today.txt"
    ln -s -f "$(basename "$log_file")" "logs/keyfreq_today.txt"
    last_log_file="$log_file"
  fi
done

