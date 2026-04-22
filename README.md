# ToolVerse

ToolVerse is a modern agricultural tool-sharing platform that connects tool owners with borrowers in their local community. By facilitating the rental of farming equipment, ToolVerse aims to increase the accessibility of agricultural resources, reduce equipment downtime, and support local farming communities.

## Features

- **Tool Rentals Workflow**: Seamless rental process with comprehensive status tracking (`Pending` -> `Confirmed` -> `Active` -> `Completed`).
- **Expert Profiles**: Connect with agricultural experts for advice and support.
- **Local File Uploads**: Robust local image upload system for tool listings with progress tracking and previews.
- **Secure Authentication**: User management powered by Clerk.
- **Dynamic Dashboard**: A responsive, dynamic interface built with Next.js App Router and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Image Handling**: Local file system & [Cloudinary](https://cloudinary.com/) (legacy/fallback)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL Database
- Clerk Account (for authentication)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd ToolVerse
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy the `.env.example` to `.env.local` and populate it with your specific credentials:

   ```bash
   cp .env.example .env.local
   ```
   
   Ensure you provide:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: From your Clerk dashboard.
   - Cloudinary variables if using external image hosting fallback.

4. **Database Setup:**

   Initialize your database schema and add mock data by running the provided SQL scripts against your PostgreSQL instance, located in the `sql/` directory:
   
   - `sql/schema.sql` (Creates tables and views)
   - `sql/add_experts_table.sql` (Adds expert profile support)
   - `sql/seed.sql` (Seeds the database with initial data)

5. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components.
- `/lib`: Utility functions and database connection logic.
- `/public/uploads/tools`: Directory for local tool image uploads.
- `/sql`: Database schema and seeding scripts.
