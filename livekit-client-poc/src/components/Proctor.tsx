import { useState, useEffect } from 'react';
import axios from 'axios';

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

import { Room, Participant, LocalTrack, RemoteTrack } from 'livekit-client';
import {
    LiveKitRoom,
    VideoRenderer,
    useParticipant,
    StageProps,
} from '@livekit/react-components';

import { webRtcUrl, webServerUrl } from '../urls';

export const Proctor = () => {
    const [token, setToken] = useState<string>('');
    const [roomNo, setRoomNo] = useState('');

    const handleConnect = async () => {
        const { data } = await axios.post<string>(
            `${webServerUrl}/proctor/register`,
            {
                name: `proc_${roomNo}`,
                room: `room_${roomNo}`,
            }
        );
        setToken(data);
    };

    const handleConnected = async (room: Room) => {
        console.log('connected to room', room);
    };

    interface Props {
        participant: Participant;
        room: Room;
    }

    const ParticipantTile = (props: Props): React.ReactElement | null => {
        const [currentBitrate, setCurrentBitrate] = useState<number>(0);
        const { participant } = props;
        const { cameraPublication, isLocal } = useParticipant(participant);

        useEffect(() => {
            const interval = setInterval(() => {
                let total = 0;
                participant.tracks.forEach((pub) => {
                    if (
                        pub.track instanceof LocalTrack ||
                        pub.track instanceof RemoteTrack
                    ) {
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
                        fontSize="small"
                    />
                    {renderLoading ? (
                        <IconButton
                            size="small"
                            sx={{
                                border: '2px solid',
                                marginBottom: '10px',
                            }}
                        >
                            <Loop fontSize="inherit" />
                        </IconButton>
                    ) : (
                        <VideoRenderer
                            track={cameraPublication.track!}
                            isLocal={false}
                            width="100%"
                            height="100%"
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
                            component="span"
                            sx={{
                                color: 'white',
                            }}
                        >
                            <Typography variant="body2">
                                &nbsp;
                                {Math.round(currentBitrate / 1024)} kbps
                            </Typography>
                        </Box>
                        <Box
                            component="span"
                            sx={{
                                position: 'absolute',
                                color: 'white',
                                right: '5px',
                            }}
                        >
                            <Typography variant="body2">
                                {participant.metadata}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Grid>
        );
    };

    const CustomStageView = ({ roomState }: StageProps): React.ReactElement => {
        const { room, participants, isConnecting, error } = roomState;

        if (isConnecting) {
            return <Typography variant="h6">Connecting...</Typography>;
        }
        if (error) {
            return (
                <Typography color="error" variant="h6">
                    Error: {error.message}
                </Typography>
            );
        }
        if (!room) {
            return (
                <Typography color="error" variant="h6">
                    Room Closed
                </Typography>
            );
        }

        return (
            <Box sx={{ flexGrow: 1 }}>
                <Grid m="20px" container spacing={2}>
                    {participants.map((ppt) => (
                        <ParticipantTile participant={ppt} room={room} />
                    ))}
                </Grid>
            </Box>
        );
    };

    return (
        <Container
            sx={{
                marginTop: '100px',
            }}
        >
            <Box m="auto">
                <Typography variant="h4">Proctor Room</Typography>
                <FormControl
                    size="small"
                    required
                    sx={{ m: 1, minWidth: 120, color: '#fff' }}
                >
                    <InputLabel id="select-room">Room</InputLabel>
                    <Select
                        labelId="select-room"
                        id="select-room"
                        value={roomNo}
                        label="Room"
                        onChange={(e) => setRoomNo(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value="1">One</MenuItem>
                        <MenuItem value="2">Two</MenuItem>
                        <MenuItem value="3">Three</MenuItem>
                    </Select>
                </FormControl>
                {token ? (
                    <IconButton
                        aria-label="disconnect"
                        size="small"
                        color="error"
                        onClick={() => {
                            setToken('');
                            setRoomNo('');
                        }}
                        sx={{
                            border: '2px solid',
                            margin: '12.5px',
                        }}
                    >
                        <CallEnd fontSize="inherit" />
                    </IconButton>
                ) : (
                    <IconButton
                        aria-label="connect"
                        size="small"
                        color="primary"
                        onClick={handleConnect}
                        sx={{
                            border: '2px solid',
                            margin: '12.5px',
                        }}
                    >
                        <PhotoCamera fontSize="inherit" />
                    </IconButton>
                )}
            </Box>

            <Box>
                {token && (
                    <LiveKitRoom
                        url={webRtcUrl}
                        token={token}
                        stageRenderer={CustomStageView}
                        onConnected={handleConnected}
                    />
                )}
            </Box>
        </Container>
    );
};
