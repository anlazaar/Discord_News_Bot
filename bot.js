require("dotenv").config({ path: "./local.env" });
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require("discord.js");
const Parser = require("rss-parser");

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  },
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const MAX_HISTORY = 1000;
let seenLinks = new Set();
const MIN_SCORE_REQUIRED = 2;

const KEYWORDS = {
  WORLD: [
    "Iran",
    "Israel",
    "USA",
    "United States",
    "conflict",
    "war",
    "attack",
    "strike",
    "bomb",
    "military",
    "treaty",
  ],
  TECH: [
    "AI",
    "artificial intelligence",
    "cybersecurity",
    "google",
    "apple",
    "microsoft",
    "hardware",
    "software",
    "startup",
    "tech",
  ],
  MARKET: [
    "stocks",
    "crypto",
    "bitcoin",
    "economy",
    "inflation",
    "wall street",
    "fed",
    "interest rates",
    "market",
    "invest",
  ],
  DEV: [
    "javascript",
    "python",
    "react",
    "api",
    "programming",
    "developer",
    "open source",
    "framework",
    "github",
    "code",
  ],
};

const FEEDS = [
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    name: "Al Jazeera",
    color: 0xffa500,
    keywords: KEYWORDS.WORLD,
    categoryId: "WORLD",
    categoryName: "🌍 World News",
  },
  {
    url: "http://rss.cnn.com/rss/edition_world.rss",
    name: "CNN",
    color: 0xcc0000,
    keywords: KEYWORDS.WORLD,
    categoryId: "WORLD",
    categoryName: "🌍 World News",
  },
  {
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch",
    color: 0x00a562,
    keywords: KEYWORDS.TECH,
    categoryId: "TECH",
    categoryName: "💻 Tech News",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    name: "The Verge",
    color: 0xe51937,
    keywords: KEYWORDS.TECH,
    categoryId: "TECH",
    categoryName: "💻 Tech News",
  },
  {
    url: "https://finance.yahoo.com/news/rssindex",
    name: "Yahoo Finance",
    color: 0x7b0099,
    keywords: KEYWORDS.MARKET,
    categoryId: "MARKET",
    categoryName: "📈 Markets & Finance",
  },
  {
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    name: "WSJ",
    color: 0x333333,
    keywords: KEYWORDS.MARKET,
    categoryId: "MARKET",
    categoryName: "📈 Markets & Finance",
  },
  {
    url: "https://dev.to/feed",
    name: "Dev.to",
    color: 0x0a0a0a,
    keywords: KEYWORDS.DEV,
    categoryId: "DEV",
    categoryName: "👨‍💻 Development",
  },
  {
    url: "https://www.freecodecamp.org/news/rss/",
    name: "freeCodeCamp",
    color: 0x006400,
    keywords: KEYWORDS.DEV,
    categoryId: "DEV",
    categoryName: "👨‍💻 Development",
  },
];

const stripHtml = (text) =>
  text ? text.replace(/(<([^>]+)>)/gi, "").trim() : "";
const truncate = (text, length = 350) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, text.lastIndexOf(" ", length)) + "...";
};

function calculateScore(title, description, keywords) {
  if (!keywords || keywords.length === 0) return 99;
  let score = 0;
  const titleLower = (title || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, "gi");
    score += (titleLower.match(regex) || []).length * 3;
    score += (descLower.match(regex) || []).length * 1;
  }
  return score;
}

