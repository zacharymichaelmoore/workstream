export const BUILT_IN_TYPES = ['feature', 'bug-fix', 'ui-fix', 'refactor', 'test', 'design', 'chore', 'doc-search'];

export const ALL_TOOLS = ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'];

export const ALL_CONTEXT_SOURCES = [
  'claude_md', 'opencode_md', 'task_description', 'task_images',
  'skills', 'architecture_md', 'review_criteria', 'followup_notes', 'git_diff', 'rag', 'gate_feedback',
];

export const CLAUDE_MODEL_OPTIONS = ['opus', 'sonnet'];

export const OPENCODE_MODEL_OPTIONS = [
  'google/gemini-3.1-pro-preview',
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3-pro-preview',
  'google/gemini-2.5-pro',
  'google/gemma-4-31b'
];

export const ON_MAX_RETRIES_OPTIONS = ['pause', 'fail', 'skip'];
