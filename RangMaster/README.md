# RangMaster

A real-time multiplayer card game powered by Node.js, Express, WebSockets, React, Zustand, and Neon PostgreSQL.

## Features
- Real-time multiplayer gameplay via WebSockets
- Persistent game state using Neon PostgreSQL
- Modern React-based UI
- Zustand for state management
- Room creation, joining, chat, and AI players

## Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- Yarn or npm
- Neon PostgreSQL database (get a connection string from https://neon.tech/)

### 1. Clone the Repository
```
git clone <your-fork-or-upstream-url>
cd RangMaster
```

### 2. Set Up Environment Variables
Create a `.env` file in the `RangMaster` directory:
```
DATABASE_URL=postgresql://<username>:<password>@<host>/<db>?sslmode=require
```

### 3. Install Dependencies
```
# From the RangMaster directory
npm install
```

### 4. Run the Server (and Client)
The server serves both the backend API and the frontend React app on **port 5000**.

```
npm run dev
# or
npm start
```

- Open your browser and go to: [http://localhost:5000](http://localhost:5000)
- The WebSocket endpoint is at: `ws://localhost:5000/ws`

### 5. Development Notes
- You do **not** need to run the client separately. The backend serves the UI.
- If you change frontend code, restart the server or use hot-reload if available.
- If you see WebSocket errors, ensure both client and server are running on port 5000.

### 6. Troubleshooting
- **WebSocket Issues:**
  - Ensure you are accessing the app at `http://localhost:5000`.
  - Check that your `.env` file is correct and the database is reachable.
  - Look for errors in the terminal and browser console.
- **Database Issues:**
  - Make sure your Neon database is provisioned and the connection string is correct.

### 7. Project Structure
```
RangMaster/
  ├── client/         # React frontend
  ├── server/         # Express backend, WebSocket server
  ├── shared/         # Shared types and logic
  ├── .env            # Environment variables (not committed)
  └── README.md       # This file
```

## Contributing
Pull requests and issues are welcome!

## License
MIT
