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
    inviteMember: (_, { boardId, email }) => {
      const board = mockBoards.find((b) => b.id === boardId);
      if (!board) return null;

      // In a real implementation, you would validate and invite the user
      // For mock purposes we'll just add a fake user
      const newMember = {
        id: `user-${Date.now()}`,
        name: `User ${email}`,
        email,
        avatar: null,
        role: "MEMBER",
      };

      board.members.push(newMember);
      return board;
    },
    removeMember: (_, { boardId, memberId }) => {
      const board = mockBoards.find((b) => b.id === boardId);
      if (!board) return null;

      board.members = board.members.filter((m) => m.id !== memberId);
      return board;
    },
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
    updateColumn: (_, { columnId, input }) => {
      let updatedColumn = null;

      mockBoards.forEach((board) => {
        const column = board.columns.find((c) => c.id === columnId);
        if (column) {
          Object.assign(column, input);
          updatedColumn = column;
        }
      });

      return updatedColumn;
    },
    deleteColumn: (_, { columnId }) => {
      const board = mockBoards.find((b) =>
        b.columns.some((c) => c.id === columnId)
      );

      if (!board) return null;

      const columnIndex = board.columns.findIndex((c) => c.id === columnId);
      if (columnIndex === -1) return null;

      // Remove the column
      board.columns.splice(columnIndex, 1);

      // Reorder remaining columns
      board.columns.forEach((col, index) => {
        if (index >= columnIndex) {
          col.order = index;
        }
      });

      return board;
    },
    moveColumn: (_, { boardId, sourceIndex, destinationIndex }) => {
      const board = mockBoards.find((b) => b.id === boardId);
      if (!board) return null;

      const columns = [...board.columns];
      const [removed] = columns.splice(sourceIndex, 1);
      columns.splice(destinationIndex, 0, removed);

      // Update orders
      columns.forEach((col, index) => {
        col.order = index;
      });

      board.columns = columns;
      return board;
    },
    addCard: (_, { columnId, input }) => {
      const board = mockBoards.find((b) =>
        b.columns.some((col) => col.id === columnId)
      );

      if (!board) return null;

      const column = board.columns.find((col) => col.id === columnId);
      if (!column) return null;

      const newCard = {
        id: `card-${Date.now()}`,
        ...input,
        order: column.cards.length,
        columnId,
      };

      column.cards.push(newCard);
      return board;
    },

    // New resolver for updating cards
    updateCard: (_, { cardId, input }) => {
      let updatedCard = null;

      mockBoards.forEach((board) => {
        board.columns.forEach((column) => {
          const cardIndex = column.cards.findIndex(
            (card) => card.id === cardId
          );
          if (cardIndex !== -1) {
            // Update the card with new values
            column.cards[cardIndex] = {
              ...column.cards[cardIndex],
              ...input,
            };
            updatedCard = column.cards[cardIndex];
          }
        });
      });

      return updatedCard;
    },

    // New resolver for deleting cards
    deleteCard: (_, { cardId }) => {
      let affectedBoard = null;

      mockBoards.forEach((board) => {
        board.columns.forEach((column) => {
          const cardIndex = column.cards.findIndex(
            (card) => card.id === cardId
          );

          if (cardIndex !== -1) {
            // Remove the card
            column.cards.splice(cardIndex, 1);

            // Reorder remaining cards
            column.cards.forEach((card, index) => {
              if (index >= cardIndex) {
                card.order = index;
              }
            });

            affectedBoard = board;
          }
        });
      });

      return affectedBoard;
    },

    // Resolver for moving cards
    moveCard: (_, { boardId, source, destination }) => {
      const board = mockBoards.find((b) => b.id === boardId);
      if (!board) return null;

      const sourceColumn = board.columns.find((c) => c.id === source.columnId);
      const destColumn = board.columns.find(
        (c) => c.id === destination.columnId
      );

      if (!sourceColumn || !destColumn) return null;

      // Moving within the same column or between columns
      const [movedCard] = sourceColumn.cards.splice(source.index, 1);
      movedCard.columnId = destination.columnId;
      destColumn.cards.splice(destination.index, 0, movedCard);

      // Update order in source column
      sourceColumn.cards.forEach((card, index) => {
        card.order = index;
      });

      // Update order in destination column
      destColumn.cards.forEach((card, index) => {
        card.order = index;
      });

      return board;
    },
  },
};
