# ToolVerse 🚜

ToolVerse is a modern agricultural tool-sharing platform that connects tool owners with borrowers in their local community. By facilitating the rental of farming equipment, ToolVerse aims to increase the accessibility of agricultural resources, reduce equipment downtime, and support sustainable local farming communities.

## ✨ Features

- **🛍️ Tool Marketplace**: Browse and rent a wide variety of agricultural equipment.
- **🔄 Rental Workflow**: Seamless rental process with comprehensive status tracking (`Pending` → `Confirmed` → `Active` → `Completed`).
- **👨‍🌾 Expert Profiles**: Connect with agricultural experts for specialized advice and support.
- **📁 Local File Uploads**: Robust local image upload system for tool listings with progress tracking and previews.
- **🔐 Secure Authentication**: User management powered by Clerk with role-based access.
- **📊 Dynamic Dashboard**: A responsive, modern interface built with Next.js App Router and Tailwind CSS.
- **💬 Review System**: Integrated feedback and rating system for tools and transactions.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with `pg` driver
- **Authentication**: [Clerk](https://clerk.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Handling**: Local file system & [Cloudinary](https://cloudinary.com/) (legacy/fallback)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: Local or remote instance
- **Clerk Account**: For authentication credentials

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
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` & `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Set to `/sign-in` and `/sign-up`.
   - Cloudinary variables if using external image hosting fallback.

4. **Database Setup:**

   Initialize your database schema and add mock data by running the provided SQL scripts in order:
   
   - [sql/schema.sql](sql/schema.sql) (Creates core tables and views)
   - [sql/add_experts_table.sql](sql/add_experts_table.sql) (Adds expert profile support)
   - [sql/seed.sql](sql/seed.sql) (Seeds the database with initial categories and data)

5. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

- [app](app): Next.js App Router pages and API routes.
  - `(main)`: Group for authenticated routes (Dashboard, Profile).
  - `api`: Backend API endpoints for tools, bookings, and users.
- [components](components): Reusable UI components.
  - `ui`: Atomic UI components like Modals, Cards, and Navigation.
- [lib](lib): Database connection logic ([lib/db.ts](lib/db.ts)) and utility functions.
- [public](public): Static assets and `public/uploads/tools` for local tool images.
- [sql](sql): Database schema definitions and initialization scripts.
- [types](types): TypeScript interface definitions.
- [scratch](scratch): Utility scripts for manual database updates.

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality checks.
- `node scratch/update_db.mjs`: Utility script to sync database schema changes locally.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
