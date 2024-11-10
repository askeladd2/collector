const EventEmitter = require('events');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3434;
const token = process.env.RATANTATA;
const bot = new TelegramBot(token, { polling: true });
const channels = JSON.parse(process.env.CHANNELS); 
let ChnannelsJoinedByUser = [];
const BAN_DURATION = 57600000; // 16 hours in milliseconds

app.get('/', (req, res) => res.send('Bot is running'));
app.get('/ping', (req, res) => res.send('Bot is alive'));

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;   
    if (msg.text === '/start') {
        try {
            const channelButtons = channels.map(channel => ({
                text: channel.name,
                callback_data: `verify_${channel.id}`
            }));
            const rowsOfQueries = [];
            for (let i = 0; i < channelButtons.length; i += 3) {
                rowsOfQueries.push(channelButtons.slice(i, i + 3));
            }
            await bot.sendMessage(chatId, 'Click to join channels:', {
                reply_markup: { inline_keyboard: rowsOfQueries }
            });
        } catch (error) {
            console.error("Error in /start message handler:", error);
        }
    }
});

bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;

    if (query.data.startsWith('verify_')) {
        const channelId = query.data.replace('verify_', '');
        const inviteLink = await invite_checklist(channelId);
        
        if (inviteLink) {
            await bot.sendMessage(chatId, `Please join the channel using this link:`, {
                reply_markup: { inline_keyboard: [[{ text: "Join Here", url: inviteLink }]] }
            });
            trackUserChannelJoin(userId, channelId);
        } else {
            console.error(`Could not retrieve invite link for channel ${channelId}`);
        }
    }
});

function trackUserChannelJoin(userId, channelId) {
    if (!ChnannelsJoinedByUser.find(join => join.userId === userId && join.channelId === channelId)) {
        ChnannelsJoinedByUser.push({ userId, channelId, joinedAt: Date.now() });
        console.log(`User ${userId} verified for channel ${channelId}`);
        
        setTimeout(() => handleBanUnban(userId, channelId), BAN_DURATION);
    }
}

async function handleBanUnban(userId, channelId) {
    try {
        console.log(`Banning user ${userId} from ${channelId} after 16 hours`);
        await bot.banChatMember(channelId, userId);
        ChnannelsJoinedByUser = ChnannelsJoinedByUser.filter(join => !(join.userId === userId && join.channelId === channelId));
        
        setTimeout(async () => {
            try {
                await bot.unbanChatMember(channelId, userId);
                console.log(`Unbanned user ${userId} from ${channelId} after 5 seconds`);
            } catch (unbanError) {
                console.error(`Error unbanning user from channel ${channelId}:`, unbanError);
            }
        }, 5000);
    } catch (banError) {
        console.error(`Error banning user from channel ${channelId}:`, banError);
    }
}

async function invite_checklist(channelId) {
    try {
        const inviteLink = await bot.createChatInviteLink(channelId, {
            expire_date: Math.floor(Date.now() / 1000) + 600,
            member_limit: 1
        });
        return inviteLink.invite_link;
    } catch (error) {
        console.error(`Error fetching invite link for channel ${channelId}:`, error);
        return null;
    }
}

app.listen(PORT, () => console.log(`Express server is running on http://localhost:${PORT}`));
