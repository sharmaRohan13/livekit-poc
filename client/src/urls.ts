declare global {
    interface Window { WEBRTC_HOST: any; }
}

const urls = {
    webRtc:
        process.env.NODE_ENV === 'development' ? 'ws://localhost:7880' : window.WEBRTC_HOST,
    webServer: 'http://localhost:5000',
};

export default urls;
