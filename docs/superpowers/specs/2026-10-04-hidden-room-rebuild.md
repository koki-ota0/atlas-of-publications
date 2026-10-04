# Hidden Room Rebuild Spec

- Remove the legacy hidden-room experience: cat key, fragments, achievements, experiment logs, shelf, terminal, and old review-story references.
- Place exactly three independently tappable hidden birds in the ATLAS experience: banner, map, and INDEX.
- Each bird can be collected once. Collection state is stored under a new versioned LocalStorage key so legacy progress does not carry over.
- Keep the fixed bottom-right door position. The door must remain absent until all three birds are collected.
- Opening the door shows a focused hidden-room overlay containing only the existing attention-allocation mini-game and a close control.
- Support pointer, keyboard, desktop, and mobile interaction.

