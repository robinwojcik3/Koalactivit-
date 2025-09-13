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
