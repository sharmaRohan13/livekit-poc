import { useState } from 'react';
import axios from 'axios';
import { Room, createLocalVideoTrack, LocalVideoTrack, VideoPresets43 } from 'livekit-client';
import { LiveKitRoom, StageProps } from '@livekit/react-components';
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
import { PhotoCamera, CallEnd, Loop } from '@mui/icons-material';

import config from '../config';

interface CustomStageViewProps {
    stageProps: StageProps;
    tracks: Map<string, LocalVideoTrack>;
    closeView: () => void;
}

const CustomStageView: React.FC<CustomStageViewProps> = ({ stageProps, tracks, closeView }) => {
    const sid = stageProps?.roomState?.room?.localParticipant?.sid;
    const localTrack = tracks.get(sid!);

    if (!localTrack) {
        return (
            <IconButton
                size='small'
                sx={{
                    border: '2px solid',
                    marginBottom: '10px',
                }}
            >
                <Loop fontSize='inherit' />
            </IconButton>
        );
    }

    return (
        <IconButton
            aria-label='disconnect'
            size='small'
            color='error'
            onClick={() => {
                stageProps?.roomState?.room?.disconnect();
                tracks.delete(sid!);
                closeView();
            }}
            sx={{
                border: '2px solid',
                marginBottom: '10px',
            }}
        >
            <CallEnd fontSize='inherit' />
        </IconButton>
    );
};

interface RenderRoomProps {
    tracks: Map<string, LocalVideoTrack>;
    seatNo: string;
    roomNo: string;
}

const RenderRoom: React.FC<RenderRoomProps> = ({ tracks, seatNo, roomNo }) => {
    const [connected, setConnected] = useState(false);
    const [token, setToken] = useState('');

    const handleActivate = async () => {
        const { data } = await axios.post<string>(`${config.baseApiUrl}/participant/register`, {
            name: `part_${seatNo}`,
            room: `room_${roomNo}`,
        });

        setToken(data);
        setConnected(true);
    };

    const handleConnected = async (room: Room) => {
        const track: LocalVideoTrack = await createLocalVideoTrack({
            resolution: VideoPresets43.h480.resolution,
        });
        room.localParticipant.publishTrack(track, {
            simulcast: false,
            videoEncoding: VideoPresets43.h480.encoding,
        });

        const { sid } = room.localParticipant;
        tracks.set(sid, track);
    };

    return (
        <Box
            sx={{
                backgroundColor: 'darkgray',
                boxShadow: '0px 5px 10px 0px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'end',
                width: '175px',
                height: '100px',
            }}
        >
            {connected ? (
                <>
                    <LiveKitRoom
                        url={config.webRtcUrl}
                        token={token}
                        stageRenderer={(stageProps: StageProps) => (
                            <CustomStageView
                                stageProps={stageProps}
                                tracks={tracks}
                                closeView={() => setConnected(false)}
                            />
                        )}
                        onConnected={handleConnected}
                        roomOptions={{
                            videoCaptureDefaults: {
                                resolution: VideoPresets43.h480.resolution,
                            },
                        }}
                    />
                </>
            ) : (
                <IconButton
                    aria-label='connect'
                    size='small'
                    color='primary'
                    onClick={handleActivate}
                    sx={{
                        border: '2px solid',
                        marginBottom: '10px',
                    }}
                >
                    <PhotoCamera fontSize='inherit' />
                </IconButton>
            )}
        </Box>
    );
};

export const LoadTesting = () => {
    const tracks: Map<string, LocalVideoTrack> = new Map();
    const [roomNo, setRoomNo] = useState('');

    return (
        <Container
            sx={{
                marginTop: '100px',
            }}
        >
            <Box m='auto'>
                <Typography variant='h4'>Load Testing</Typography>
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
            </Box>

            <Box sx={{ flexGrow: 1 }}>
                <Grid m='20px' container spacing={2}>
                    {Array.from(Array(24)).map((_, idx) => (
                        <Grid item lg={2} md={3} xs={6} key={idx}>
                            <RenderRoom
                                key={idx}
                                tracks={tracks}
                                seatNo={String(idx + 1)}
                                roomNo={roomNo}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );
};
