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
    formHash: '212c0c179cee895f7cfb9ccbbf136c365f8fae0fe2847fee8d52ea11548d5860',
    apiKey: '31d9c883155816d15f6f3a74dd79961b0577670ac',
};

export default config;
