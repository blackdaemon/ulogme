#!/bin/bash
# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

set -o nounset

LANGUAGE=en_US
LANG=en_US.utf8

# logs the active window titles over time. Logs are written 
# in logs/windowX.txt, where X is unix timestamp of 7am of the
# recording day. The logs are written if a window change event occurs
# (with 2 second frequency check time), or every 10 minutes if 
# no changes occur.

SSS_NOSCREENSAVER=".*no[[:blank:]]screensaver.*"
SSS_NONBLANKED=".*non-blanked.*"
SSS_NOSAVERSTATUS="no saver status on root window"

WAIT_TIME="5" # number of seconds between executions of loop
MIN_WRITE_TIME=600
MIN_IDLE_TIME=$(( 5 * 60 ))
IDLE_NOTIFICATION_TIME=10
NOTIFY_IDLE=true
NO_IDLE_WINDOWS_CONF="./conf/no_idle_windows.conf"

if ! type notify-send >/dev/null 2>&1
then
	echo "WARNING: 'notify-send' not installed, idle notification will not be available"
	NOTIFY_IDLE=false
fi

notify_idle() {
	if [ $NOTIFY_IDLE = true ]; then
		notify-send -t $(( IDLE_NOTIFICATION_TIME * 1000 )) -c "presence" -i "$(pwd)/render/favicon.png" -u critical "ulogme" "Logging computer idle in $IDLE_NOTIFICATION_TIME seconds"
	fi
}

type xprintidle >/dev/null 2>&1 || echo "WARNING: 'xprintidle' not installed, idle time detection will not be available (screen saver / lock screen detection only)"

# Get idle time in seconds. If xprintidle is not installed, returns 0.
get_idle_time() {
    type xprintidle >/dev/null 2>&1 && echo $(( $(timeout -s 9 1 xprintidle) / 1000 )) || echo 0
}

#------------------------------

mkdir -p logs
lasttitle=""
idle_notification_on=false
last_write=$(date +%s)
last_log_file=""

while true
do
	islocked=true
	# Try to figure out which Desktop Manager is running and set the
	# screensaver commands accordingly.
    if [ $(pgrep -x xscreensaver | wc -l) -gt 0 ]; then
        # This covers also XFCE, assume it uses xscreensaver by default.
        sss=$(xscreensaver-command -time 2>&1)
        if [[ $sss =~ $SSS_NOSCREENSAVER || $sss =~ $SSS_NONBLANKED || $sss =~ $SSS_NOSAVERSTATUS ]]; then
            islocked=false;
        fi
    elif [[ $GDMSESSION == 'ubuntu' || $GDMSESSION == 'ubuntu-2d' || $GDMSESSION == 'gnome-shell' || $GDMSESSION == 'gnome-classic' || $GDMSESSION == 'gnome-fallback' || $GDMSESSION == 'gnome' || $GDMSESSION == 'cinnamon' ]]; then
		# Assume the GNOME/Ubuntu/cinnamon folks are using gnome-screensaver.
		screensaverstate=$(gnome-screensaver-command -q 2>&1 /dev/null)
        if [[ $screensaverstate =~ .*inactive.* ]]; then
                islocked=false
        fi
	elif [[ $XDG_SESSION_DESKTOP == 'KDE' ]]; then
		islocked=$(qdbus org.kde.screensaver /ScreenSaver org.freedesktop.ScreenSaver.GetActive)
	else
		# If we can't find the screensaver, assume it's missing.
		islocked=false
	fi

	if [ $islocked = true ]; then
		curtitle="__LOCKEDSCREEN"
	else 
		# Get commandline and window title separated by "|"
		curtitle=""
		wid=$(xdotool getactivewindow)
		while read -ra a; do
			w="${a[0]}"
			if [ "$((16#${w:2}))" = $wid ]; then
				pid="${a[@]:2:1}"
				if [ "$pid" -eq 0 ]; then
					continue
				fi
				title="${a[@]:8}"
				command="$(stdbuf -o0 timeout -s 9 4 ps --no-headers -o command -q "$pid" 2>/dev/null | sed -r 's/\|/<pipe>/')"
				curtitle="$command|$title"
				break
			fi			
		done < <(wmctrl -lpG) 
		

		idle_time=$(get_idle_time)
        if [ $idle_time -ge $(( MIN_IDLE_TIME - IDLE_NOTIFICATION_TIME )) ]; then
			# Test if foreground window allows disregarding user idle (e.g. when playing videos)
            disregard_idle=false
            if [ -s "$NO_IDLE_WINDOWS_CONF" ]; then
                while IFS=$'\n' read -r niw_regexp; do
                	# Ignore empty lines
                    if [ -z "$niw_regexp" ]; then
                        continue
                    fi
                    if [[ "$curtitle" =~ $niw_regexp ]]; then
                        disregard_idle=true
                        break
                    fi
            	done < "$NO_IDLE_WINDOWS_CONF"
            fi
            if [ $disregard_idle = false ]; then
            	if [ $idle_time -ge $MIN_IDLE_TIME ]; then
                	curtitle="__IDLE"
	            else
    	            if [ $idle_notification_on != true ]; then
        	            notify_idle
            	        idle_notification_on=true
                	fi 
                fi
            fi
        else
            idle_notification_on=false
        fi
	fi

    # Detect suspend
    was_awaken=false
	if [ -f '/var/log/pm-suspend.log' ]; then
		suspended_at=$(grep -E ': (performing suspend|Awake)' /var/log/pm-suspend.log | tail -n 2 | tr '\n' '|' | sed -rn 's/^(.*): performing suspend.*\|.*: Awake.*/\1/p')
		if [ -n "$suspended_at" ]; then
			suspended_at=$(date -d "$suspended_at" +%s)
			if [ $suspended_at -ge $last_write ]; then
				# Suspend occured after last event
				was_awaken=true
			fi
		fi
	fi
    
    perform_write=false

	# if window title changed, perform write
    if [ "$lasttitle" != "$curtitle" ] || [ $was_awaken = true ]; then
		perform_write=true
	fi

    # number of seconds elapsed since Jan 1, 1970 0:00 UTC
	T="$(date +%s)"
	
	# if more than some time has elapsed, do a write anyway
	#elapsed_seconds=$(( T - last_write ))
	#if [ $elapsed_seconds -ge $MIN_WRITE_TIME ]; then
	#	perform_write=true
	#fi

	# log window switch if appropriate
    if [ "$perform_write" = true ] && [ -n "$curtitle" ]; then 
        # Get rewind time, day starts at 7am and ends at 6:59am next day
        rewind7am=$(python rewind7am.py)
        # One logfile daily
        log_file="logs/window_${rewind7am}.txt"
        # If computer was just awaken, log suspend event unless it happened before 7am
        if [ $was_awaken = true ] && [ $suspended_at -ge $rewind7am ]; then
            echo "$suspended_at __SUSPEND" >> "$log_file"
        fi
        # Log time commandline|windowtitle
        echo "$T $curtitle" >> "$log_file"
        echo "logged window title: $(date) $curtitle into $log_file"
        
		last_write=$T

		# Create symlink to most recent log file everytime it changes its name,
		# so we can use something like "tail -F logs/window_today.txt"
        if [ "$last_log_file" != "$log_file" ]; then
        	ln -s -f "$(basename "$log_file")" "logs/window_today.txt"
    		last_log_file=$log_file
        fi
	fi

	lasttitle="$curtitle"
	sleep "$WAIT_TIME"
done
