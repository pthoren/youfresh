# YouFresh - AI-Powered Grocery Planning App

YouFresh is a Next.js web application that helps users plan their grocery lists by managing recipes and automatically generating shopping lists using AI.

## Features

### Phase 1 ✅ **Complete**
- **Authentication**: Google OAuth integration with NextAuth.js  
- **Recipe Management**: Add, edit, delete, and view recipes  
- **User-Scoped Data**: Each user's recipes are private and secure  
- **Order History Tracking**: Track when recipes were last ordered and total order count  
- **Responsive Design**: Works great on desktop and mobile  

### Phase 2 ✅ **Complete - AI Integration**
- **AI Ingredient Parsing**: Automatically parse raw ingredient text into structured data
- **Recipe Categorization**: AI identifies primary protein, carbohydrate, and vegetable
- **Meal Validation**: AI determines if recipe contains components for a complete meal
- **Parsing Preview**: Preview AI results before saving recipes
- **Smart Quantities**: AI normalizes units and quantities (cups, tbsp, lbs, etc.)
- **Real-time Parsing**: Test parsing on new and existing recipes

### Phase 3 🔄 **In Progress**
- Meal planning functionality
- Automated grocery list generation
- Shopping optimization

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, PostgreSQL, Knex.js ORM
- **AI**: OpenAI GPT-4o for ingredient parsing and categorization
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Lucide React icons, responsive design
- **Database**: PostgreSQL (Vercel Postgres recommended)

## AI Features in Detail

YouFresh uses OpenAI's GPT-4o model to intelligently parse and categorize recipe ingredients:

### Ingredient Parsing
- Converts natural language ingredients into structured data
- Extracts quantity, unit, and ingredient name
- Normalizes units (e.g., "tbsp" → "tablespoons")
- Handles various input formats (lists, paragraphs, bullet points)

### Recipe Categorization  
- Identifies the **primary protein** (chicken, beef, tofu, beans, etc.)
- Identifies the **primary carbohydrate** (rice, pasta, bread, potatoes, etc.)
- Identifies the **primary vegetable** (broccoli, spinach, carrots, etc.)

### Meal Validation
- Determines if a recipe has at least 2 of the 3 main categories
- Helps users create balanced, complete meals
- Provides feedback on missing components

### Usage Examples

**Input:** 
```
2 cups cooked rice
1 lb chicken breast, diced  
2 cups broccoli florets
3 tablespoons soy sauce
```

**AI Output:**
- ✅ **Complete Meal** (has protein, carb, and vegetable)
- 🥩 **Primary Protein:** chicken breast
- 🌾 **Primary Carb:** rice  
- 🥬 **Primary Vegetable:** broccoli
- 📋 **Parsed Ingredients:** 4 items with quantities and units

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

# OpenAI API Key (Required for AI parsing)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file
6. Ensure you have billing set up (AI parsing requires API calls)

### 4. Database Setup

Run the database migrations:

```bash
npx knex migrate:latest
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env.local`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using AI Features

### Adding New Recipes with AI Parsing

1. Navigate to "Add New Recipe"
2. Enter your recipe name
3. Add ingredients in any natural format:
   ```
   2 cups flour
   1 lb chicken breast
   3 large carrots, diced
   1 onion, chopped
   2 tbsp olive oil
   ```
4. Click **"Preview AI Parsing"** to see how the AI interprets your ingredients
5. Review the parsed results:
   - Structured ingredient list with quantities and units
   - Primary protein, carbohydrate, and vegetable identification
   - Meal completeness validation
6. Save the recipe with the AI-parsed data

### Editing Recipes with AI Re-parsing

1. Go to any existing recipe and click "Edit"
2. Modify the ingredients as needed
3. Use **"Preview AI Parsing"** to see updated categorization
4. Save to update the recipe with new AI parsing results

### Recipe Categories

Recipes are automatically displayed with color-coded categories:
- 🥩 **Red badges** for proteins (chicken, beef, tofu, beans, etc.)
- 🌾 **Yellow badges** for carbohydrates (rice, pasta, bread, etc.)  
- 🥬 **Green badges** for vegetables (broccoli, spinach, carrots, etc.)

### Tips for Better AI Results

- **One ingredient per line** works best
- **Include quantities and units** (cups, tablespoons, pounds, etc.)
- **Be specific** ("chicken breast" vs "chicken")
- **Use standard units** (the AI will normalize variations)
- **Review parsing results** before saving

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
