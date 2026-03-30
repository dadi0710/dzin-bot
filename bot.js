const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Ты — редактор Telegram-канала "Дзынь". 
Аудитория: образованные люди 25–45 лет, ценят конкретику.
Голос: уверенный, без паники, цифры вместо слов, стрелки → для списков.
Эмодзи только 🔔 в начале хука.

Определи тип (breaking/analytic/numbers/law/funny) и перепиши по формуле.
Верни ТОЛЬКО JSON без markdown-обёртки:
{
  "type": "тип",
  "telegram": "текст до 800 символов с 🔔 в начале и стрелками →",
  "tiktok": "caption до 150 символов + хэштеги"
}

ЗАПРЕЩЕНО: капслок, «источники сообщают», больше 800 символов, хэштеги в telegram.`;

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || msg.caption;
  
  if (!text || text.startsWith('/')) {
    if (text === '/start') {
      bot.sendMessage(chatId, '🔔 Привет! Перешли мне любую новость — я перепишу её в стиле Дзынь.');
    }
    return;
  }

  await bot.sendChatAction(chatId, 'typing');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Исходник:\n\n${text}` }]
      })
    });

    const data = await response.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    const reply = `*Тип:* \`${result.type}\`\n\n` +
      `*✈️ Telegram:*\n${result.telegram}\n\n` +
      `*🎵 TikTok:*\n${result.tiktok}`;

    await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

const data = await response.json();
    
    // Добавь эту проверку
    if (data.error) {
      await bot.sendMessage(chatId, `❌ Claude API error: ${data.error.message}`);
      return;
    }
    
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    
    // Добавь эту проверку
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      await bot.sendMessage(chatId, `❌ JSON parse error. Claude ответил:\n\n${raw}`);
      return;
    }

   } catch (err) {
    await bot.sendMessage(chatId, `❌ Ошибка: ${err.message}`);
    console.error(err);
  }
  }
});

console.log('Бот запущен ✅');
