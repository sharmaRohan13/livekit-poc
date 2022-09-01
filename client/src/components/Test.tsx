import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useParticipant, useRoom, VideoRenderer } from '@livekit/react-core';
import {
    Participant,
    Room,
    RoomOptions,
    LocalTrack,
    RemoteTrack,
    Track,
    createLocalVideoTrack,
    LocalVideoTrack,
    VideoPresets43,
    ConnectionState,
} from 'livekit-client';

import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Check, Circle, Close, Loop, CheckCircle } from '@mui/icons-material';

import { getUid } from './Login';
import config from '../config';

interface DataAnalytics {
    dataConsumed: number;
    timeElapsed: number;
}

const submitResults = (success: boolean, { dataConsumed, timeElapsed }: DataAnalytics) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, version, os, description } = require('platform');
    const resultObj = {
        success,
        avgBitrate: Math.round(dataConsumed / (timeElapsed * 1000)),
        ssoId: getUid(),
        browser: `${name} ${version}`,
        os: `${os.toString()}`,
        description,
    };
    axios.post(`${config.baseApiUrl}/e2e_test/results`, resultObj);
};

const CircularProgressWithLabel = (props: CircularProgressProps & { value: number }) => {
    const color = props.value === 100 ? 'success' : 'primary';

    return (
        <Box sx={{ position: 'absolute', display: 'flex' }}>
            <CircularProgress color={color} variant='determinate' size={56} {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant='h6' component='div' color='#fff'>{`${Math.round(
                    props.value
                )}%`}</Typography>
            </Box>
        </Box>
    );
};

interface ParticipantTileProps {
    participant: Participant;
    roomDisconnect: () => void;
    dataAnalytics: DataAnalytics;
    setDataAnalytics: React.Dispatch<React.SetStateAction<DataAnalytics>>;
}

const ParticipantTile = (props: ParticipantTileProps): React.ReactElement | null => {
    const [currentBitrate, setCurrentBitrate] = useState<number>(0);
    const { participant, roomDisconnect, dataAnalytics, setDataAnalytics } = props;
    const [track, setTrack] = useState<Track>();

    const { cameraPublication, isLocal } = useParticipant(participant);

    useEffect(() => {
        if (track && !isLocal) {
            const interval = setInterval(() => {
                let total = 0;
                participant.tracks.forEach((pub) => {
                    if (pub.track instanceof LocalTrack || pub.track instanceof RemoteTrack) {
                        total += pub.track.currentBitrate;
                    }
                });
                setCurrentBitrate(total);
                setDataAnalytics(({ dataConsumed, timeElapsed }: DataAnalytics) => ({
                    dataConsumed: dataConsumed + total,
                    timeElapsed: timeElapsed + 1,
                }));
            }, 1000);

            setTimeout(() => {
                roomDisconnect();
                clearInterval(interval);
            }, 20_000);
        }
    }, [track]);

    if (
        !cameraPublication ||
        !cameraPublication.isSubscribed ||
        !cameraPublication.track ||
        cameraPublication.isMuted
    )
        return null;
    else {
        if (!track) {
            setTrack(cameraPublication.track);
        }
    }

    const color = (Math.round(currentBitrate / 1024) / 300) * 255;

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <VideoRenderer
                track={cameraPublication.track!}
                isLocal={false}
                width='100%'
                height='100%'
            />
            <Box
                sx={{
                    display: 'flex',
                    position: 'absolute',
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    bottom: '0',
                }}
            >
                <Box
                    component='span'
                    sx={{
                        color: 'white',
                    }}
                >
                    <Typography variant='body2'>
                        &nbsp;
                        {Math.round(currentBitrate / 1024)} kbps
                    </Typography>
                </Box>
                <Box
                    component='span'
                    sx={{
                        position: 'absolute',
                        color: 'white',
                        right: '5px',
                    }}
                >
                    <Typography variant='body2'>{participant.metadata}</Typography>
                </Box>
            </Box>
            <Circle
                sx={{
                    color: `rgb(${255 - color}, ${color}, 0)`,
                    position: 'absolute',
                    top: ' 5px',
                    right: '5px',
                }}
                fontSize='small'
            />
            <CircularProgressWithLabel value={dataAnalytics.timeElapsed * 5} />
        </Box>
    );
};

