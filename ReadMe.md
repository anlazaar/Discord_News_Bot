# 📰 Discord News Radar Bot

A **Discord bot that generates a daily curated news briefing** based on community votes.
Users vote for a topic (World, Tech, Markets, or Development), and the bot fetches the **most relevant articles from trusted RSS sources**, ranks them using keyword scoring, and delivers a **clean executive-style news briefing** in Discord.

---

# ✨ Features

- 📊 **Interactive Poll System**
  Users vote on which category should generate the daily news briefing.

- 🧠 **Smart Article Scoring**
  Articles are ranked using keyword relevance and recency.

- 🗞️ **Curated News Briefing**
  The bot compiles the **top 5 most relevant articles** into a professional embed.

- ⚡ **RSS Feed Aggregation**
  Fetches news from multiple sources including:

  - Al Jazeera
  - CNN
  - TechCrunch
  - The Verge
  - Yahoo Finance
  - Wall Street Journal
  - Dev.to
  - freeCodeCamp

- 🔁 **Duplicate Prevention**
  Maintains a history of previously posted links to avoid reposting.

- 🎯 **Category Filtering**

  - 🌍 World News
  - 💻 Tech News
  - 📈 Markets & Finance
  - 👨‍💻 Development

- 🎨 **Clean Markdown Formatting**
  Articles include:

  - Ranking medals 🥇🥈🥉
  - Source
  - Publish time
  - Summary
  - Direct link

---

# 🛠 Tech Stack

- **Node.js**
- **discord.js**
- **rss-parser**
- **dotenv**

---

# 📦 Installation

Clone the repository:

```bash
git clone https://github.com/anlazaar/Discord_News_Bot.git
cd Discord_News_Bot
```

Install dependencies:

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a file called **`local.env`**

```env
DISCORD_TOKEN=your_bot_token
CHANNEL_ID=your_channel_id
```

---

# ▶️ Running the Bot

```bash
node bot.js
```

---

# 🧠 How It Works

1. Users run the command:

```
!news
```

2. The bot posts a **poll with topic buttons**.

3. After voting ends:

   - The winning category is selected.

4. The bot:

   - Fetches RSS feeds
   - Filters recent articles
   - Scores them based on keywords
   - Selects the **top 5 best stories**

5. A **Daily Executive Briefing embed** is posted in the channel.

---

# 📅 Automatic Polls

The bot can automatically trigger the daily poll using an internal timer.

---

# 🔒 Security Note

Never commit your `.env` or `local.env` files.

Add them to `.gitignore`:

```
node_modules/
local.env
.env
```

