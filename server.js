// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./models/dbMessages.js";
import Pusher from "pusher";

// app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
    appId: "1327829",
    key: "eb6c465caf16f5f039ab",
    secret: "68e323b84fceeb1b03bf",
    cluster: "ap2",
    useTLS: true,
});

// middleware
app.use(express.json());
// handle the CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// db config
const connection_url =
    "mongodb+srv://whatsapp_user:12345@cluster0.k4omk.mongodb.net/whatsappClone_db?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured : ", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
            });
        } else {
            console.log("Error triggering pusher");
        }
    });
});

// api routes
app.get("/", (req, res) => {
    res.status(200).send("hello world");
});
app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(501).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

//start the server
app.listen(port, () => {
    console.log(`server is up and running on port: ${port}`);
});