interface Props {
    token: {
        producer: string;
        consumer: string;
    };
}

export const Test: React.FC<Props> = ({ token }) => {
    const { producer, consumer } = token;
    const navigate = useNavigate();
    const [testAnalytics, setTestAnalytics] = useState<DataAnalytics>({
        dataConsumed: 0,
        timeElapsed: 0,
    });
    const [testComplete, setTestComplete] = useState(false);

    const roomOptions: RoomOptions = {
        adaptiveStream: false,
        videoCaptureDefaults: {
            resolution: VideoPresets43.h480.resolution,
        },
        publishDefaults: {
            videoEncoding: VideoPresets43.h480.encoding,
            simulcast: false,
        },
    };
    const roomStateProducer = useRoom(roomOptions);
    const roomStateConsumer = useRoom(roomOptions);

    const handleRoomConnected = async (room: Room) => {
        const track: LocalVideoTrack = await createLocalVideoTrack({
            resolution: VideoPresets43.h480.resolution,
        });
        room.localParticipant.publishTrack(track, {
            videoEncoding: VideoPresets43.h480.encoding,
            simulcast: false,
        });
    };

    const roomDisconnect = () => {
        if (roomStateProducer.room && roomStateConsumer.room) {
            roomStateProducer.room.disconnect();
            roomStateConsumer.room.disconnect();
            setTestComplete(true);
        }
    };

    const handleSubmitResults = (success: boolean) => {
        navigate('/thanks');
        submitResults(success, testAnalytics);
    };

    const icon = testComplete ? <CheckCircle fontSize='large' /> : <Loop fontSize='large' />;

    const connectProducerAndConsumer = async () => {
        try {
            const room = await roomStateProducer.connect(config.webRtcUrl, producer);
            if (room) {
                await handleRoomConnected(room);
                roomStateConsumer.connect(config.webRtcUrl, consumer);
            }
        } catch (err) {
            console.log(err);
            setTestComplete(true);
        }
    };

    useEffect(() => {
        if (!(producer && consumer)) {
            navigate('/');
        }
        connectProducerAndConsumer();
    }, []);

    return (
        <Box
            sx={{
                marginTop: '150px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    backgroundColor: 'darkgray',
                    boxShadow: '0px 5px 10px 0px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'end',
                    width: '400px',
                    height: '300px',
                }}
            >
                {roomStateConsumer.connectionState !== ConnectionState.Connected ? (
                    <IconButton
                        size='small'
                        color={testComplete ? 'success' : 'primary'}
                        sx={{
                            marginBottom: '10px',
                        }}
                    >
                        {icon}
                    </IconButton>
                ) : (
                    <>
                        {roomStateConsumer.participants.map((ppt) => (
                            <ParticipantTile
                                key={ppt.sid}
                                participant={ppt}
                                roomDisconnect={roomDisconnect}
                                dataAnalytics={testAnalytics}
                                setDataAnalytics={setTestAnalytics}
                            />
                        ))}
                    </>
                )}
            </Box>
            {testComplete && (
                <Box
                    sx={{
                        textAlign: 'center',
                        margin: '30px',
                    }}
                >
                    <Typography variant='h4' color='success'>
                        Test Complete !!
                    </Typography>
                    <Typography variant='h5' color='success'>
                        Were you able to see your video ?
                    </Typography>
                    <Box
                        sx={{
                            marginTop: '30px',
                            display: 'flex',
                            justifyContent: 'space-around',
                        }}
                    >
                        <Button
                            variant='contained'
                            color='error'
                            endIcon={<Close />}
                            onClick={() => handleSubmitResults(false)}
                        >
                            No
                        </Button>
                        <Button
                            variant='contained'
                            color='success'
                            endIcon={<Check />}
                            onClick={() => handleSubmitResults(true)}
                        >
                            Yes
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};
