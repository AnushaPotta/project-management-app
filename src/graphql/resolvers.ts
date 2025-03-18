// src/graphql/resolvers.ts
// Mock data
const mockBoards = [
  {
    id: "1",
    title: "Project Alpha",
    description: "Main development project",
    background: "blue",
    isStarred: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        avatar: null,
        role: "ADMIN",
      },
    ],
    columns: [
      {
        id: "1",
        title: "To Do",
        order: 0,
        cards: [
          {
            id: "1",
            title: "Research API options",
            description: "Evaluate different API technologies",
            order: 0,
            columnId: "1",
            assignedTo: null,
            dueDate: null,
            labels: ["research"],
          },
        ],
      },
      {
        id: "2",
        title: "In Progress",
        order: 1,
        cards: [],
      },
      {
        id: "3",
        title: "Done",
        order: 2,
        cards: [],
      },
    ],
  },
];

export const resolvers = {
  Query: {
    boards: () => mockBoards,
    board: (_, { id }) => mockBoards.find((board) => board.id === id),
  },
  Mutation: {
    createBoard: (_, { input }) => {
      const newBoard = {
        id: String(mockBoards.length + 1),
        ...input,
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: [],
        columns: [],
      };
      mockBoards.push(newBoard);
      return newBoard;
    },
    updateBoard: (_, { id, input }) => {
      const boardIndex = mockBoards.findIndex((board) => board.id === id);
      if (boardIndex === -1) return null;

      mockBoards[boardIndex] = {
        ...mockBoards[boardIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return mockBoards[boardIndex];
    },
    // Add other mutation resolvers as needed
    // These are simplified mock implementations
    addColumn: (_, { boardId, title }) => {
      const board = mockBoards.find((b) => b.id === boardId);
      if (!board) return null;

      const newColumn = {
        id: `col-${Date.now()}`,
        title,
        order: board.columns.length,
        cards: [],
      };

      board.columns.push(newColumn);
      return board;
    },
    addCard: (_, { columnId, input }) => {
      const board = mockBoards.find((b) =>
        b.columns.some((col) => col.id === columnId)
      );

      if (!board) return null;

      const column = board.columns.find((col) => col.id === columnId);

      const newCard = {
        id: `card-${Date.now()}`,
        ...input,
        order: column.cards.length,
        columnId,
      };

      column.cards.push(newCard);
      return board;
    },
    // Implement other resolvers as needed
  },
};
