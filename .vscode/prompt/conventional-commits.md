# Conventional Commit Messages

Generate commit messages following the Conventional Commits specification.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Rules

### Subject Line

- Use imperative mood: "add feature" not "added feature"
- Keep under 50 characters
- Lowercase, no period at the end
- Be specific: "fix login redirect loop" not "fix bug"

### Types

| Type       | Description                               |
| ---------- | ----------------------------------------- |
| `feat`     | New feature or capability                 |
| `fix`      | Bug fix                                   |
| `docs`     | Documentation changes only                |
| `style`    | Code style (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes nor adds   |
| `perf`     | Performance improvement                   |
| `test`     | Adding or correcting tests                |
| `chore`    | Build, config, dependencies               |
| `ci`       | CI/CD configuration                       |

### Scope

Use package/app names from this monorepo:

- `core`, `design`, `flow`, `schema`, `plugin`, `example`
- `admin` (app or service)

### Body (optional)

- Wrap at 72 characters
- Explain _what_ and _why_, not _how_
- Use bullet points for multiple changes

### Breaking Changes

- Add `!` after type/scope: `feat(core)!: remove deprecated API`
- Or use footer: `BREAKING CHANGE: <description>`

### Co-authorship

Always end every commit message with a blank line followed by:

```
Co-authored-by: github-copilot <noreply@github.com>
```

## Examples

```
feat(schema): add layout validation rules

Co-authored-by: github-copilot <noreply@github.com>
```

```
fix(design): resolve viewport resize flicker

* debounce resize handler
* cache computed dimensions

Co-authored-by: github-copilot <noreply@github.com>
```

```
refactor(core)!: rename Entity to BaseEntity

BREAKING CHANGE: all imports must be updated

Co-authored-by: github-copilot <noreply@github.com>
```
