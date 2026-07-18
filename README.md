# Smart Metro Navigator

A beginner-friendly metro route simulator with graph algorithms, user accounts, and saved journeys.

## Run the project

1. Open a terminal in this folder.
2. Run `npm start`.
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

Do not open `index.html` directly for the login feature. It needs the local server running.

## What is stored

- `metro.db` is the SQLite database created automatically on the first start.
- User passwords are stored as salted password hashes, not readable passwords.
- Saved journeys belong only to the logged-in user.

## Gmail password-reset OTP

1. Turn on two-step verification for your Gmail account.
2. Create a Gmail **App Password** at [Google Account security](https://myaccount.google.com/security).
3. Copy `.env.example` to a new `.env` file in this folder.
4. Put your Gmail address and the App Password in `.env`.
5. Restart the app with `npm start`.

Never put your normal Gmail password in `.env` or in source code.

## Main files

- `server.mjs` — local server, login API, and database code.
- `metro.db` — local SQLite database (created when you run the server).
- `index.html`, `style.css`, `app.js` — website interface and metro algorithms.
