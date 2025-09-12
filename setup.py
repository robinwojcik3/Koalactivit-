#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import platform
from pathlib import Path

def setup_virtual_environment():
    """Créer et configurer l'environnement virtuel Python"""
    print("Configuration de l'environnement virtuel Python...")
    
    venv_path = Path(".venv")
    
    # Créer l'environnement virtuel s'il n'existe pas
    if not venv_path.exists():
        print("Création de l'environnement virtuel...")
        subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
    
    # Déterminer l'exécutable pip selon l'OS
    if platform.system() == "Windows":
        pip_executable = venv_path / "Scripts" / "pip.exe"
        python_executable = venv_path / "Scripts" / "python.exe"
    else:
        pip_executable = venv_path / "bin" / "pip"
        python_executable = venv_path / "bin" / "python"
    
    # Mettre à jour pip
    print("Mise à jour de pip...")
    subprocess.run([str(python_executable), "-m", "pip", "install", "--upgrade", "pip"], check=True)
    
    # Installer les dépendances Python
    print("Installation des dépendances Python...")
    subprocess.run([str(pip_executable), "install", "-r", "requirements.txt"], check=True)
    
    return python_executable

def setup_node_dependencies():
    """Installer les dépendances Node.js"""
    print("\nConfiguration des dépendances Node.js...")
    
    # Vérifier si npm est installé
    try:
        subprocess.run(["npm", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ERREUR: npm n'est pas installé. Veuillez installer Node.js.")
        return False
    
    # Installer les dépendances
    print("Installation des dépendances Node.js...")
    subprocess.run(["npm", "install"], check=True)
    
    return True

def setup_chrome_driver():
    """Configurer Chrome/Chromium driver pour Selenium"""
    print("\nConfiguration du driver Chrome/Chromium...")
    
    if platform.system() == "Windows":
        print("Sur Windows, assurez-vous que Chrome ou Chromium est installé.")
        print("Le driver sera téléchargé automatiquement par webdriver-manager.")
    elif platform.system() == "Linux":
        print("Installation de Chromium et ChromeDriver...")
        try:
            subprocess.run(["sudo", "apt-get", "update"], check=True)
            subprocess.run(["sudo", "apt-get", "install", "-y", "chromium-browser", "chromium-chromedriver"], check=True)
        except subprocess.CalledProcessError:
            print("Installation manuelle requise. Utilisez votre gestionnaire de paquets pour installer chromium.")
    elif platform.system() == "Darwin":  # macOS
        print("Sur macOS, installez Chromium via Homebrew:")
        print("brew install --cask chromium")
        print("brew install chromedriver")

def create_env_file():
    """Créer le fichier .env s'il n'existe pas"""
    env_path = Path(".env")
    
    if not env_path.exists():
        print("\nCréation du fichier .env...")
        example_path = Path(".env.example")
        
        if example_path.exists():
            env_content = example_path.read_text()
        else:
            env_content = """# Configuration de l'application
NODE_ENV=development
PORT=3000

# Clés API (à configurer)
GITHUB_TOKEN=your_github_token_here
GBIF_USERNAME=your_gbif_username
GBIF_PASSWORD=your_gbif_password
GBIF_EMAIL=your_gbif_email

# Configuration Selenium
CHROME_BIN=/usr/bin/chromium
CHROMEDRIVER_PATH=/usr/bin/chromedriver
"""
        
        env_path.write_text(env_content)
        print("Fichier .env créé. Veuillez configurer vos clés API.")

def create_directories():
    """Créer les répertoires nécessaires"""
    directories = ["data", "logs", "downloads", "cache"]
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True)
            print(f"Répertoire créé: {directory}")

def main():
    """Fonction principale de setup"""
    print("=== Configuration complète de l'environnement Koalactivit ===\n")
    
    # Créer les répertoires
    create_directories()
    
    # Configurer Python
    python_executable = setup_virtual_environment()
    
    # Configurer Node.js
    if not setup_node_dependencies():
        print("\nATTENTION: Installation de Node.js requise!")
        print("Téléchargez Node.js depuis: https://nodejs.org/")
        sys.exit(1)
    
    # Configurer Chrome Driver
    setup_chrome_driver()
    
    # Créer le fichier .env
    create_env_file()
    
    print("\n=== Configuration terminée avec succès! ===")
    print("\nPour démarrer l'application:")
    
    if platform.system() == "Windows":
        print("  1. Activez l'environnement virtuel: .venv\\Scripts\\activate")
        print("  2. Lancez l'application: npm run dev")
        print("\nOu utilisez simplement: start.bat")
    else:
        print("  1. Activez l'environnement virtuel: source .venv/bin/activate")
        print("  2. Lancez l'application: npm run dev")
        print("\nOu utilisez simplement: ./start.sh")

if __name__ == "__main__":
    main()