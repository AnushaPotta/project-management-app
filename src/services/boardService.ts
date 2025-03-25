// src/services/boardService.ts
import { Board } from "@/types/board";

export async function fetchAllBoards(): Promise<Board[]> {
  const now = new Date().toISOString();

  // Make sure all required properties from the Board type are included
  return [
    {
      id: "1",
      title: "Project Alpha",
      description: "Main project board",
      members: [],
      isStarred: false,
      createdAt: now,
      updatedAt: now,
      columns: [
        {
          id: "col-1",
          title: "To Do",
          cards: [],
          order: 0,
        },
        {
          id: "col-2",
          title: "In Progress",
          cards: [],
          order: 1,
        },
        {
          id: "col-3",
          title: "Done",
          cards: [],
          order: 2,
        },
      ],
    },
    {
      id: "2",
      title: "Marketing Campaign",
      description: "Marketing initiatives",
      members: [],
      isStarred: false,
      createdAt: now,
      updatedAt: now,
      columns: [
        {
          id: "col-4",
          title: "To Do",
          cards: [],
          order: 0,
        },
        {
          id: "col-5",
          title: "In Progress",
          cards: [],
          order: 1,
        },
        {
          id: "col-6",
          title: "Done",
          cards: [],
          order: 2,
        },
      ],
    },
  ];
}

export async function createBoard(boardData: {
  title: string;
  description?: string;
}): Promise<Board> {
  const now = new Date().toISOString();

  const newBoard: Board = {
    id: `board-${Date.now()}`,
    title: boardData.title,
    description: boardData.description || "",
    members: [],
    isStarred: false,
    createdAt: now,
    updatedAt: now,
    columns: [
      {
        id: `col-${Date.now()}-1`,
        title: "To Do",
        cards: [],
        order: 0,
      },
      {
        id: `col-${Date.now()}-2`,
        title: "In Progress",
        cards: [],
        order: 1,
      },
      {
        id: `col-${Date.now()}-3`,
        title: "Done",
        cards: [],
        order: 2,
      },
    ],
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return newBoard;
}

export async function fetchBoard(boardId: string): Promise<Board> {
  const now = new Date().toISOString();

  // Example implementation - replace with actual API call
  return {
    id: boardId,
    title: "Example Board",
    description: "Example description",
    members: [],
    isStarred: false,
    createdAt: now,
    updatedAt: now,
    columns: [
      {
        id: "col-1",
        title: "To Do",
        cards: [],
        order: 0,
      },
      {
        id: "col-2",
        title: "In Progress",
        cards: [],
        order: 1,
      },
      {
        id: "col-3",
        title: "Done",
        cards: [],
        order: 2,
      },
    ],
  };
}

export async function updateBoard(
  boardId: string,
  updates: Partial<Board>
): Promise<Board> {
  // In a real app, this would update the board via API
  // For demo, we'll simulate an update
  const existingBoard = await fetchBoard(boardId);

  const updatedBoard: Board = {
    ...existingBoard,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return updatedBoard;
}

export async function deleteBoard(boardId: string): Promise<void> {
  // In a real app, this would delete via API
  // For demo, just simulate the API call

  console.log(`Deleting board with id: ${boardId}`);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // No return value needed for delete operation
}

export async function starBoard(
  boardId: string,
  isStarred: boolean
): Promise<Board> {
  // In a real app, this would update via API
  // For demo, simulate the update

  const board = await fetchBoard(boardId);
  board.isStarred = isStarred;
  board.updatedAt = new Date().toISOString();

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return board;
}

// Add a new column to a board
export async function addColumn(
  boardId: string,
  columnTitle: string
): Promise<Board> {
  const board = await fetchBoard(boardId);

  // Calculate the next order value
  const maxOrder = board.columns.reduce(
    (max, col) => (col.order > max ? col.order : max),
    -1
  );

  const newColumn = {
    id: `col-${Date.now()}`,
    title: columnTitle,
    cards: [],
    order: maxOrder + 1,
  };

  board.columns.push(newColumn);
  board.updatedAt = new Date().toISOString();

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return board;
}

// Add a card to a column
export async function addCard(
  boardId: string,
  columnId: string,
  cardData: { title: string; description?: string }
): Promise<Board> {
  const board = await fetchBoard(boardId);

  const column = board.columns.find((col) => col.id === columnId);
  if (!column) {
    throw new Error(`Column with id ${columnId} not found`);
  }

  // Calculate the next order value for the card
  const maxOrder =
    column.cards.length > 0
      ? Math.max(...column.cards.map((card) => card.order))
      : -1;

  const newCard = {
    id: `card-${Date.now()}`,
    title: cardData.title,
    description: cardData.description || "",
    order: maxOrder + 1, // Add the order property
    columnId: columnId, // Add the columnId property
  };

  column.cards.push(newCard);
  board.updatedAt = new Date().toISOString();

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return board;
}
