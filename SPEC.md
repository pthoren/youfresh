# YouFresh - Grocery Planning App Specification

## Overview
YouFresh is a Next.js web application that helps users plan their grocery lists by managing recipes and automatically generating shopping lists. The app uses AI to parse ingredient text and categorize recipes.

## Core Features

### 1. Recipe Management
- **Add Recipe**: Users can create new recipes with a name and free-text ingredients
- **Edit Recipe**: Users can modify existing recipe names and ingredients
- **Delete Recipe**: Users can remove recipes from their collection
- **View Recipes**: Display all user recipes in a searchable/filterable list

### 2. AI-Powered Ingredient Parsing
- Use OpenAI GPT-4o to parse free-text ingredients into structured data
- Extract individual ingredients with quantities and units
- Automatically categorize each recipe into primary protein, carbohydrate, and vegetable
- Validation: Recipes must have at least 2 of the 3 categories (protein, carb, vegetable)

### 3. Meal Planning & Grocery List Generation
- Suggest 3 recipes at a time for meal planning (prioritize recipes not ordered recently)
- Try *not* to suggest recipes with the same primary ingredients at a time, e.g. don't suggest two meals with the same type of protein
- Allow users to change what recipes were suggested if they don't like the suggestions
- Automatically aggregate ingredient quantities across selected recipes
- Generate a consolidated grocery shopping list for those recipes
- Track recipe ordering history (last ordered date and total order count)
- Allow users to manually set last ordered date for existing recipes

## Technical Specifications

### Frontend
- **Framework**: Next.js 14+ with App Router
- **UI Library**: React with TypeScript
- **Styling**: Tailwind CSS (responsive design)
- **State Management**: React hooks + Context API or Zustand
- **Forms**: React Hook Form with validation

### Backend
- **Database**: PostgreSQL on Vercel
- **ORM**: Knex
- **API**: Next.js API routes
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: OpenAI API (GPT-4o)

### Database Schema

#### Users Table
```sql
users:
- id (UUID, primary key)
- email (varchar, required, unique)
- name (varchar, required)
- image (varchar, nullable)
- provider (varchar, required) -- 'google', etc.
- provider_id (varchar, required)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Recipes Table
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

#### Meal Plans Table (for future grocery ordering)
```sql
meal_plans:
- id (UUID, primary key)
- user_id (UUID, foreign key to users.id)
- name (varchar)
- recipe_ids (JSON array)
- grocery_list (JSON)
- created_at (timestamp)
```

## User Stories

### Authentication
1. As a user, I want to sign in with my Google account to access my personal recipes
2. As a user, I want my recipes and meal plans to be saved securely and privately
3. As a user, I want to stay logged in across browser sessions
4. As a user, I want to be able to sign out when I'm done using the app

### Recipe Management
1. As a user, I want to add a new recipe by entering a name and ingredients in free text
2. As a user, I want to see all my recipes in a list with search functionality
3. As a user, I want to edit existing recipes
4. As a user, I want to delete recipes I no longer need
5. As a user, I want to see when I last ordered each recipe and how many times I've ordered it
6. As a user, I want to optionally specify when I last ordered a recipe (for existing recipes I've made before)

### AI Processing
1. As a user, I want the app to automatically parse my ingredient text into structured data
2. As a user, I want the app to tell me if my recipe is missing required categories
3. As a user, I want to see what the AI identified as the primary protein, carb, and vegetable

### Grocery Planning
1. As a user, I want to see 3 suggested recipes for meal planning (prioritizing recipes I haven't ordered recently)
2. As a user, I want to select recipes for my weekly plan
3. As a user, I want to generate a consolidated grocery list from my selected recipes
4. As a user, I want to see quantities properly aggregated (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour")
5. As a user, I want the app to automatically track when I order recipes and update the order history

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Google (handled by NextAuth.js)
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current user session

### Recipes
- `GET /api/recipes` - Get all recipes for authenticated user
- `POST /api/recipes` - Create new recipe for authenticated user
- `PUT /api/recipes/[id]` - Update recipe (user must own recipe)
- `DELETE /api/recipes/[id]` - Delete recipe (user must own recipe)
- `POST /api/recipes/parse` - Parse ingredients with AI
- `PATCH /api/recipes/[id]/order-history` - Update last ordered date and increment order count

### Meal Planning
- `POST /api/meal-plans` - Create meal plan for authenticated user
- `GET /api/meal-plans/[id]/grocery-list` - Generate grocery list (user must own meal plan)

## Pages Structure
```
/                     - Home page with recipe suggestions (requires auth)
/auth/signin          - Sign in page with Google OAuth
/recipes              - Recipe management page (requires auth)
/recipes/new          - Add new recipe page (requires auth)
/recipes/[id]/edit    - Edit recipe page (requires auth, user must own recipe)
/meal-plan            - Weekly meal planning page (requires auth)
/grocery-list         - Generated grocery list page (requires auth)
```

## OpenAI Integration

### Ingredient Parsing Prompt
```
Parse the following recipe ingredients text into a structured JSON format:

Input: [user's ingredient text]

Return JSON with:
1. ingredients: array of {name, quantity, unit}
2. primary_protein: string (most prominent protein ingredient)
3. primary_carbohydrate: string (most prominent carb ingredient)  
4. primary_vegetable: string (most prominent vegetable ingredient)
5. is_valid_meal: boolean (has at least 2 of protein/carb/vegetable)

Example output:
{
  "ingredients": [
    {"name": "chicken breast", "quantity": "1", "unit": "lb"},
    {"name": "rice", "quantity": "2", "unit": "cups"},
    {"name": "broccoli", "quantity": "1", "unit": "head"}
  ],
  "primary_protein": "chicken breast",
  "primary_carbohydrate": "rice",
  "primary_vegetable": "broccoli",
  "is_valid_meal": true
}
```

## Future Enhancements
- Integration with grocery delivery APIs (Instacart, DoorDash)
- Nutritional information tracking
- Meal scheduling for specific dates
- Recipe sharing and discovery
- Inventory tracking to avoid buying duplicates

## Development Phases

### Phase 1: Core Recipe Management
- Set up Next.js project with database
- Implement NextAuth.js with Google OAuth
- User authentication and session management
- Implement CRUD operations for recipes (user-scoped)
- Basic UI for recipe management
- Recipe ordering history tracking (last ordered, total orders)

### Phase 2: AI Integration
- OpenAI API integration for ingredient parsing
- Recipe categorization and validation
- Enhanced UI with AI feedback

### Phase 3: Meal Planning
- Recipe suggestion system (with ordering history prioritization, user-scoped)
- Meal plan creation (user-scoped)
- Grocery list generation with quantity aggregation
- Order history updates when recipes are selected

### Phase 4: Polish & Optimization
- Responsive design improvements
- Performance optimization
- Error handling and edge cases
- Testing and deployment
