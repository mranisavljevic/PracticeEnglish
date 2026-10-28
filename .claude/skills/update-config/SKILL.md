---
name: update-config
description: Configure the Claude Code harness via settings.json. Use for hooks ("from now on when X", "whenever X"), permissions ("allow X"), env vars ("set X=Y"), and edits to settings.json or settings.local.json. For simple settings like theme or model, suggest /config instead.
model: haiku
user-invocable: true
---

Make the requested settings change directly. Do not spawn subagents.

1. Pick the file: `~/.claude-personal/settings.json` for user-wide, `.claude/settings.json` for this project (shared), `.claude/settings.local.json` for this project (personal).
2. Read that file once. If it doesn't exist, start from `{}`.
3. Show the user the exact JSON you will add or change, then make one Edit that merges it in. Keep every existing key.
4. Use these shapes:
   - Permissions: `"permissions": {"allow": ["Bash(npm run *)"], "deny": [], "ask": []}`
   - Env vars: `"env": {"NAME": "value"}`
   - Hooks: `"hooks": {"<Event>": [{"matcher": "<ToolName or empty>", "hooks": [{"type": "command", "command": "<shell command>"}]}]}`. Events include PreToolUse, PostToolUse, Stop and UserPromptSubmit.
5. A behavior like "whenever X do Y" must be a hook, because the harness runs hooks and Claude's memory does not. Test the hook command once with a sample input before reporting it done.
6. Reply in two lines or fewer: which file changed and what was added.
