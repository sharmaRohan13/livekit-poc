import { useState } from 'react';
import axios from 'axios';

import { Room, createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';
import { LiveKitRoom, VideoRenderer } from '@livekit/react-components';

import { webRtcUrl, webServerUrl } from '../urls';

export const Participant = () => {
    const [name, setName] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [localTrack, setLocalTrack] = useState<LocalVideoTrack>();

    const getAccessToken = async () => {
        const { data } = await axios.post<string>(
            `${webServerUrl}/participant/register`,
            {
                name,
            }
        );

        setToken(data);
    };

    const handleConnected = async (room: Room) => {
        const track: LocalVideoTrack = await createLocalVideoTrack();
        setLocalTrack(track);
        room.localParticipant.publishTrack(track, { simulcast: true });
    };

    const CustomStageView = () => {
        return localTrack ? (
            <div className="local-camera-feed">
                <VideoRenderer
                    track={localTrack!}
                    isLocal
                    width="240px"
                    height="135px"
                />
            </div>
        ) : (
            <div>Loading...</div>
        );
    };

    return token ? (
        <div className="participant-screen">
            <h1>{`Welcome ${name} to IECO`}</h1>
            <LiveKitRoom
                url={webRtcUrl}
                token={token}
                stageRenderer={CustomStageView}
                onConnected={handleConnected}
            />
        </div>
    ) : (
        <>
            <h2>Participant Register</h2>
            <div>
                <label htmlFor="name">Enter Name</label>
                <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button onClick={getAccessToken}>get token</button>
            </div>
        </>
    );
};
