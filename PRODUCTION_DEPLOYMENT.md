# Production Deployment

How to deploy Alfred to a Digital Ocean droplet (Ubuntu) with pm2.

## 1. SSH Into Your Droplet

```bash
ssh root@your-droplet-ip
```

## 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify with `node -v` and `npm -v`.

## 3. Install pm2

```bash
npm install -g pm2
```

## 4. Create a Bot User (Optional but Recommended)

Avoids running the bot as root:

```bash
adduser --disabled-password --gecos "" alfred
su - alfred
```

## 5. Clone the Repo

As the `alfred` user (or root if you skipped step 4):

```bash
git clone https://github.com/Drandel/Alfredv2.git
cd Alfredv2
npm install
```

## 6. Create the `.env`

This is the **production** bot — a separate application from your dev bots. Create one at the [Discord Developer Portal](https://discord.com/developers/applications) and follow the same setup steps in [DEV_BOT_SERVER_INTEGRATION.md](DEV_BOT_SERVER_INTEGRATION.md).

```bash
nano .env
```

```
DISCORD_TOKEN=your-production-bot-token
CLIENT_ID=your-production-client-id
GUILD_ID=your-discord-server-id
PREFIX=!
```

`GUILD_ID` enables instant slash command registration for your server. Without it, commands are registered globally and can take up to 1 hour to propagate. Get the guild ID by right-clicking your server name in Discord (with Developer Mode enabled) and selecting "Copy Server ID".

Save and exit (`Ctrl+X`, `Y`, `Enter`).

## 7. Deploy Slash Commands & Test

```bash
npm run deploy
npm start
```

If you see `Logged in as Alfred#1234`, it works. Kill it with `Ctrl+C` — pm2 will manage it from here.

## 8. Start With pm2

```bash
pm2 start src/index.js --name alfred
```

Useful pm2 commands:

| Command | What it does |
|---|---|
| `pm2 logs alfred` | View live logs |
| `pm2 restart alfred` | Restart after pulling changes |
| `pm2 stop alfred` | Stop the bot |
| `pm2 status` | See running processes |

## 9. Auto-Start on Reboot

```bash
pm2 startup
```

Follow the command it prints (copy/paste it), then:

```bash
pm2 save
```

This ensures Alfred starts automatically if the droplet reboots.

## 10. Deploying Updates

When you merge changes to `main` and want to update production, run the deploy script **from your local machine**:

```bash
bash scripts/deploy-prod.sh
```

This SSHs into the droplet and handles everything — pulls latest code, installs dependencies, deploys slash commands, and restarts the bot.

**Important:** Slash command deployment (`node deploy-commands.js`) should only be run on the production server, not locally. The local `.env` has dev bot credentials which differ from production. The deploy script handles this automatically.

The script is configured in `scripts/deploy-prod.sh` with the droplet IP and project path.

**Note:** The first time you run this, SSH will ask you to verify the host fingerprint. You must type `yes` (the full word) and press Enter — just pressing Enter will fail with "Host key verification failed".
