const app = require("./app");
// npm install dotenv
const dotenv = require("dotenv");
// npm i mongoose@6.13.8
const mongoose = require("mongoose");

dotenv.config({ path: './config.env' })

mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.log('Unhandled Rejection! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});