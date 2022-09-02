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
import { Check, Close, Error, Loop, CheckCircle } from '@mui/icons-material';

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
        <>
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
        </>
    );
};

interface ParticipantTileProps {
    participant: Participant;
    roomDisconnect: () => void;
    testState: TestState;
    setTestState: React.Dispatch<React.SetStateAction<TestState>>;
    dataAnalytics: DataAnalytics;
    setDataAnalytics: React.Dispatch<React.SetStateAction<DataAnalytics>>;
}

const ParticipantTile = (props: ParticipantTileProps): React.ReactElement | null => {
    const {
        participant,
        roomDisconnect,
        testState,
        setTestState,
        dataAnalytics,
        setDataAnalytics,
    } = props;
    const [track, setTrack] = useState<Track>();

    const { cameraPublication, isLocal } = useParticipant(participant);

    useEffect(() => {
        if (track && !isLocal) {
            let interval: NodeJS.Timer;
            setTimeout(() => {
                interval = setInterval(() => {
                    let total = 0;
                    participant.tracks.forEach((pub) => {
                        if (pub.track instanceof LocalTrack || pub.track instanceof RemoteTrack) {
                            total += pub.track.currentBitrate;
                        }
                    });
                    setDataAnalytics(({ dataConsumed, timeElapsed }: DataAnalytics) => ({
                        dataConsumed: dataConsumed + total,
                        timeElapsed: timeElapsed + 1,
                    }));
                }, 1000);
                setTestState(TestState.Ongoing);
            }, 3000);

            setTimeout(() => {
                setTestState(TestState.Completed);
                roomDisconnect();
                clearInterval(interval);
            }, 14_000);
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
                width='400px'
                height='300px'
            />
            <Box sx={{ position: 'absolute', display: 'flex' }}>
                {testState === TestState.Ongoing && (
                    <CircularProgressWithLabel value={dataAnalytics.timeElapsed * 10} />
                )}
                {testState === TestState.Starting && <Loop fontSize='large' color='primary' />}
            </Box>
        </Box>
    );
};

enum TestState {
    Starting,
    Ongoing,
    Completed,
    Error,
}

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
    const [testState, setTestState] = useState<TestState>(TestState.Starting);

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

    const handleProdRoomConnected = async (room: Room) => {
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
        }
    };

    const handleSubmitResults = (success: boolean) => {
        navigate('/thanks');
        submitResults(success, testAnalytics);
    };

    const icon =
        testState === TestState.Starting ? (
            <Loop fontSize='large' />
        ) : testState === TestState.Completed ? (
            <CheckCircle fontSize='large' />
        ) : (
            <Error fontSize='large' />
        );

    const color =
        testState === TestState.Starting
            ? 'primary'
            : testState === TestState.Completed
            ? 'success'
            : 'error';

    const connectProducerAndConsumer = async () => {
        try {
            const roomProd = await roomStateProducer.connect(config.webRtcUrl, producer);
            if (roomProd) {
                console.log('Producer Room Connected');
                await handleProdRoomConnected(roomProd);

                const roomCons = await roomStateConsumer.connect(config.webRtcUrl, consumer);
                if (roomCons) {
                    console.log('Consumer Room Connected');
                } else {
                    throw 'Error: Consumer Room -> Not available';
                }
            } else {
                throw 'Error: Producer Room -> Not available';
            }
        } catch (err) {
            setTestState(TestState.Error);
            console.error(err);
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
                        color={color}
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
                                testState={testState}
                                setTestState={setTestState}
                                dataAnalytics={testAnalytics}
                                setDataAnalytics={setTestAnalytics}
                            />
                        ))}
                    </>
                )}
            </Box>
            {(testState === TestState.Completed || testState === TestState.Error) && (
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
