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
    formHash: '4d6c528c83f14ffaa3a4f36d9f0f9fda2a1507efce7f3e643e2593601956800d',
    apiKey: '31d9c883155816d15f6f3a74dd79961b0577670ac',
};

export default config;
