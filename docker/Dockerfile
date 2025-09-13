# Multi-stage build pour optimiser la taille de l'image
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copier les fichiers de dépendances Node.js
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm ci --only=production

# Stage Python
FROM python:3.11-slim

# Installer Node.js depuis l'image précédente
COPY --from=node-builder /usr/local/bin/node /usr/local/bin/
COPY --from=node-builder /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Définir les variables d'environnement pour Selenium
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

WORKDIR /app

# Copier les fichiers de dépendances Python
COPY requirements.txt ./

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier les dépendances Node.js depuis le stage builder
COPY --from=node-builder /app/node_modules ./node_modules

# Copier tout le code de l'application
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p data logs

# Exposer les ports nécessaires
EXPOSE 3000

# Script d'entrée pour démarrer l'application
CMD ["sh", "-c", "node local-server.js"]