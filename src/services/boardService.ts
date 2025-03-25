// src/services/boardService.ts
// Replace this with your actual data fetching logic (API calls, etc.)

export async function fetchAllBoards() {
  // Example implementation - replace with your API calls
  return [
    { id: "1", title: "Project Alpha", members: [] },
    { id: "2", title: "Marketing Campaign", members: [] },
  ];
}

export async function fetchBoard(boardId) {
  // Example implementation - replace with your API calls
  return {
    id: boardId,
    title: "Project Alpha",
    members: [{ id: "1", name: "John Doe", avatar: "/avatars/john.png" }],
    columns: [
      {
        id: "col-1",
        title: "To Do",
        cards: [
          {
            id: "card-1",
            title: "Research competitors",
            description: "Analyze main competitors in the market",
          },
        ],
      },
      {
        id: "col-2",
        title: "In Progress",
        cards: [
          {
            id: "card-2",
            title: "Design homepage",
            description: "Create mockups for the new homepage",
          },
        ],
      },
      {
        id: "col-3",
        title: "Done",
        cards: [],
      },
    ],
  };
}
