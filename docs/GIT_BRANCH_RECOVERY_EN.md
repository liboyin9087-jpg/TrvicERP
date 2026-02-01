# Git Branch Recovery Guide (English)

## Problem: I Accidentally Deleted a Branch!

If you accidentally deleted a Git branch, don't panic! Git provides a powerful reflog feature that can help you recover deleted branches.

## Quick Recovery Steps

### Method 1: Use the Recovery Script (Recommended)

We provide a convenient script to help you recover branches:

```bash
# Run the recovery script
bash scripts/recover-branch.sh
```

The script will automatically show recently deleted branches and guide you through the recovery process.

### Method 2: Manual Git Commands

#### Step 1: View the reflog

```bash
git reflog
```

This displays all recent Git operations history. Find the last commit before the branch was deleted.

#### Step 2: Find the last commit of the deleted branch

In the reflog output, look for records similar to:

```
abc1234 HEAD@{1}: checkout: moving from deleted-branch to main
def5678 HEAD@{2}: commit: Last commit on deleted branch
```

Here `def5678` is the hash of the last commit on the deleted branch.

#### Step 3: Recover the branch

Use the found commit hash to recreate the branch:

```bash
git branch <branch-name> <commit-hash>
```

For example:

```bash
git branch recovered-branch def5678
```

#### Step 4: Switch to the recovered branch

```bash
git checkout recovered-branch
```

## Common Scenarios

### Scenario 1: Recently deleted branch

If you just deleted the branch (within minutes or hours):

```bash
# View recent branch operations
git reflog --date=relative

# Find the deletion operation, usually shown as "Branch: deleting refs/heads/branch-name"
# Recover to the state before deletion
git branch <branch-name> HEAD@{n}
```

### Scenario 2: Know the branch name but not the commit hash

```bash
# Search for records containing specific branch name
git reflog | grep "branch-name"

# Use the found reference to recover
git branch <branch-name> <reference>
```

### Scenario 3: Search by commit message

```bash
# Find all reachable commits
git fsck --lost-found

# View details of dangling commits
git log --all --oneline | grep "keyword"

# Recover the branch
git branch <branch-name> <commit-hash>
```

## Prevention Measures

To prevent future accidental branch deletions, consider these measures:

### 1. Use Git Alias for safe deletion

Add to `.gitconfig`:

```bash
[alias]
    delete-branch = "!f() { \
        echo \"Are you sure you want to delete branch $1? (y/n)\"; \
        read ans; \
        if [ \"$ans\" = \"y\" ]; then \
            git branch -d $1; \
        else \
            echo \"Branch deletion cancelled.\"; \
        fi; \
    }; f"
```

Usage:

```bash
git delete-branch <branch-name>
```

### 2. Regularly backup important branches

```bash
# Create backup tag
git tag backup/<branch-name> <branch-name>

# Push tag to remote
git push origin backup/<branch-name>
```

### 3. Use protected branches

On platforms like GitHub/GitLab, set important branches as protected to prevent accidental deletion.

### 4. Push to remote before deleting

```bash
# Push branch to remote
git push origin <branch-name>

# Even if deleted locally, can recover from remote
git fetch origin
git checkout -b <branch-name> origin/<branch-name>
```

## Advanced Tips

### View reflog for specific time range

```bash
# View reflog from last 7 days
git reflog --since="7 days ago"

# View reflog after specific date
git reflog --since="2024-01-01"
```

### Recover multiple branches

If multiple branches were deleted simultaneously, use a script for batch recovery:

```bash
# List all dangling commits
git fsck --unreachable --no-reflogs | grep commit

# Create temporary branch for each commit to check
git branch temp-<number> <commit-hash>
```

## Important Reminders

⚠️ **Note:**

1. **Time sensitivity**: reflog is usually retained for 90 days, records beyond this may not be recoverable
2. **Garbage collection**: After running `git gc`, some unreferenced commits may be cleaned up
3. **Local operation**: reflog is a local record, not synced to remote
4. **Timely recovery**: Recover as soon as possible after discovering the deletion to avoid records being overwritten

## Command Reference

| Command | Description |
|---------|-------------|
| `git reflog` | Show reference log |
| `git reflog show <branch>` | Show reflog for specific branch |
| `git fsck --lost-found` | Find all dangling objects |
| `git branch <name> <commit>` | Create new branch from commit |
| `git log --all --oneline` | View all commit history |

## Need Help?

If none of the above methods work, please:

1. Check if team members have the branch in their local repositories
2. Check if CI/CD systems have backups of the branch
3. Contact your team lead or Git administrator for assistance

## References

- [Git Official Documentation - git-reflog](https://git-scm.com/docs/git-reflog)
- [Git Official Documentation - git-fsck](https://git-scm.com/docs/git-fsck)
- [Atlassian Git Tutorial - Undoing Changes](https://www.atlassian.com/git/tutorials/undoing-changes)
