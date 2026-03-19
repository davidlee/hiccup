# hiccup

Export ClickUp task hierarchies to JSON.

## Usage

```bash
export CLICKUP_API_TOKEN="your-token"
npx github:davidlee/hiccup <input> [output-dir]
```

`<input>` can be any of:

- A ClickUp view URL — exports all lists in the space
- A task detail URL (e.g. `https://app.clickup.com/t/69/STUFF-86`) — exports the task's list
- A custom task ID (`STUFF-86`) — resolves and exports the task's list
- A raw API list ID

## Output

```
output-dir/
  tree.json              # nested task hierarchy
  tasks/{task-id}.json   # full details per task
```

Default output directory: `clickup-export/`

## Notes

- Handles pagination automatically (lists with >100 tasks)
- Permission errors on individual resources are logged and skipped, not fatal
- Tree is assembled client-side from the flat task list — no redundant API calls
