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
    ssoUrl: 'https://uat-sso.isha.in',
    ssoCallBackUrl: 'https://ieco-api.isha.dev',
    formHash: '2048ce0bbda92f5f25f3bc310ea0ac00ab1b87a6b6fe1eb0532a903d1ef5f148',
    apiKey: '31d9c883155816d15f6f3a74dd79961b0577670ac',
};

export default config;
