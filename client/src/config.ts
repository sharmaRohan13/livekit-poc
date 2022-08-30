declare global {
    interface Window {
        WEBRTC_HOST: string;
    }
}

const config = {
    baseApiUrl: 'http://localhost:5000',
    webRtcUrl: process.env.NODE_ENV === 'development' ? 'ws://localhost:7880' : window.WEBRTC_HOST,
    ssoUrl: 'https://uat-sso.isha.in',
    ssoCallBackUrl: 'https://ieco-api.isha.dev',
    formHash: '40b69d2784f5c8748ce6f662da34c57f82e6b841f795cb74642e64e160fd96b0',
    apiKey: '31d9c883155816d15f6f3a74dd79961b0577670ac',
};

export default config;
