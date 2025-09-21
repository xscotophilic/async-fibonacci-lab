.PHONY: install run

install:
	@echo "Installing dependencies..."
	@$(MAKE) -j 3 install-server install-client install-worker

install-server:
	cd server && npm install

install-client:
	cd client && npm install

install-worker:
	cd worker && npm install

run:
	@echo "Starting all services..."
	@$(MAKE) -j 3 run-server run-client run-worker

run-server:
	cd server && npm run dev

run-client:
	cd client && npm run dev

run-worker:
	cd worker && npm run dev
