# Directives de développement

## Environnement autonome

Tous les composants nécessaires au fonctionnement de l'application DOIVENT être inclus dans le dépôt. Aucune dépendance externe n'est autorisée en dehors de ce qui est strictement nécessaire.

## Règles strictes

1. **Aucune dépendance système**
   - Tous les binaires, bibliothèques et dépendances doivent être inclus dans le dépôt
   - Utiliser des chemins relatifs pour toutes les références de fichiers
   - Ne pas compter sur des installations système ou des variables d'environnement

2. **Portabilité**
   - L'application doit fonctionner immédiatement après clonage, sans configuration supplémentaire
   - Inclure toutes les dépendances Python nécessaires dans un environnement virtuel
   - Inclure les binaires nécessaires pour Node.js et Python

3. **Ressources externes**
   - Télécharger et inclure localement toutes les ressources externes (bibliothèques JS/CSS, polices, etc.)
   - Ne pas compter sur des CDNs ou des services externes

4. **Configuration**
   - Tous les paramètres doivent avoir des valeurs par défaut fonctionnelles
   - Les fichiers de configuration doivent être inclus dans le dépôt avec des exemples

5. **Documentation**
   - Documenter clairement la structure du projet
   - Inclure un guide de démarrage rapide
   - Lister toutes les dépendances et leurs versions

## Structure du projet

```
project/
├── .env.example         # Exemple de configuration
├── README.md            # Documentation principale
├── agent.md             # Ce fichier - directives de développement
├── package.json         # Dépendances Node.js
├── requirements.txt     # Dépendances Python
├── local-server.js      # Serveur de développement
├── site/                # Code frontend
├── FloreApp/           # Scripts Python
└── vendor/             # Dépendances tierces (si nécessaire)
```

## Mise à jour du projet

1. Mettre à jour ce fichier pour refléter les nouvelles exigences
2. Mettre à jour le README.md en conséquence
3. Vérifier que toutes les dépendances sont correctement versionnées
4. Tester l'installation à partir de zéro dans un environnement propre
