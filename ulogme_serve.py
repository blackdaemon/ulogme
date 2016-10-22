# vim:set ff=unix tabstop=4 shiftwidth=4 expandtab:

# Python 2 compatibility
from __future__ import print_function
from __future__ import absolute_import
    
import six.moves.socketserver
import six.moves.SimpleHTTPServer
import sys
import cgi
import os
import logging

from export_events import updateEvents
from rewind7am import rewindTime

# Port settings
IP = "127.0.0.1"
if len(sys.argv) > 1:
    PORT = int(sys.argv[1])
else:
    PORT = 8124

# serve render/ folder, not current folder
rootdir = os.getcwd()
os.chdir('render')

                    
def get_status_output(cmd):
    """Return (status, output) of executing cmd in a shell."""
    pipe = os.popen('{ ' + cmd + '; } 2>&1', 'r')
    text = pipe.read()
    sts = pipe.close()
    if sts is None: 
        sts = 0
    if text and text[-1:] == '\n': 
        text = text[:-1]
    return sts, text

    
# Custom handler
class CustomHandler(six.moves.SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        # default behavior
        try:
            six.moves.SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self) 
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(e)
            
    def do_POST(self):
        form = cgi.FieldStorage(
            fp = self.rfile,
            headers = self.headers,
            environ = {'REQUEST_METHOD':'POST', 'CONTENT_TYPE':self.headers['Content-Type']}
        )
        result = 'NOT_UNDERSTOOD'

        if self.path == '/refresh':
            try:
                # recompute jsons. We have to pop out to root from render directory
                # temporarily. It's a little ugly
                refresh_time = form.getvalue('time')
                os.chdir(rootdir) # pop out
                updateEvents() # defined in export_events.py
            except Exception as e:
                # TODO: Should we make the errors visible?
                logging.error(e)
            finally:
                os.chdir('render') # go back to render
                result = 'OK'
      
        if self.path == '/addnote':
            try:
                # add note at specified time and refresh
                note = form.getvalue('note')
                note_time = form.getvalue('time')
                os.chdir(rootdir) # pop out
                cmd_status, cmd_stdout = get_status_output('echo %s | ./note.sh %s' % (note, note_time))
                updateEvents() # defined in export_events.py
            except Exception as e:
                # TODO: Should we make the errors visible?
                logging.error(e)
            finally:
                os.chdir('render') # go back to render
                result = 'OK'

        if self.path == '/blog':
            try:
                # add note at specified time and refresh
                post = form.getvalue('post')
                if post is None:
                    post = ''
                post_time = int(form.getvalue('time'))
                os.chdir(rootdir) # pop out
                trev = rewindTime(post_time)
                with open('logs/blog_%d.txt' % (post_time, ), 'w') as bf:
                    bf.write(post)
                updateEvents() # defined in export_events.py
            except Exception as e:
                # TODO: Should we make the errors visible?
                logging.error(e)
            finally:
                os.chdir('render') # go back to render
                result = 'OK'
    
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()
        self.wfile.write(result)


six.moves.socketserver.ThreadingTCPServer.allow_reuse_address = True
httpd = None

logging.info("Serving ulogme, see it on http://localhost:%d" % PORT)
try:
    httpd = six.moves.socketserver.ThreadingTCPServer((IP, PORT), CustomHandler)
    httpd.serve_forever()
except Exception as e:
    logging.error(e)
    raise
finally:
    if httpd:
        try:
            logging.info("Closing the HTTP server.")
            httpd.server_close()
        except Exception as e:
            logging.error(e)
            raise
