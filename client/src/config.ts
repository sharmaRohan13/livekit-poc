declare global {
    interface Window {
        WEBRTC_HOST: string;
    }
}

const config = {
    baseApiUrl:
        process.env.NODE_ENV === 'development'
            ? 'http://localhost:5000/livekit'
            : 'https://ieco-api.isha.dev/livekit',
    webRtcUrl: process.env.NODE_ENV === 'development' ? 'ws://localhost:7880' : window.WEBRTC_HOST,
    ssoUrl: 'https://ishalogin.sadhguru.org',
    ssoCallBackUrl: 'https://ieco-api.isha.dev',
    formHash: '611ae9b0cef8e55a0c3b318f36437828c6656715ddb429ac628a29a9b8cd06ac',
    apiKey: '31d9c883155816d15f6f3a74dd79961b0577670ac',
};

export default config;
