const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3434;
const token = process.env.RATANTATA;
const bot = new TelegramBot(token, { polling: true });
const channels = JSON.parse(process.env.CHANNELS); 
let ChnannelsJoinedByUser = [];
// Fetch invite links and emit 'ready' event once fetched
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
    
        if (msg.text === '/start') {
            try {
                const channelButtons = await Promise.all(channels.map(async (channel) => {                  
                    return {
                        text: channel.name,
                        callback_data: `verify_${channel.id}`  // Use callback_data instead of url
                    };
                }));
                
                // Arrange buttons in rows of 3 for inline keyboard layout
                const rowsOfQueries = [];
                for (let i = 0; i < channelButtons.length; i += 3) {
                    rowsOfQueries.push(channelButtons.slice(i, i + 3)); // Create rows of buttons
                }
            
                // Send the message with the inline keyboard
                await bot.sendMessage(chatId, 'Click to join channels:', {
                    reply_markup: {
                        inline_keyboard: rowsOfQueries  // Use rowsOfQueries with callback_data, no url field
                    }
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
            
            try {
                    const inviteLink = await bot.exportChatInviteLink(channelId);
                    await bot.sendMessage(chatId, `Please join the channel using this link:`,{
                        reply_markup:{
                            inline_keyboard: [
                                [{ text: "Join Here", url: inviteLink }] // Add the "Try Again" button
                            ]
                        }
                    });
                    // Check if user is already in tracking array
                    if (!ChnannelsJoinedByUser.find(join => join.userId === userId && join.channelId === channelId)) {
                        ChnannelsJoinedByUser.push({
                            userId,
                            channelId,
                            joinedAt: Date.now()
                        });
                        console.log(`User ${userId} verified for channel ${channelId}`);
                        console.log('Current joined channels:', ChnannelsJoinedByUser);
                        console.log(ChnannelsJoinedByUser)
                        setTimeout(async () => {
                            try {
                                console.log(`Banning user ${userId} from ${channelId} after 16 hours`);
                                await bot.banChatMember(channelId, userId);
                                // Remove from joined channels array
                                ChnannelsJoinedByUser = ChnannelsJoinedByUser.filter(
                                    join => !(join.userId === userId && join.channelId === channelId)
                                );
                                // Unban after 5 seconds
                                setTimeout(async () => {
                                    try {
                                        await bot.unbanChatMember(channelId, userId);
                                        console.log(`Unbanned user ${userId} from ${channelId} after 5 seconds`);
                                    } catch (unbanError) {
                                        console.error(`Error unbanning user from channel ${channelId}:`, unbanError);
                                    }
                                }, 1000);
                                
                            } catch (banError) {
                                console.error(`Error banning user from channel ${channelId}:`, banError);
                            }
                        }, 57600000); // 16 hours = 57600000 milliseconds
                     
                }
            } catch (error) {
                console.error('Error handling verification:', error);
                await bot.answerCallbackQuery(query.id, {
                    text: 'Error verifying membership. Please try again.',
                    show_alert: true
                });
            }
        }
    });
// });
// async function checkMembershipWithRetry(userId, channelId1, channelId2, maxRetries = 1) {
//     for (let i = 0; i < maxRetries; i++) {
//         try {
//             const [isMember1, isMember2] = await Promise.all([ 
//                 isUserMemberOfChannel(userId, channelId1), 
//                 isUserMemberOfChannel(userId, channelId2)
//             ]);
//             if (isMember1 && isMember2) {
//                 return true;
//             } else {
//                 console.log(`Retry ${i + 1}: User ${userId} is not a member of both channels. Retrying in 4 seconds...`);
//             }
//         } catch (error) {
//             console.error('Error checking membership status:', error);
//         }
//     }
//     return false;
// }

// async function isUserMemberOfChannel(userId, channelId) {
//     try {
//         const chatMember = await bot.getChatMember(channelId, userId);
//         console.log(`User ${userId} membership status in ${channelId}:`, chatMember.status);
//         return ['member', 'administrator', 'creator'].includes(chatMember.status);
//     } catch (error) {
//         console.error(`Error checking membership status for user ${userId} in channel ${channelId}:`, error);
//         return false;
//     }
// }

// Function to fetch invite link for a channel

// Sleep utility (for other uses)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start express server
app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.get('/ping', (req, res) => {
    res.send('Bot is alive');
});

app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});






// Define channel IDs and variables to store invite links
// const joinrequest1 = "-1002314081203";
// const joinrequest2 = '-1002409821166';
// let Invitejoinrequest1 = null;
// let Invitejoinrequest2 = null;


// async function invite_checklist(channelId) { 
//     try {
//         const inviteLink = await bot.createChatInviteLink(channelId, {
//             expire_date: Math.floor(Date.now() / 1000) + 600, // Expires in 10 minutes
//             member_limit: 1 // Limit to 1 member
//         });
//         return inviteLink.invite_link;
//     } catch (error) {
//         console.error(`Error fetching invite link for channel ${channelId}:`, error);
//         return null;
//     }
// }


// const isMember = await checkMembershipWithRetry(userId, joinrequest1,joinrequest2);
// if (!isMember) {
//     // Generate invite link if user is not a member
//     // const inviteLink = await bot.exportChatInviteLink(channelId);
    
//     bot.sendMessage(chatId, 'Please join our channels first:', {
//         reply_markup: {
//             inline_keyboard: [
//                 [{ text: "Join Channel 1", url: Invitejoinrequest1 }],
//                 [{ text: "Join Channel 2", url: Invitejoinrequest2}]
//             ]
//         }
//     });
// } else {



// async function fetchInviteLinks() {
//     try {
//         Invitejoinrequest1 = await invite_checklist(joinrequest1);
//         Invitejoinrequest2 = await invite_checklist(joinrequest2);
//         if (Invitejoinrequest1 && Invitejoinrequest2) {
//             console.log("Invitejoinrequest1:", Invitejoinrequest1);
//             console.log("Invitejoinrequest2:", Invitejoinrequest2);
//             eventEmitter.emit('ready'); // Emit 'ready' event once links are created
//         } else {
//             console.error("Failed to create invite links.");
//         }
//     } catch (error) {
//         console.error("Error fetching invite links:", error);
//     }
// }
// fetchInviteLinks();