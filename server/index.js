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

app.post('/livekit/proctor/register', (req, res) => {
  try {
    const { name, room } = req.body;
    const token = createAccessToken(name, room, true);

    res.status(200).send(token);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.post('/livekit/participant/register', (req, res) => {
  try {
    const { name, room } = req.body;
    const token = createAccessToken(name, room, false);

    res.status(200).send(token);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.post('/livekit/e2e_test/register', (req, res) => {
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

app.post('/livekit/e2e_test/results', async (req, res) => {
  try {
    const stats = req.body;
    const datum = await livekit.insertOne(stats);
    res.status(200).send(datum);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.get('/livekit/rooms', async (req, res) => {
  try {
    const rooms = await svc.listRooms();

    res.status(200).send(rooms);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.post('/livekit/rooms/create', async (req, res) => {
  try {
    const options = req.body;
    const room = await svc.createRoom(options);

    res.status(200).send(room);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.post('/livekit/sso/callback', async (req, res) => {
  try {
    const api_key = '31d9c883155816d15f6f3a74dd79961b0577670ac';
    const { session_id, request_url } = req.body;

    console.log('Receive Request from SSO', req.body);

    const hmac = require('crypto').createHmac('sha256', process.env.SSO_SECRET);
    const hash = hmac
      .update(Buffer.from(JSON.stringify(session_id), 'utf-8'))
      .digest('hex');

    const encodedData = encodeURIComponent(
      JSON.stringify({
        api_key,
        session_id,
        hash_value: hash,
      })
    );

    const resp = await axios.post(
      'https://ishalogin.sadhguru.org/getlogininfo',
      `data= ${encodedData}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('SSO Response', resp.data);

    const final_redirect_url = `${extractBaseUrl(
      request_url
    )}/livekit/login?uid=${resp.data.autologin_profile_id}&token=${
      resp.data.id_token
    }`;

    console.log('Redirect URL', final_redirect_url);

    if (resp.data.unauth !== 1) {
      if (req.body.consent_grant_status === '0') {
        res.redirect(301, request_url);
      } else {
        res.redirect(301, final_redirect_url);
      }
    }
  } catch (err) {
    console.log('Error', err);
  }
});

app.get('/livekit*', function (req, res) {
  res.render('index.html', { WEBRTC_HOST });
});
