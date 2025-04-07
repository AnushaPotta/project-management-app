# Project Management App

A modern project management application built with Next.js, GraphQL, and Chakra UI. This application helps teams organize and track their projects with a beautiful and intuitive interface.

## Features

- Task management with drag-and-drop functionality
- Real-time updates using GraphQL
- Firebase authentication and data persistence
- Responsive design with Chakra UI
- TypeScript support for better development experience

## Tech Stack

- **Frontend Framework**: Next.js 15.2
- **UI Library**: Chakra UI
- **State Management**: Apollo Client
- **Database**: Firebase
- **API**: GraphQL with Apollo Server
- **Authentication**: Firebase Auth
- **Styling**: Emotion
- **Animations**: Framer Motion
- **DnD**: Hello Pangea DnD

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`
4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable UI components
├── contexts/     # React context providers
├── graphql/      # GraphQL schemas and resolvers
├── lib/          # Utility libraries and configurations
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