client.once("clientReady", async () => {
  console.log(`[PREMIUM] Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (channel) {
    setInterval(() => startNewsPoll(channel), 24 * 60 * 60 * 1000);
  }
});

client.on("messageCreate", async (message) => {
  if (message.content === "!news" && !message.author.bot) {
    startNewsPoll(message.channel);
  }
});

async function startNewsPoll(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "📊 Daily Topic Poll" })
    .setTitle("What should today's Executive Briefing focus on?")
    .setDescription(
      "Good day. Please select the sector you wish to focus on for today's briefing.\n\n*This poll will close and generate the briefing in **60 seconds**.*"
    )
    .setColor(0x2b2d31);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("WORLD")
      .setLabel("🌍 World")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("TECH")
      .setLabel("💻 Tech")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("MARKET")
      .setLabel("📈 Markets")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("DEV")
      .setLabel("👨‍💻 Dev")
      .setStyle(ButtonStyle.Danger)
  );

  const pollMessage = await channel.send({
    embeds: [embed],
    components: [row],
  });

  const collector = pollMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 10000,
  });
  const votes = new Map();

  collector.on("collect", async (interaction) => {
    votes.set(interaction.user.id, interaction.customId);
    await interaction.reply({
      content: `Your vote for **${interaction.customId}** has been securely registered.`,
      flags: MessageFlags.Ephemeral,
    });
  });

  collector.on("end", async () => {
    const tally = { WORLD: 0, TECH: 0, MARKET: 0, DEV: 0 };
    votes.forEach((vote) => tally[vote]++);

    let winningCategoryId = "WORLD";
    let maxVotes = -1;
    for (const [key, val] of Object.entries(tally)) {
      if (val > maxVotes) {
        maxVotes = val;
        winningCategoryId = key;
      }
    }

    const categoryName = FEEDS.find(
      (f) => f.categoryId === winningCategoryId
    ).categoryName;

    await pollMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2b2d31)
          .setDescription(
            `*The poll has concluded. The community selected **${categoryName}** with ${maxVotes} vote(s).*`
          ),
      ],
      components: [],
    });

    generateBriefing(channel, winningCategoryId, categoryName);
  });
}

async function generateBriefing(channel, categoryId, categoryName) {
  console.log(`Generating briefing for: ${categoryName}`);

  const targetFeeds = FEEDS.filter((f) => f.categoryId === categoryId);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  let candidates = [];

  await channel.sendTyping();

  for (const feedConfig of targetFeeds) {
    try {
      const rss = await parser.parseURL(feedConfig.url);
      if (!rss) continue;

      const items = rss.items
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 10);

      for (const item of items) {
        if (!item.link || seenLinks.has(item.link)) continue;

        seenLinks.add(item.link);
        if (seenLinks.size > MAX_HISTORY)
          seenLinks.delete(seenLinks.values().next().value);

        const pubDate = new Date(item.pubDate || Date.now());
        if (pubDate.getTime() < oneDayAgo) continue;

        const description = stripHtml(
          item.contentSnippet || item.content || "No detailed summary provided."
        );
        const score = calculateScore(
          item.title,
          description,
          feedConfig.keywords
        );

        if (score >= MIN_SCORE_REQUIRED) {
          candidates.push({ item, feedConfig, score, pubDate, description });
        }
      }
    } catch (err) {
      console.error(`Failed fetching feed ${feedConfig.name}:`, err.message);
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.pubDate - a.pubDate);
  const topArticles = candidates.slice(0, 5);

  if (topArticles.length === 0) {
    return channel.send(
      `*No high-quality, relevant news was found for **${categoryName}** in the last 24 hours. Please run \`!news\` later.*`
    );
  }

  let markdownBody = `*Curated specifically for our esteemed members based on today's community poll.*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  topArticles.forEach((data, index) => {
    const ranks = ["🥇", "🥈", "🥉", "🏅", "🎖️"];
    const number = ranks[index];

    markdownBody += `## ${number} [${data.item.title}](${data.item.link})\n`;
    markdownBody += `**📰 ${data.feedConfig.name}**  |  🕒 ${new Date(
      data.pubDate
    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n`;
    markdownBody += `> ${truncate(data.description, 400)}\n\n`;
  });

  const masterEmbed = new EmbedBuilder()
    .setAuthor({ name: "🗞️ THE EXECUTIVE DAILY BRIEFING" })
    .setTitle(`Today's Focus: ${categoryName}`)
    .setDescription(markdownBody)
    .setColor(topArticles[0].feedConfig.color)
    .setFooter({
      text: "Use !news to generate a new edition • News Radar Premium",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  await channel.send({ embeds: [masterEmbed] });
}

client.login(TOKEN);
