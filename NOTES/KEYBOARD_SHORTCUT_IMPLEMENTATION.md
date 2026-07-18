# Keyboard Implementation via Command/Event Registry Model

Here is a comprehensive, production-grade architectural plan to transform the Audio Production Suite into a keyboard-first workstation. This plan is designed to feel as fast and tactile as Vim or VS Code, using a unified event-registry model.

## 1. Unified Command Registry Architecture

Rather than scatters of onKeyDown handlers across individual components, we will implement a centralized Command Registry. This separates the intent (the action to perform) from the trigger (the specific key combo).

```ts
// Proposed type structure for ABPS commands
export interface Command {
  id: string;              // e.g., 'snippet.generation.play'
  name: string;            // Human-readable title
  category: 'Project' | 'Chapter' | 'Snippet' | 'Playback' | 'System';
  defaultBinding: string;  // e.g., 'Space' or 'Ctrl+Shift+Enter'
  description: string;
}

export type ActionContext = {
  activeSnippetId: string | null;
  selectedSnippetIds: string[];
  activeChapterId: string | null;
  focusMode: 'navigation' | 'editing';
};
```

**Hierarchical Namespace Actions:**
- **Navigation & Selection**
  - `navigation.focusNext`: ArrowDown (Moves focus to the next snippet)
  - navigation.focusPrev: ArrowUp (Moves focus to the previous snippet)
  - navigation.selectRangeDown: Shift+ArrowDown (Expands contiguous selection)
  - navigation.selectRangeUp: Shift+ArrowUp (Collapses/expands selection up)
  - navigation.escapeToContainer: Escape (Brings focus back to the container, blur textareas)
- **Snippet Operations**
  - snippet.edit: Enter (Enters editing mode on focused snippet)
  - snippet.generate: Ctrl+G (Generates TTS for focused snippet)
  - snippet.play: Space (Plays/pauses active generation)
  - snippet.moveUp: Alt+ArrowUp or Ctrl+Shift+ArrowUp (Shifts block order up)
  - snippet.moveDown: Alt+ArrowDown or Ctrl+Shift+ArrowDown (Shifts block order down)
- **Chapter Operations**
  - chapter.toggleCollapse: c (Collapses/expands active chapter block)
  - chapter.addSnippet: a (Adds a snippet directly below focus)

## 2. Multi-Mode Focus State Machine
To handle typing in textareas without triggering global commands, we introduce two discrete keyboard states: Navigation Mode and Edit Mode.

```
[ Enter / Double-Click ]
  ( NAVIGATION MODE ) ───────────────► ( EDIT MODE )
         ▲                                   │
         │           [ Escape ]              │
         └───────────────────────────────────┘
```

- Transition Implementation:
Navigation Mode (Command Mode):
Each snippet card has a tabIndex={0} and a unique focus ID.
We intercept global keydown events. If arrow keys are pressed, we prevent default scrolling and dynamically update state via:
document.getElementById(snippet-${nextId})?.focus().
Edit Mode (Insert Mode):
Triggered when selecting a textarea or pressing Enter on a focused snippet card.
The keyboard listener bypasses most keys, allowing standard input.
Pressing Escape blurs the active element (document.activeElement.blur()), placing the user immediately back into Navigation Mode focusing the enclosing container card.

## 3. Multi-Select Mechanics & Batch Action Handlers

To make selections feel fluid, we track a lastFocusedId and an array of selectedIds:
Contiguous Shift-Select: When Shift + ArrowDown or Shift + Click is executed, we compute the index range in the chapter snippet array between lastFocusedId and the target ID, then add all indices in between to selectedIds.
Non-Contiguous Selection: Handled by mouse via Ctrl+Click (Cmd+Click on Mac).
Action Propagation: Commands like snippet.generate check selectedIds. If multiple snippets are selected, it triggers sequential batch generation; otherwise, it operates on the single focused snippet.

## 4. Custom Keybinding Configuration (abps-settings.json)

To store and load settings (including keymaps, sample rates, default models, and UI states), we will introduce a schema-driven configuration.
The JSON Schema Structure (abps-settings.json / LocalStorage):

```json
{
  "$schema": "./schemas/settings.schema.json",
  "project": {
    "defaultModel": "gemini-3.5-flash",
    "sampleRate": 24000,
    "format": "wav"
  },
  "keybindings": {
    "snippet.play": "Space",
    "snippet.edit": "Enter",
    "navigation.escapeToContainer": "Escape",
    "snippet.generate": "Ctrl+G",
    "snippet.moveUp": "Alt+ArrowUp",
    "snippet.moveDown": "Alt+ArrowDown",
    "chapter.toggleCollapse": "C"
  }
}
```

How it binds in React:
We will initialize a KeybindingProvider that matches keyboard events against this mapping:

```ts
import hotkeys from 'hotkeys-js'; // Or lightweight custom listener

export function useKeybindings(config: Record<string, string>, commands: Record<string, Function>) {
  useEffect(() => {
    Object.entries(config).forEach(([commandId, hotkeyStr]) => {
      hotkeys(hotkeyStr, (event) => {
        // Prevent default browser behaviors if needed
        event.preventDefault();
        commands[commandId]?.();
      });
    });
    return () => hotkeys.unbind();
  }, [config, commands]);
}
```

## 5. Next Steps
- Define Settings Schema: Write the strict TypeScript interfaces and schema files to validate custom keybindings.
- Refactor Focus States: Add explicit tabIndex hooks and onFocus visual outlines to our snippet components.
- Deploy Key Event Controller: Integrate a dedicated custom hook (useKeyboardManager) directly inside App.tsx that coordinates navigation transitions, shift-selection ranges, and execution cascades.
- Let me know whenever you want to begin implementing these keybinding engines or the local settings loader!
