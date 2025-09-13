# Configuration des commandes personnalisÃ©es Claude Code

Ce guide explique comment crÃ©er des slashâ€‘commands personnalisÃ©es pour Claude Code dans ce projet.

## Structure

- Dossier projet pour les commandes: `.claude/commands/`
- Un fichier Markdown (`*.md`) par commande
- Le contenu du fichier est le prompt exÃ©cutÃ© quand la commande est appelÃ©e

## PortÃ©e des commandes

| Type | Emplacement | Utilisateurs | PrÃ©fixe dans `/help` |
|------|-------------|--------------|----------------------|
| Projet | `./.claude/commands/` | Tous les membres du repo | Affiche `(project)` |
| Personnel | `~/.claude/commands/` | Toi uniquement | Affiche `(user)` |

## Syntaxe dâ€™un fichier de commande

Chaque fichier `.md` peut contenir:

- Frontmatter YAML (optionnel) en tÃªte pour dÃ©finir:
  - `description`: courte description
  - `argument-hint`: aide sur les arguments (ex: `[arg1] [arg2]`)
  - `allowed-tools`: liste dâ€™outils/commandes autorisÃ©s (ex: `Bash(git diff:*)`)
  - `model`: (optionnel) modÃ¨le Ã  forcer pour cette commande
- Corps du prompt: texte envoyÃ© Ã  Claude lors de lâ€™exÃ©cution; peut inclure:
  - `$ARGUMENTS` pour tous les arguments
  - `$1`, `$2`, â€¦ pour les arguments positionnels
  - RÃ©fÃ©rences de fichiers avec `@chemin/vers/fichier`
- PrÃ©â€‘commandes shell (optionnel): lignes commenÃ§ant par `!` si lâ€™outil est listÃ© dans `allowed-tools`

## Exemple de commande

CrÃ©er le fichier `.claude/commands/review-pr.md`:

```markdown
---
description: "Analyse un PR pour performance, sÃ©curitÃ© et style"
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

ExÃ©cution dans Claude Code:

```text
/review-pr 123 high alice
```

## Ã‰tapes pour ajouter une commande

1) CrÃ©er le dossier sâ€™il nâ€™existe pas:

```bash
mkdir -p .claude/commands
```

2) Ajouter un fichier Markdown (ex: `ma-commande.md`) dans `.claude/commands/`

3) Remplir le frontmatter + prompt + placeholders nÃ©cessaires

4) Commit & push pour partager avec lâ€™Ã©quipe



Commandes disponibles:
- /review-pr — analyse un PR
- /prompt-plus — améliore un prompt avec le contexte du repo
