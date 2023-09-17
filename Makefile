
up: 
	docker-compose up -d
down:
	docker-compose down
build:
	docker-compose up --build
build-nc:
	docker-compose rm -f && docker-compose up --build
restart:
	docker-compose down && docker-compose up -d
ps:
	docker-compose ps
logs:
	docker-compose logs -f

remove-volumes:
	docker-compose down -v


db-shell:
	docker-compose exec mongo mongosh 
	
web-shell:
	docker-compose exec -it web sh
