# =============================================================================
#  StandSet prototype — déploiement Docker + nginx + certbot
#  Domaine : badgemaker.agefop.selys.app  ·  conteneur : 127.0.0.1:9020  ·  public : 443
#
#  Premier déploiement (sur le VPS, dans ce dossier) :
#     make deploy        # build + démarrage du conteneur
#     make nginx-init    # vhost HTTP provisoire (nécessaire pour certbot)
#     make ssl EMAIL=vous@domaine.com   # certificat + vhost HTTPS définitif
#  Mises à jour suivantes :
#     make deploy
# =============================================================================

DOMAIN        ?= badgemaker.agefop.selys.app
APP_PORT      ?= 9020
EMAIL         ?= admin@selys.app
SERVICE       ?= standset
IMAGE         ?= standset-prototype:latest

COMPOSE       ?= docker compose
NGINX_AVAIL   ?= /etc/nginx/sites-available
NGINX_ENABLED ?= /etc/nginx/sites-enabled
CERTBOT_ROOT  ?= /var/www/certbot
NGINX_SRC     := deploy/nginx

# sudo uniquement si l'on n'est pas root
SUDO := $(shell [ "$$(id -u)" -eq 0 ] && echo "" || echo sudo)

export APP_PORT

.DEFAULT_GOAL := help
.PHONY: help build up deploy nginx-init ssl down clean logs status

help: ## Affiche cette aide
	@echo "StandSet — commandes de déploiement ($(DOMAIN))"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36mmake %-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables : DOMAIN=$(DOMAIN)  APP_PORT=$(APP_PORT)  EMAIL=$(EMAIL)"

build: ## Construit l'image Docker (build Vite + nginx)
	$(COMPOSE) build --pull $(SERVICE)

up: ## Démarre (ou recrée) le conteneur sur 127.0.0.1:9020
	$(COMPOSE) up -d --remove-orphans $(SERVICE)
	@$(MAKE) --no-print-directory status

deploy: ## Met à jour le code (git pull), reconstruit l'image et redémarre le conteneur
	@if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
		echo ">> git pull"; git pull --ff-only; \
	else echo ">> pas de dépôt git : déploiement des fichiers présents"; fi
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory up
	docker image prune -f >/dev/null
	@echo ">> déployé : https://$(DOMAIN)"

nginx-init: ## Installe le vhost HTTP provisoire (proxy + challenge ACME) et recharge nginx
	$(SUDO) mkdir -p $(CERTBOT_ROOT)
	$(SUDO) cp $(NGINX_SRC)/$(DOMAIN).http.conf $(NGINX_AVAIL)/$(DOMAIN).conf
	$(SUDO) ln -sf $(NGINX_AVAIL)/$(DOMAIN).conf $(NGINX_ENABLED)/$(DOMAIN).conf
	$(SUDO) nginx -t
	$(SUDO) systemctl reload nginx
	@echo ">> vhost HTTP actif : http://$(DOMAIN) — lancez ensuite 'make ssl EMAIL=...'"

ssl: ## Obtient le certificat Let's Encrypt (webroot) et active le vhost HTTPS
	@test -f $(NGINX_ENABLED)/$(DOMAIN).conf || (echo "!! Lancez d'abord 'make nginx-init'" && exit 1)
	$(SUDO) certbot certonly --webroot -w $(CERTBOT_ROOT) \
		-d $(DOMAIN) --email $(EMAIL) --agree-tos --non-interactive --keep-until-expiring \
		--deploy-hook "systemctl reload nginx"
	$(SUDO) cp $(NGINX_SRC)/$(DOMAIN).conf $(NGINX_AVAIL)/$(DOMAIN).conf
	$(SUDO) nginx -t
	$(SUDO) systemctl reload nginx
	$(SUDO) certbot renew --dry-run --cert-name $(DOMAIN)
	@echo ">> HTTPS actif : https://$(DOMAIN) (renouvellement automatique via le timer certbot)"

down: ## Arrête et supprime le conteneur (le vhost nginx reste en place)
	$(COMPOSE) down

clean: ## down + suppression de l'image et du cache de build Docker
	$(COMPOSE) down --rmi local --remove-orphans
	-docker rmi $(IMAGE) 2>/dev/null
	docker builder prune -f

logs: ## Suit les logs du conteneur
	$(COMPOSE) logs -f --tail=100 $(SERVICE)

status: ## État du conteneur et test de santé local
	@$(COMPOSE) ps $(SERVICE)
	@sleep 2; curl -fsS http://127.0.0.1:$(APP_PORT)/healthz >/dev/null \
		&& echo ">> conteneur OK sur 127.0.0.1:$(APP_PORT)" \
		|| echo "!! le conteneur ne répond pas encore sur 127.0.0.1:$(APP_PORT) (voir 'make logs')"
