// The first-run tour. `target` names a spot on the chat screen to highlight (see Tutorial.js and App.js), or null for a centred card.

export const TUTORIAL_TARGETS = ["input", "vehicle", "quotes", "shops", "menu"];

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Engine Eye",
    text: "Here's a quick tour of what you can do. It takes about 30 seconds, and you can skip it any time.",
  },
  {
    id: "input",
    target: "input",
    title: "Describe the problem",
    text: "Type what you're seeing, hearing, or feeling. Tap + to add a photo of a warning light or a part, or to look up an OBD-II code.",
  },
  {
    id: "vehicle",
    target: "vehicle",
    title: "Your vehicle",
    text: "Add your car for more specific answers and safety recall checks. It's optional, and you can add or switch vehicles whenever you like.",
  },
  {
    id: "quotes",
    target: "quotes",
    title: "Quotes and repairs",
    text: "Photograph a mechanic's quote to see what's necessary, what can wait, and what looks overpriced. Log repairs and track maintenance here too.",
  },
  {
    id: "shops",
    target: "shops",
    title: "Find a shop",
    text: "Opens Maps with auto repair shops near you.",
  },
  {
    id: "menu",
    target: "menu",
    title: "Menu",
    text: "Your saved diagnoses, safety recalls for your vehicle, your vehicles, and Settings.",
  },
  {
    id: "done",
    target: null,
    title: "You're all set",
    text: "Describe a problem to get started. You can replay this tour any time in Settings.",
  },
];
