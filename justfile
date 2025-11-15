compose-down:
	@docker compose down

compose-up:
	@docker compose up --build -d

recompose: compose-down compose-up

