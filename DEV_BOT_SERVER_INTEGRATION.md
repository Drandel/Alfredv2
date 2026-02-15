# Dev Bot Server Integration

How to set up your own development bot for local testing.

## 1. Create the Application

- Go to [discord.com/developers/applications](https://discord.com/developers/applications)
- Click **"New Application"** in the top right
- Name it something like `Alfred-Dev-YourName` and create it
- On the **General Information** page, copy the **Application ID** — that's your `CLIENT_ID` for `.env`

## 2. Create the Bot & Get the Token

- Go to the **Bot** tab in the left sidebar
- The bot user is auto-created with the application
- Click **"Reset Token"** and copy it — that's your `DISCORD_TOKEN` for `.env`
- **You only see the token once**, so paste it into your `.env` right away

## 3. Enable Required Intents

Still on the **Bot** tab, scroll down to **Privileged Gateway Intents** and enable:

- **Message Content Intent** — required for prefix commands to read message text

The other intents we use (Guilds, Guild Messages) are non-privileged and enabled by default.

## 4. Invite the Bot to Your Server

- Go to the **OAuth2** tab in the left sidebar
- Scroll down to **OAuth2 URL Generator**
- Under **Scopes**, check: `bot` and `applications.commands`
- Under **Bot Permissions**, check at minimum: `Send Messages`, `Read Message History`, `Use Slash Commands` (you can add more later)
- Copy the generated URL at the bottom, paste it into your browser
- Select your test server from the dropdown and authorize

## 5. Fill In Your `.env`

Copy `.env.example` to `.env` and fill in your values:

```
DISCORD_TOKEN=the-token-you-copied
CLIENT_ID=the-application-id-you-copied
PREFIX=!
```

## 6. Deploy Commands & Start

```bash
npm run deploy
npm start
```

You should see `Logged in as Alfred-Dev-YourName#1234` in the terminal. Try `/ping` or `!ping` in your server to confirm it's working.
