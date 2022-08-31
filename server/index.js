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
  '/livekit/static',
  express.static(path.join(__dirname, `${buildFolder}/static`))
);

app.use(express.json());
app.use(cors());

const { API_KEY, API_SECRET, NODE_ENV, WEBRTC_HOST_URL, MONGODB_CONN_STR } =
  process.env;
const WEBRTC_HOST =
  NODE_ENV !== 'development' ? WEBRTC_HOST_URL : 'ws://localhost:7880';

app.listen(5000, () => {
  console.log('LiveKit Server running on 5000!');
  console.log(`WebRTC host -> ${WEBRTC_HOST}`);
});

const { MongoClient } = require('mongodb');
let livekit;

const mongoMain = async () => {
  const uri = MONGODB_CONN_STR;
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db('livekit');
    livekit = db.collection('livekit');
  } catch (err) {}
};

mongoMain().catch(console.error);

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

app.post('/e2e_test/register', (req, res) => {
  try {
    const { name } = req.body;
    const tokenProducer = createAccessToken(`${name}-producer`, name, false);
    const tokenConsumer = createAccessToken(`${name}-consumer`, name, true);

    res.status(200).send({
      producer: tokenProducer,
      consumer: tokenConsumer,
    });
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.post('/e2e_test/results', async (req, res) => {
  try {
    const stats = req.body;
    const datum = await livekit.insertOne(stats);
    res.status(200).send(datum);
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
