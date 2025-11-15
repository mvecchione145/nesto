import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048
workers = os.getenv("WORKERS", 2)
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 300
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
disable_redirect_access_to_syslog = True
capture_output = True
proc_name = "nesto_backend"
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_unload_dir = None
keyfile = None
certfile = None
