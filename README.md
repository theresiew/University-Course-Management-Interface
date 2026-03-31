# University Course Management Interface

A professional frontend dashboard for a university supervisor to authenticate and manage the course catalog using the provided Student Management System backend.

## Features

- Supervisor login using the provided test credentials
- Protected dashboard experience
- View all courses from `GET /api/courses`
- Fetch a single course by ID from `GET /api/courses/{id}`
- Create a course with `POST /api/courses`
- Update a course with `PUT /api/courses/{id}`
- Delete a course with `DELETE /api/courses/{id}`
- Responsive Tailwind CSS interface with feedback messages and loading states

## Tech Stack

- React 19
- Vite
- Tailwind CSS

## Backend API

- Swagger docs: `https://student-management-system-backend.up.railway.app/api-docs/#/`
- Base URL: `https://student-management-system-backend.up.railway.app`

## Test Credentials

- Email: `admin@example.com`
- Password: `adminpassword123`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local URL shown in your terminal.

## Environment Variables

Create a `.env` file if you want to override the backend URL:

```bash
VITE_API_BASE_URL=https://student-management-system-backend.up.railway.app
```

An example file is already included as [.env.example](/c:/Users/USER/Desktop/University-course-management/.env.example).

## Production Build

```bash
npm run build
```

## Deployment

This project is ready to deploy to any static host that supports Vite builds, such as Netlify or Vercel.

- Build command: `npm run build`
- Publish directory: `dist`

## Notes

- Authentication is required before course management actions are available.
- The app stores the supervisor session in local storage and retries protected requests with the refresh token when possible.
