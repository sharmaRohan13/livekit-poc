import { Express } from 'express';
import {
    RoomServiceClient,
    Room,
    AccessToken,
    CreateOptions,
    VideoGrant,
} from 'livekit-server-sdk';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app: Express = express();
app.use(express.json());
app.use(cors());
app.listen(5000, () => {
    console.log('LiveKit Serve running on 5000!')
});

const apiKey = 'devkey';
const secret = 'secret';

// const apiKey = process.env.API_KEY;
// const secret = process.env.API_SECRET;

const svc = new RoomServiceClient(
    process.env.HOST!,
    apiKey,
    secret
);

const createAccessToken: Function = (name: string, room: string, isProc: boolean): string => {
    const tokenOptions = {
        identity: name,
        ...(!isProc && { metadata: name }),
    };

    const accessToken = new AccessToken(
        apiKey,
        secret,
        tokenOptions
    );

    accessToken.addGrant({
        roomJoin: true,
        room,
        canPublish: !isProc,
        canSubscribe: isProc,
        hidden: isProc
    });

    return accessToken.toJwt();
};

app.post('/proctor/register', (req, res) => {
    try {
        const { name, room } = req.body;
        const token = createAccessToken(name, room, true);

        res.status(200).send(token);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});

app.post('/participant/register', (req, res) => {
    try {
        const { name, room } = req.body;
        const token = createAccessToken(name, room, false);

        res.status(200).send(token);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});

app.get('/rooms', async (req, res) => {
    try {
        const rooms: Room[] = await svc.listRooms();

        res.status(200).send(rooms);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});

app.post('/rooms/create', async (req, res) => {
    try {
        const options: CreateOptions = req.body;
        const room: Room = await svc.createRoom(options);

        res.status(200).send(room);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});
