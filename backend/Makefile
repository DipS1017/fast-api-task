# Backend dev shortcuts. From a clean checkout, `make dev` is all you need:
# it creates the venv, installs deps, runs migrations, then starts the API.

VENV := .venv
PYTHON := $(VENV)/bin/python
PORT ?= 8000

.DEFAULT_GOAL := help
.PHONY: help dev test migrate install clean

help:
	@echo "Backend commands:"
	@echo "  make dev      install deps, run migrations, start the API (--reload)"
	@echo "  make test     run the test suite"
	@echo "  make migrate  apply database migrations"
	@echo "  make install  create the venv and install dependencies"
	@echo "  make clean    remove the venv and local db / cache files"

# only reinstall when requirements.txt changes
$(VENV)/.installed: requirements.txt
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install --upgrade pip
	$(VENV)/bin/pip install -r requirements.txt
	@touch $(VENV)/.installed

install: $(VENV)/.installed

migrate: install
	$(VENV)/bin/alembic upgrade head

dev: migrate
	$(VENV)/bin/uvicorn app.main:app --reload --port $(PORT)

test: install
	$(PYTHON) -m pytest

clean:
	rm -rf $(VENV) app.db test.db .pytest_cache
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
