#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Python 2 compatibility
from __future__ import print_function
from __future__ import absolute_import

import time
import datetime
import json
import os
import sys
import glob

from os.path import getmtime, isfile, islink, join as pathjoin


def loadEvents(fname):
    """
    Reads a file that consists of first column of unix timestamps
    followed by arbitrary string, one per line. Outputs as dictionary.
    Also keeps track of min and max time seen in global mint,maxt
    """
    events = []

    try:
        with open(fname, 'r') as f:
            ws = f.read().decode('utf-8').splitlines()
        events = []
        for w in ws:
            try:
                ix = w.find(' ')  # find first space, that's where stamp ends
                stamp = int(w[:ix])
                str = w[ix + 1:]
            except Exception as e:
                # Do not fail on malformed rows
                print(e)
            finally:
                events.append({'t': stamp, 's': str})
    except Exception as e:
        print('%s probably does not exist, setting empty events list.' % (fname, ))
        print('error was:')
        print(e)
        events = []
    return events


def mtime(f):
    """
    Return time file was last modified, or 0 if it doesnt exist
    """
    if isfile(f):
        return int(getmtime(f))
    else:
        return 0


def updateEvents():
    """
    Goes down the list of .txt log files and writes all .json
    files that can be used by the frontend
    """
    L = []
    # Get log files and skip symlinks
    L.extend(f for f in glob.glob("logs/keyfreq_*.txt") if not islink(f))
    L.extend(f for f in glob.glob("logs/window_*.txt") if not islink(f))
    L.extend(f for f in glob.glob("logs/notes_*.txt") if not islink(f))

    # extract all times. all log files of form {type}_{stamp}.txt
    ts = []
    for x in L:
        try:
            ts.append(int(x[x.find('_')+1:x.find('.txt')]))
        except Exception as e:
            print(e)
    ts = sorted(set(ts))

    # march from beginning to end, group events for each day and write json
    ROOT = ''
    RENDER_ROOT = pathjoin(ROOT, 'render')
    os.system('mkdir -p ' + RENDER_ROOT)  # make sure output directory exists
    out_list = []
    something_written = False

    for t in ts:
        t0 = t
        t1 = t0 + 60 * 60 * 24  # 24 hrs later
        fout = 'events_%d.json' % (t0, )
        out_list.append({'t0': t0, 't1': t1, 'fname': fout})

        fwrite = pathjoin(RENDER_ROOT, fout)
        e1f = 'logs/window_%d.txt' % (t0, )
        e2f = 'logs/keyfreq_%d.txt' % (t0, )
        e3f = 'logs/notes_%d.txt' % (t0, )
        e4f = 'logs/blog_%d.txt' % (t0, )

        do_write = False
        # Output file already exists?
        if isfile(fwrite):
            tmod = mtime(fwrite)
            # If the log files have not changed there is no need to regen
            if mtime(e1f) > tmod or mtime(e2f) > tmod or mtime(e3f) > tmod or mtime(e4f) > tmod:
                do_write = True  # better update!
                print('a log file has changed, so will update %s' % (fwrite, ))
        else:
            # Output file doesn't exist yet, so write
            do_write = True

        if do_write:
            # okay lets do work
            e1 = loadEvents(e1f)

            e2 = loadEvents(e2f)
            for k in e2:
                k['s'] = int(k['s'])  # int convert

            e3 = ''
            if isfile(e3f):
                with open(e3f, 'r') as f:
                    e3 = f.read()
                    
            e4 = ''
            if isfile(e4f):
                with open(e4f, 'r') as f:
                    e4 = f.read()

            eout = {
                'window_events': e1,
                'keyfreq_events': e2,
                'notes_events': e3,
                'blog': e4}
            with open(fwrite, 'w') as f:
                f.write(json.dumps(eout))
                print('wrote %s' % fwrite)
            
            something_written = True

    if something_written:
        fwrite = os.path.join(RENDER_ROOT, 'export_list.json')
        with open(fwrite, 'w') as f:
            f.write(json.dumps(out_list).encode('utf8'))
            print('wrote %s' % fwrite)

# invoked as script
if __name__ == '__main__':
    updateEvents()
