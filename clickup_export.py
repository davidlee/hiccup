#!/usr/bin/env python3
"""
ClickUp task hierarchy exporter.
Usage: ./clickup-export.py <clickup-url>
"""

import os
import sys
import json
import re
from urllib.parse import urlparse, parse_qs
import requests


def parse_clickup_url(url):
  """Extract list_id and optional task_id from ClickUp URL."""
  parsed = urlparse(url)

  # Extract list ID from path (e.g., /69/v/l/25-119616)
  list_match = re.search(r'/l/([^/?]+)', parsed.path)
  list_id = list_match.group(1) if list_match else None

  # Check for task ID in query params (pr parameter)
  query_params = parse_qs(parsed.query)
  task_id = query_params.get('pr', [None])[0]

  return {
    'list_id': list_id,
    'task_id': task_id
  }


def fetch_tasks(list_id, api_token, params=None):
  """Fetch tasks from a list."""
  url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
  headers = {"Authorization": api_token}

  response = requests.get(url, headers=headers, params=params or {})

  if not response.ok:
    print(f"API Error Response: {response.text}", file=sys.stderr)

  response.raise_for_status()
  return response.json()


def fetch_task_details(task_id, api_token):
  """Fetch detailed information for a specific task."""
  url = f"https://api.clickup.com/api/v2/task/{task_id}"
  headers = {"Authorization": api_token}

  response = requests.get(url, headers=headers)

  if not response.ok:
    print(f"API Error Response: {response.text}", file=sys.stderr)

  response.raise_for_status()
  return response.json()


def build_task_tree(task, api_token, task_details_map):
  """Recursively build tree structure with subtasks."""
  tree_node = {
    'id': task['id'],
    'title': task['name'],
    'status': task.get('status', {}).get('status', 'unknown')
  }

  # Store full details
  task_details_map[task['id']] = task

  # Fetch and include subtasks if they exist
  if task.get('subtasks') or task.get('has_subtasks'):
    tree_node['subtasks'] = []

    # Fetch detailed task info to get subtasks
    detailed_task = fetch_task_details(task['id'], api_token)

    if detailed_task.get('subtasks'):
      for subtask_id in detailed_task['subtasks']:
        subtask = fetch_task_details(subtask_id, api_token)
        subtask_tree = build_task_tree(subtask, api_token, task_details_map)
        tree_node['subtasks'].append(subtask_tree)

  return tree_node


def export_clickup_data(url, api_token):
  """Main export function."""
  parsed = parse_clickup_url(url)

  # If we have a specific task ID, start from that task
  if parsed['task_id']:
    print(f"Fetching task: {parsed['task_id']}", file=sys.stderr)
    task = fetch_task_details(parsed['task_id'], api_token)

    task_details_map = {}
    tree_node = build_task_tree(task, api_token, task_details_map)

    return {
      'tree': [tree_node],
      'details': task_details_map
    }

  # Otherwise fetch from list
  if not parsed['list_id']:
    raise ValueError("Could not extract list ID or task ID from URL")

  print(f"Fetching tasks from list: {parsed['list_id']}", file=sys.stderr)

  # Fetch all tasks from the list
  params = {
    'archived': 'false',
    'include_closed': 'true',
    'subtasks': 'true'
  }

  response = fetch_tasks(parsed['list_id'], api_token, params)
  tasks = response.get('tasks', [])

  print(f"Found {len(tasks)} tasks", file=sys.stderr)

  # Build tree structure and collect details
  task_details_map = {}
  tree = []

  for task in tasks:
    # Only include top-level tasks (not subtasks) in the tree
    if not task.get('parent'):
      tree_node = build_task_tree(task, api_token, task_details_map)
      tree.append(tree_node)

  return {
    'tree': tree,
    'details': task_details_map
  }


def main():
  if len(sys.argv) < 2:
    print("Usage: clickup-export.py <clickup-url> [output-dir]", file=sys.stderr)
    sys.exit(1)

  url = sys.argv[1]
  output_dir = sys.argv[2] if len(sys.argv) > 2 else 'clickup-export'
  api_token = os.getenv('CLICKUP_API_TOKEN')

  if not api_token:
    print("Error: CLICKUP_API_TOKEN environment variable not set", file=sys.stderr)
    sys.exit(1)

  try:
    data = export_clickup_data(url, api_token)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Write tree structure
    tree_path = os.path.join(output_dir, 'tree.json')
    with open(tree_path, 'w') as f:
      json.dump(data['tree'], f, indent=2)
    print(f"Tree written to: {tree_path}", file=sys.stderr)

    # Write individual task details
    tasks_dir = os.path.join(output_dir, 'tasks')
    os.makedirs(tasks_dir, exist_ok=True)

    for task_id, task_data in data['details'].items():
      task_path = os.path.join(tasks_dir, f"{task_id}.json")
      with open(task_path, 'w') as f:
        json.dump(task_data, f, indent=2)

    print(f"Wrote {len(data['details'])} task detail files to: {tasks_dir}", file=sys.stderr)
    print(f"\nExport complete: {output_dir}/", file=sys.stderr)

  except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)


if __name__ == '__main__':
  main()
