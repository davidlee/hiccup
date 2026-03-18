# ClickUp Export Tool

Exports ClickUp task hierarchies to JSON files.

## Setup

Install dependencies:

```bash
pip3 install -r requirements-clickup.txt
```

Or manually:

```bash
pip3 install requests
```

Ensure `CLICKUP_API_TOKEN` is set in your environment.

## Usage

```bash
./clickup-export.py <clickup-url> [output-dir]
```

Example:

```bash
./clickup-export.py "https://app.clickup.com/69/v/l/25-119616?pr=90165360436" my-export
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
