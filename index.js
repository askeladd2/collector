const axios = require("axios");
const fs = require("fs");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3000;

const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;
// const channelId = "-1002412850515";
const uri = process.env.MONGODB_URI;
const dbName = 'askeladd';
const collectionName = 'general';

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

let links = []; // Declare links array globally

// Function to retrieve links from MongoDB
async function retrieveData() {  
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Retrieve only 'link' field from all documents
        const data = await collection.find({}, { projection: { link: 1, _id: 0 } }).toArray();
        links = data.map(item => item.link);
        console.log('Retrieved data:', links);
    } catch (err) {
        console.error('Error retrieving data:', err);
    } finally {
        await client.close();
    }
}

// Function to run the bot
async function runbot() {
    await retrieveData(); // Ensure links are retrieved before starting the bot

    let lastVideoCaption = null;

    // Initialize bot
    const bot = new TelegramBot(token, { polling: true });

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name; 
        console.log(chatId, msg);
        const formattedMessage = `Welcome! ${firstName} 👋 \nThis is perfect place to get enlighted \nHappy fapping 💋`;
        bot.sendMessage(chatId, formattedMessage, {
            reply_markup: {
                keyboard: [["TURN ME ON 💦"], ["/SendAll"]],
                resize_keyboard: true,
            },
        });
    });
    // Handle all messages and commands
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (text === "TURN ME ON 💦") {
            for (let i = 0; i < 4 && i < links.length; i++) {
                try {
                    const videoCaption = `video no: ${i + 1}`;
                    await bot.sendVideo(chatId, links[i], { caption: videoCaption });
                    console.log(`Video sent to the chat! ${links[i]}`);
                    updateVideoCaptions(videoCaption);
                } catch (error) {
                    console.error("Error sending video:", error);
                    bot.sendMessage(chatId, `Error: ${error.message}`);
                }
            }
            textbtn(chatId);  // Provide inline button after the videos
        }

        // Handle /SendAll command
        if (text === "/SendAll") {
            try {
                await bot.sendMessage(chatId, "Tell the number of files you want (1 - 60)");
                bot.once('message', async (msg) => { // Use once to avoid multiple listeners
                    const response = parseInt(msg.text);
                    for (let i = 0; i < response && i < links.length; i++) {
                        await bot.sendVideo(chatId, links[i], { caption: `video no: ${i}` });
                    }
                });
            } catch (error) {
                console.error("Error sending video:", error);
            }
        }
    });

    // Handle inline button callback
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data === 'more') {
            const lastVideoCaption = getLastVideoCaption();
            const start = extractIntegersFromString(lastVideoCaption)[0] || 0;
            const end = start + 20;

            for (let i = start; i < end && i < links.length; i++) {
                try {
                    await bot.sendVideo(chatId, links[i], { caption: `Video no: ${i}` });
                } catch (error) {
                    console.error("Error sending video:", error);
                    bot.sendMessage(chatId, `Error: ${error.message}`);
                }
            }
            await bot.answerCallbackQuery(callbackQuery.id);  // Stops Telegram's "waiting" animation
        }
    });

    // Helper functions
    function updateVideoCaptions(newCaption) {
        lastVideoCaption = newCaption;         
        console.log("Updated Captions -> Last:", lastVideoCaption); 
    }

    function getLastVideoCaption() {
        return lastVideoCaption;
    }

    function extractIntegersFromString(str) {
        const regex = /\d+/g;  
        const matches = String(str).match(regex); 
        return matches ? matches.map(Number) : [];
    }

    function textbtn(chatId) {
        const options = {
            reply_markup: {
                inline_keyboard: [[{ text: "🍑", callback_data: `more` }]],
            }
        };
        bot.sendMessage(chatId, "Click for more👇", options);
    }
}

// Start the bot once when the server starts
runbot();

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.get('/ping', (req, res) => {
    res.send('Bot is alive');
  });
  
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});

// async function addData(links) {
//     try {
//         await client.connect();
//         const database = client.db('askeladd'); // Replace with your actual database name
//         const collection = database.collection('general'); // Replace with your actual collection name

//         for (const link of links) {
//             const linkData = { link }; // Store the link in an object
//             try {
//                 const result = await collection.insertOne(linkData); // Insert each link
//                 console.log(`New document inserted with _id: ${result.insertedId}`);
//             } catch (error) {
//                 if (error.code === 11000) {
//                     console.error(`Duplicate link found: ${link}. Skipping insertion.`);
//                 } else {
//                     console.error("Error inserting data:", error);
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("Error during addData operation:", error);
//     } finally {
//         await client.close();
//     }
// }

// addData(links);
