# Git File Removal Guide

## Scenarios for Removing Files in Git

### 1. Remove a File from Git Repository and Local Filesystem
```bash
# Remove file from Git tracking and delete from filesystem
git rm <filename>

# Example
git rm README.txt
```
- This command removes the file from Git version control
- The file is also deleted from your local filesystem
- Changes are staged and ready to be committed

### 2. Remove a File from Git Repository (Keep in Local Filesystem)
```bash
# Remove file from Git tracking but keep in local filesystem
git rm --cached <filename>

# Example
git rm --cached sensitive-config.json
```
- The file is removed from Git tracking
- The file remains in your local filesystem
- Useful for files you don't want to track anymore but want to keep locally

### 3. Remove Multiple Files at Once
```bash
# Remove multiple specific files
git rm <file1> <file2> <file3>

# Remove files using a pattern
git rm *.log
git rm docs/*.txt
```
- You can specify multiple files or use wildcard patterns
- Removes files from both Git tracking and local filesystem

### 4. Remove Files Using Pattern Matching
```bash
# Remove all .log files in the project
git rm **/*.log

# Remove all temporary files
git rm **/*~
```
- Use double asterisk (**) for recursive pattern matching
- Matches files in all subdirectories
- Useful for removing multiple files across the entire project

### Important Notes
- Always commit your changes after using `git rm`
- Use `git rm --cached` if you want to stop tracking a file without deleting it
- Be careful with pattern matching to avoid accidentally removing important files

### Recovering Removed Files
```bash
# If file was just removed and not committed
git checkout -- <filename>

# If file was already committed
git checkout <commit-hash> -- <filename>
```
- Checkout can help recover recently removed files
- Specify the commit hash to retrieve a file from a previous state

### Best Practices
1. Review files before removal
2. Use `--cached` for sensitive or configuration files
3. Commit removals promptly
4. Use `.gitignore` to prevent tracking unwanted files