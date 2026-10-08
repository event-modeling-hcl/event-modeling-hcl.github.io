HOST ?= 127.0.0.1
PORT ?= 8000

.PHONY: serve
serve:
	python3 scripts/serve-site.py --host "$(HOST)" --port "$(PORT)"
