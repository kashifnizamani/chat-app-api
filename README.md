# Chat App Backend

A real-time chat application backend built with NestJS, WebSockets, and PostgreSQL. This project provides a complete API for user authentication, chat room management, and real-time messaging capabilities.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-time Messaging**: WebSocket support via Socket.io for instant message delivery
- **Chat Rooms**: Create and manage individual and group chat rooms
- **User Management**: User registration and profile management
- **API Documentation**: Swagger/OpenAPI documentation integrated
- **Database ORM**: Prisma for type-safe database operations
- **CORS Enabled**: Cross-origin resource sharing configured

## Tech Stack

- **Framework**: NestJS 11
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Real-time**: Socket.io with WebSockets
- **Authentication**: JWT & Passport
- **Password Hashing**: bcrypt
- **API Docs**: Swagger/OpenAPI
- **Language**: TypeScript
- **Testing**: Jest

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # Auth endpoints
│   ├── auth.service.ts      # Auth logic
│   ├── auth.guard.ts        # JWT guard
│   ├── decorators/          # Custom decorators
│   └── dto/                 # Data transfer objects
├── chat/                    # WebSocket chat module
│   ├── chat.gateway.ts      # Socket.io gateway
│   ├── chat.service.ts      # Chat business logic
│   ├── chat.types.ts        # Type definitions
│   └── dto/                 # Chat DTOs
├── users/                   # User management module
│   ├── users.service.ts     # User operations
│   └── users.module.ts      # Module config
├── prisma/                  # Prisma service
│   └── prisma.service.ts    # Database service
├── types/                   # Global types
├── app.module.ts            # Root module
├── app.controller.ts        # Root controller
├── app.service.ts           # Root service
└── main.ts                  # Application entry point

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migrations

test/
├── app.e2e-spec.ts         # E2E tests
└── jest-e2e.json           # Jest config for E2E
```

## Database Schema

### User
- `id`: Unique identifier (UUID)
- `username`: User's display name
- `email`: Unique email address
- `password`: Hashed password
- `createdAt`: Account creation timestamp
- `messages`: Relationship to messages sent by user

### Room
- `id`: Unique identifier (UUID)
- `name`: Room/conversation name (optional)
- `isGroup`: Boolean flag for group chats
- `createdAt`: Room creation timestamp
- `messages`: Relationship to room messages

### Message
- `id`: Unique identifier (UUID)
- `content`: Message text
- `createdAt`: Message timestamp
- `senderId`: Reference to sending user
- `roomId`: Reference to chat room
- `sender`: Relationship to user
- `room`: Relationship to room

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 12+

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd chat-app-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/chat_app
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
NODE_ENV=development
```

4. **Set up the database**
```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

5. **Generate Prisma client**
```bash
npx prisma generate
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# debug mode
npm run start:debug

# production mode
npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/swagger/json
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

#### Chat (WebSocket)
- `@SubscribeMessage('sendMessage')` - Send a message to a room
- `@SubscribeMessage('joinRoom')` - Join a chat room
- `@SubscribeMessage('leaveRoom')` - Leave a chat room

## Code Quality

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

## Database Migrations

### Create a new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply migrations
```bash
npx prisma migrate deploy
```

### View database in Prisma Studio
```bash
npx prisma studio
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRATION` | JWT token expiration time in seconds | 3600 |
| `NODE_ENV` | Environment (development/production) | development |

## Project Commands Summary

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start with debugger |
| `npm run start:prod` | Start production build |
| `npm run build` | Build the application |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Architecture

This project follows NestJS best practices with a modular architecture:

- **Modules**: Each feature (auth, chat, users) is encapsulated in its own module
- **Services**: Business logic is separated into service classes
- **Controllers/Gateways**: Handle HTTP requests and WebSocket connections
- **Guards**: JWT authentication guard protects routes
- **DTOs**: Data validation and type safety with class-validator
- **Prisma**: Centralized database access through PrismaService

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for stateless authentication
- CORS is enabled for cross-origin requests
- Environment variables store sensitive information
- Input validation using class-validator



