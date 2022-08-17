const { RoomServiceClient, AccessToken } = require('livekit-server-sdk');

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const buildFolder = '../client/build';
const app = express();

app.set('views', path.join(__dirname, buildFolder));
app.engine('html', require('ejs').renderFile);
app.use(
    '/static',
    express.static(path.join(__dirname, `${buildFolder}/static`))
);

app.use(express.json());
app.use(cors());

const { API_KEY, API_SECRET, NODE_ENV } = process.env;
const WEBRTC_HOST = NODE_ENV !== 'development' ? 'ws://192.168.0.3:7880' : 'ws://localhost:7880';

app.listen(5000, () => {
    console.log('LiveKit Server running on 5000!');
    console.log(`WebRTC host -> ${WEBRTC_HOST}`);
});

const svc = new RoomServiceClient(WEBRTC_HOST, API_KEY, API_SECRET);

const createAccessToken = (name, room, isProc) => {
    const tokenOptions = {
        identity: name,
        ...(!isProc && { metadata: name }),
    };
    const accessToken = new AccessToken(API_KEY, API_SECRET, tokenOptions);

    accessToken.addGrant({
        roomJoin: true,
        room,
        canPublish: !isProc,
        canSubscribe: isProc,
        hidden: isProc,
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
        const rooms = await svc.listRooms();

        res.status(200).send(rooms);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});

app.post('/rooms/create', async (req, res) => {
    try {
        const options = req.body;
        const room = await svc.createRoom(options);

        res.status(200).send(room);
    } catch (err) {
        console.error(err);
        res.status(404).send(err);
    }
});

app.get('/*', function (req, res) {
    res.render('index.html', { WEBRTC_HOST });
});
