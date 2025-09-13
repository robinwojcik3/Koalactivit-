# Configuration des commandes personnalisées Claude Code

Ce guide explique comment créer des slash‑commands personnalisées pour Claude Code dans ce projet.

## Structure

- Dossier projet pour les commandes: `.claude/commands/`
- Un fichier Markdown (`*.md`) par commande
- Le contenu du fichier est le prompt exécuté quand la commande est appelée

## Portée des commandes

| Type | Emplacement | Utilisateurs | Préfixe dans `/help` |
|------|-------------|--------------|----------------------|
| Projet | `./.claude/commands/` | Tous les membres du repo | Affiche `(project)` |
| Personnel | `~/.claude/commands/` | Toi uniquement | Affiche `(user)` |

## Syntaxe d’un fichier de commande

Chaque fichier `.md` peut contenir:

- Frontmatter YAML (optionnel) en tête pour définir:
  - `description`: courte description
  - `argument-hint`: aide sur les arguments (ex: `[arg1] [arg2]`)
  - `allowed-tools`: liste d’outils/commandes autorisés (ex: `Bash(git diff:*)`)
  - `model`: (optionnel) modèle à forcer pour cette commande
- Corps du prompt: texte envoyé à Claude lors de l’exécution; peut inclure:
  - `$ARGUMENTS` pour tous les arguments
  - `$1`, `$2`, … pour les arguments positionnels
  - Références de fichiers avec `@chemin/vers/fichier`
- Pré‑commandes shell (optionnel): lignes commençant par `!` si l’outil est listé dans `allowed-tools`

## Exemple de commande

Créer le fichier `.claude/commands/review-pr.md`:

```markdown
---
description: "Analyse un PR pour performance, sécurité et style"
argument-hint: "[pr-number] [priority] [assignee]"
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
---

Review pull request #$1 with priority $2, assign to $3.

!git status --porcelain
!git diff --name-only origin/main...HEAD

Compare changes with @src/
Check for performance issues.
Check for security vulnerabilities.
Suggest style improvements.
```

Exécution dans Claude Code:

```text
/review-pr 123 high alice
```

## Étapes pour ajouter une commande

1) Créer le dossier s’il n’existe pas:

```bash
mkdir -p .claude/commands
```

2) Ajouter un fichier Markdown (ex: `ma-commande.md`) dans `.claude/commands/`

3) Remplir le frontmatter + prompt + placeholders nécessaires

4) Commit & push pour partager avec l’équipe

