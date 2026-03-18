# ClickUp Export Tool

Exports ClickUp task hierarchies to JSON files.

## Quick Start with uvx

No installation needed - run directly from GitHub:

```bash
export CLICKUP_API_TOKEN="your-token"
uvx --from git+https://github.com/yourusername/yourrepo clickup-export <clickup-url> [output-dir]
```

Example:

```bash
uvx --from git+https://github.com/yourusername/yourrepo clickup-export \
  "https://app.clickup.com/69/v/l/25-119616?pr=90165360436" my-export
```

Or from a local clone:

```bash
uvx --from . clickup-export <clickup-url> [output-dir]
```

## Local Installation

With uv:

```bash
uv pip install -e .
clickup-export <clickup-url> [output-dir]
```

Traditional:

```bash
pip3 install -e .
clickup-export <clickup-url> [output-dir]
```

## Usage

Ensure `CLICKUP_API_TOKEN` is set in your environment.

```bash
clickup-export <clickup-url> [output-dir]
```

## Output

The script creates:

- `{output-dir}/tree.json` - Hierarchical tree of tasks with IDs, titles, and subtasks
- `{output-dir}/tasks/{task-id}.json` - Full details for each task

Default output directory: `clickup-export/`

## URL Format

Supports list view URLs like:
- `https://app.clickup.com/{team}/v/l/{list-id}`
- Query parameter `pr={task-id}` is parsed but currently fetches entire list
