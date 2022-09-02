import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Room, Participant, LocalTrack, RemoteTrack } from 'livekit-client';
import {
    LiveKitRoom,
    VideoRenderer,
    useParticipant,
    StageProps,
    RoomState,
} from '@livekit/react-components';
import {
    Box,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from '@mui/material';
import { PhotoCamera, Circle, CallEnd, Loop } from '@mui/icons-material';

import config from '../config';

enum ConnectionStatus {
    Idle = 0,
    Connecting = 1,
    Connected = 2,
}

interface ParticipantTileProps {
    participant: Participant;
    room: Room;
}

const ParticipantTile = (props: ParticipantTileProps): React.ReactElement | null => {
    const [currentBitrate, setCurrentBitrate] = useState<number>(0);
    const { participant } = props;
    const { cameraPublication, isLocal } = useParticipant(participant);

    useEffect(() => {
        const interval = setInterval(() => {
            let total = 0;
            participant.tracks.forEach((pub) => {
                if (pub.track instanceof LocalTrack || pub.track instanceof RemoteTrack) {
                    total += pub.track.currentBitrate;
                }
            });
            setCurrentBitrate(total);
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    if (isLocal) {
        return null;
    }

    const renderLoading =
        !cameraPublication ||
        !cameraPublication.isSubscribed ||
        !cameraPublication.track ||
        cameraPublication.isMuted;

    const color = (Math.round(currentBitrate / 1024) / 300) * 255;

    return (
        <Grid item lg={2} md={3} xs={6}>
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Circle
                    sx={{
                        color: `rgb(${255 - color}, ${color}, 0)`,
                        position: 'absolute',
                        top: ' 5px',
                        right: '5px',
                    }}
                    fontSize='small'
                />
                {renderLoading ? (
                    <IconButton
                        size='small'
                        sx={{
                            border: '2px solid',
                            marginBottom: '10px',
                        }}
                    >
                        <Loop fontSize='inherit' />
                    </IconButton>
                ) : (
                    <VideoRenderer
                        track={cameraPublication.track!}
                        isLocal={false}
                        width='100%'
                        height='100%'
                    />
                )}

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
            </Box>
        </Grid>
    );
};

interface StageViewProps {
    roomState: RoomState;
    disconnect: boolean;
    setToken: (token: string) => void;
}

const CustomStageView = ({
    roomState,
    disconnect,
    setToken,
}: StageViewProps): React.ReactElement => {
    const { room, participants, error } = roomState;

    useEffect(() => {
        if (disconnect && room) {
            room.disconnect();
            setToken('');
        }
    }, [disconnect]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            {error ? (
                <Typography color='error' variant='h6'>
                    Error: {error.message}
                </Typography>
            ) : (
                <Grid m='20px' container spacing={2}>
                    {participants.map((ppt) => (
                        <ParticipantTile key={ppt.sid} participant={ppt} room={room!} />
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export const Proctor = () => {
    const [token, setToken] = useState<string>('');
    const [roomNo, setRoomNo] = useState('');
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.Idle);

    const handleConnect = async () => {
        const { data } = await axios.post<string>(`${config.baseApiUrl}/proctor/register`, {
            name: `proc_${roomNo}`,
            room: `room_${roomNo}`,
        });
        setToken(data);
    };

    let controlIcon: React.ReactElement;

    switch (connectionStatus) {
        case ConnectionStatus.Idle:
            controlIcon = (
                <IconButton
                    aria-label='connect'
                    size='small'
                    color='primary'
                    onClick={() => {
                        setConnectionStatus(ConnectionStatus.Connecting);
                        handleConnect();
                    }}
                    sx={{
                        border: '2px solid',
                        margin: '12.5px',
                    }}
                >
                    <PhotoCamera fontSize='inherit' />
                </IconButton>
            );
            break;

        case ConnectionStatus.Connected:
            controlIcon = (
                <IconButton
                    aria-label='disconnect'
                    size='small'
                    color='error'
                    onClick={() => {
                        setConnectionStatus(ConnectionStatus.Idle);
                        setToken('');
                        setRoomNo('');
                    }}
                    sx={{
                        border: '2px solid',
                        margin: '12.5px',
                    }}
                >
                    <CallEnd fontSize='inherit' />
                </IconButton>
            );
            break;

        default:
            controlIcon = (
                <IconButton
                    size='small'
                    sx={{
                        border: '2px solid',
                        margin: '12.5px',
                    }}
                >
                    <Loop fontSize='inherit' />
                </IconButton>
            );
    }

    return (
        <Container
            sx={{
                marginTop: '100px',
            }}
        >
            <Box m='auto'>
                <Typography variant='h4'>Proctor Room</Typography>
                <FormControl size='small' required sx={{ m: 1, minWidth: 120, color: '#fff' }}>
                    <InputLabel id='select-room'>Room</InputLabel>
                    <Select
                        labelId='select-room'
                        id='select-room'
                        value={roomNo}
                        label='Room'
                        onChange={(e) => setRoomNo(e.target.value)}
                    >
                        <MenuItem value=''>
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value='1'>One</MenuItem>
                        <MenuItem value='2'>Two</MenuItem>
                        <MenuItem value='3'>Three</MenuItem>
                    </Select>
                </FormControl>
                {controlIcon}
            </Box>

            <Box>
                {token && (
                    <LiveKitRoom
                        url={config.webRtcUrl}
                        token={token}
                        stageRenderer={({ roomState }: StageProps) => (
                            <CustomStageView
                                roomState={roomState}
                                disconnect={
                                    token !== '' && connectionStatus === ConnectionStatus.Idle
                                }
                                setToken={setToken}
                            />
                        )}
                        onConnected={() => setConnectionStatus(ConnectionStatus.Connected)}
                    />
                )}
            </Box>
        </Container>
    );
};
