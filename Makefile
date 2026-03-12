.PHONY: install build dev run

# Install all dependencies (Python + Node)
install:
	pip install -r requirements.txt
	cd frontend && npm install

# Build React and output to app/static/react/
build:
	cd frontend && npm run build

# Run Flask dev server (after `make build` or using Vite proxy separately)
run:
	python run.py

# Run Vite dev server (proxies /api to Flask on port 5000)
dev-frontend:
	cd frontend && npm run dev

# Full development setup: start Flask + Vite in parallel
dev:
	make run & make dev-frontend