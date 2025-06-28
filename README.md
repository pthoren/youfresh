# YouFresh - AI-Powered Grocery Planning App

YouFresh is a Next.js web application that helps users plan their grocery lists by managing recipes and automatically generating shopping lists using AI.

## Features (Phase 1)

✅ **Authentication**: Google OAuth integration with NextAuth.js  
✅ **Recipe Management**: Add, edit, delete, and view recipes  
✅ **User-Scoped Data**: Each user's recipes are private and secure  
✅ **Order History Tracking**: Track when recipes were last ordered and total order count  
✅ **Responsive Design**: Works great on desktop and mobile  

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, PostgreSQL, Knex.js ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Lucide React icons, responsive design
- **Database**: PostgreSQL (Vercel Postgres recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Vercel Postgres recommended)
- Google OAuth credentials

### 1. Clone and Install

```bash
git clone <repository-url>
cd youfresh
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```bash
# Database
DATABASE_URL=your_postgres_connection_string

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI (for future phases)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Database Setup

Run the database migrations:

```bash
npx knex migrate:latest
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/     # NextAuth.js configuration
│   └── recipes/                # Recipe API endpoints
├── auth/signin/                # Sign-in page
├── recipes/                    # Recipe management pages
│   ├── new/                    # Add new recipe
│   └── [id]/edit/              # Edit recipe
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Home page
└── providers.tsx               # Session provider wrapper

lib/
├── auth.ts                     # Authentication utilities
├── db.ts                       # Database connection
└── types.ts                    # TypeScript type definitions

migrations/
└── 001_initial_schema.ts       # Database schema
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/*` - NextAuth.js endpoints

### Recipes
- `GET /api/recipes` - Get all user recipes
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/[id]` - Update recipe
- `DELETE /api/recipes/[id]` - Delete recipe

## Database Schema

### Users Table
```sql
users:
- id (UUID, primary key)
- email (varchar, required, unique)
- name (varchar, required) 
- image (varchar, nullable)
- provider (varchar, required)
- provider_id (varchar, required)
- created_at (timestamp)
- updated_at (timestamp)
```

### Recipes Table
```sql
recipes:
- id (UUID, primary key)
- user_id (UUID, foreign key to users.id)
- name (varchar, required)
- raw_ingredients (text, user input)
- parsed_ingredients (JSON, AI parsed) 
- primary_protein (varchar, nullable)
- primary_carbohydrate (varchar, nullable)
- primary_vegetable (varchar, nullable)
- last_ordered_at (timestamp, nullable)
- total_orders (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)
```

## Development Phases

### ✅ Phase 1: Core Recipe Management (COMPLETED)
- ✅ Next.js project setup with database
- ✅ NextAuth.js with Google OAuth  
- ✅ User authentication and session management
- ✅ CRUD operations for recipes (user-scoped)
- ✅ Basic UI for recipe management
- ✅ Recipe ordering history tracking

### 🚧 Phase 2: AI Integration (NEXT)
- OpenAI API integration for ingredient parsing
- Recipe categorization and validation  
- Enhanced UI with AI feedback

### 📋 Phase 3: Meal Planning
- Recipe suggestion system (with ordering history prioritization)
- Meal plan creation (user-scoped)
- Grocery list generation with quantity aggregation
- Order history updates when recipes are selected

### 🎨 Phase 4: Polish & Optimization  
- Responsive design improvements
- Performance optimization
- Error handling and edge cases
- Testing and deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
