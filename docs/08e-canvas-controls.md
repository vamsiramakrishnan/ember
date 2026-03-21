# Ember — Interactive Controls: Canvas Controls

## Family 8, Part 4: The Tools on the Desk

When the notebook enters canvas mode (4.1), the linear flow relaxes into two-dimensional space. This requires controls that do not exist in linear mode: a toolbar for mode switching, zoom controls, drag handles on elements, and a collapse mechanism. These controls are the tools on the desk — present while you're arranging, invisible when you're reading.

---

### 8.12 — Canvas Toolbar

**What it is.** The control bar for canvas mode. Contains mode toggles, zoom controls, and utility actions. This is the only dark-background element in Ember besides the primary button.

**Visual specification.**
- Background: `ink`
- Height: 40px
- Padding: 4px 12px
- Border-radius: 2px
- Position: bottom-centre of the canvas region, 12px from the bottom edge, floating above content
- Shadow: none
- Layout: flex row, centred, `control-gap` (8px) between groups

**Internal structure.**

```
[ Select | Annotate | Auto-Align ]  ·  [ − 100% + ]  ·  [ ⤢ ]
```

Three groups separated by 1px vertical rules in `paper` at 15% opacity.

**Mode toggle buttons (left group).**
- Typeface: IBM Plex Mono, 10px, Regular (400), uppercase, letter-spacing 1.5px
- Icon: Material Symbols, 16px, preceding label, 4px gap
- Color (inactive): `paper` at 40% opacity
- Color (active): `paper` at 100% opacity
- No background on individual toggles — selection is indicated purely by opacity
- Transition: `transition-control` (180ms)

Only one mode is active at a time. Modes:
- **Select** (icon: `arrow_selector_tool`) — default, click to select elements
- **Annotate** (icon: `edit`) — click to add text annotations to the canvas
- **Auto-Align** (icon: `grid_on`) — system arranges elements to a grid

**Zoom controls (centre group).**
- `zoom_out` and `zoom_in` icons, 18px, `paper` at 60%
- Current zoom value between icons: IBM Plex Mono, 10px, `paper` at 80%
- Default zoom: 100%, range: 50%–200%, step: 10%
- Hover: icon opacity rises to 100%, 120ms
- Keyboard: `Cmd/Ctrl +` zoom in, `Cmd/Ctrl -` zoom out

**Expand/fullscreen (right group).**
- Single icon button: `open_in_full`, 18px, `paper` at 60%
- Toggles the canvas between inline (embedded in notebook) and fullscreen (fills the viewport)
- In fullscreen: icon changes to `close_fullscreen`

**Accessibility.**
- Mode toggles: `role="radiogroup"` with `role="radio"` and `aria-checked` per toggle
- Zoom: `aria-label="Zoom level: 100%"`, updates live
- Keyboard: `Tab` to enter toolbar, `Arrow` keys to move between groups, `Enter` to activate

---

### 8.13 — Canvas Collapse / Expand

**What it is.** The mechanism for collapsing a canvas region back to a single line, and expanding it again. A canvas is a fold-out page in the notebook — it should be able to fold back up.

**Visual specification.**
- Collapse trigger: an icon button (8.4) in the top-right of the canvas header area
- Icon: `unfold_less` (when canvas is expanded), `unfold_more` (when collapsed)
- Size: 20px, `ink-ghost`

**Collapsed state.**
- The canvas reduces to a single horizontal bar:
- Height: 36px
- Background: `paper-warm`
- Border: 1px `rule`, 2px radius
- Content: canvas label (IBM Plex Mono, 11px, `ink-ghost`) + element count in `ink-ghost` ("4 elements")
- The `unfold_more` icon on the right

**Transition.**
- Collapse: height animates from full to 36px, 400ms ease. Content fades out over the first 200ms.
- Expand: height animates from 36px to full, 400ms ease. Content fades in over the last 200ms.
- `prefers-reduced-motion`: instant, no animation.

---

### 8.14 — Drag Handle

**What it is.** An indicator that an element can be repositioned in canvas mode. The handle appears only on hover — at rest, the element looks the same as in linear mode.

**Visual specification.**
- Icon: Material Symbols `drag_indicator`, 14px
- Color: `ink-ghost`
- Position: top-right of the draggable element, 4px inset from edges
- Cursor: `grab` on hover, `grabbing` while dragging

**Interactive states.**

| State | Opacity | Color |
|---|---|---|
| Rest | 0 (invisible) | — |
| Element hover | 0.3 | `ink-ghost` |
| Handle hover | 1.0 | `ink-faint` |
| Dragging | 1.0 | `ink-soft` |

**Drag behaviour.**
- On drag start: element gains 1px dashed `rule` border
- While dragging: element follows pointer with no delay, opacity 0.85
- Drop target: potential drop zones gain a 1px dashed `rule` border on the receiving side
- On drop: element snaps to drop position, 150ms ease. Dashed borders disappear.
- `prefers-reduced-motion`: no snap animation, instant placement

**Compositional rules.** Drag handles appear only in canvas mode. In linear mode, elements are not draggable. The following elements can have drag handles: cards (3.2), scratch notes (1.2), sketches (1.4), prose entries (1.1), concept diagrams (2.4), thinker cards (2.5). Tables (3.3), Socratic questions (2.2), and silence markers (2.6) cannot appear in canvas and therefore have no drag handle.

---

### 8.15 — Canvas Connector Controls

**What it is.** The interaction for creating and labelling connectors (4.2) between elements on the canvas.

**Creation gesture.**
- Hover on an element in canvas: four small connection points appear at the midpoints of each edge
- Connection point: 6px × 6px, `rule` color, 50% border-radius (the one exception to the 2px rule — connection points are functional indicators, not containers)
- Drag from a connection point to another element: a bezier line follows the pointer in `ink-ghost`, 1px
- On release over a valid target: the connector solidifies to the spec (4.2): 1px `ink-soft`, gentle bezier

**Label creation.**
- Click the midpoint of an existing connector: an inline editable field (8.11) appears
- Typeface: Crimson Pro Italic, 12px, Light (300), `ink-faint`
- On blur or Enter: label is placed at the midpoint of the curve

**Deletion.**
- Click to select a connector: it thickens to 2px, color shifts to `ink`
- Press `Delete` or `Backspace`: connector fades out over 200ms
- No confirmation dialog
