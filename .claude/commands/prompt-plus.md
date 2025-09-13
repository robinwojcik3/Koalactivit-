---
description: "Améliore un prompt en injectant le contexte de la codebase de ce dépôt"
argument-hint: "[prompt-initial]"
allowed-tools:
  - Bash(git ls-files:*)
  - Bash(head:*)
  - Bash(wc -l:*)
---

# Rôle
Tu es un ingénieur prompt + code embedded dans ce repo. Ta mission: transformer la demande suivante en un prompt clair, actionnable, et contextualisé à cette codebase.

# Demande initiale
```
$ARGUMENTS
```

# Contexte du dépôt
- Racine du repo: utiliser la liste des fichiers ci-dessous pour inférer les composants importants.
- Si pertinent, t’appuyer sur les fichiers référencés ensuite.

!git ls-files | wc -l
!git ls-files | head -n 300

@README.md
@package.json
@netlify.toml
@docker/docker-compose.yml
@docker/Dockerfile
@local-server.js

# Attentes de sortie
Produis, dans l’ordre, les sections suivantes (brefs, précis, orientés action):

1) Objectif reformulé
- Résume la demande en 1–2 phrases ciblées.

2) Portée et contraintes (codebase)
- Ce qui est in-scope/out-of-scope par rapport au repo.
- Hypothèses et limites techniques détectées (tooling, Docker, Netlify, Python/Node, etc.).

3) Contexte utile extrait du repo
- Points clés (dossiers, fichiers, scripts, endpoints, configs) impactant la demande.

4) Plan d’action
- 4–8 étapes concrètes et ordonnées.

5) Points ouverts / risques
- 3–5 éléments à clarifier ou surveiller.

6) Prompt amélioré (final)
- Fournis un prompt prêt à copier-coller qui:
  - précise le rôle de l’agent (dev, ops, data, etc.)
  - inclut les chemins/fichiers pertinents (liste courte)
  - liste objectifs, contraintes, livrables attendus et critères d’acceptation
  - propose, si utile, un format d’output (fichiers à créer/modifier, commandes à exécuter)
  - reste spécifique à ce repo (éviter le générique inutile)
