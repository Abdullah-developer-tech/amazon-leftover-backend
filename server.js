const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Direct Connection
mongoose.connect("mongodb+srv://aslamabdullah288_db_user:Abd12345@abdullah.2zmjnx6.mongodb.net/?retryWrites=true&w=majority&appName=Abdullah")
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.get('/', (req, res) => {
  res.send('Amazon Leftover Backend is running successfully on Vercel!');
});

// Vercel ke liye app.listen nahi likhte, balkay app ko export karte hain:
module.exports = app;