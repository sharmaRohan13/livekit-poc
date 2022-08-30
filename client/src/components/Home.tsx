import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Container, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { grey } from '@mui/material/colors';

import { useAuth, getUid } from './Login';
import sadhguruImg from '../assets/sadhguru.jpeg';

interface Props {
    getToken: (uid: string) => void;
}

export const Home: React.FC<Props> = ({ getToken }) => {
    const navigate = useNavigate();
    const isAuth = useAuth();
    const action = isAuth ? 'Test' : 'Login';

    const handleClick = () => {
        if (isAuth) {
            getToken(getUid());
        } else {
            navigate('/login');
        }
    };

    return (
        <Container
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: '100px',
            }}
        >
            <Box
                p='20px'
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    border: `1px solid ${grey[500]}`,
                    borderRadius: '15px',
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                    }}
                >
                    <img style={{ maxWidth: '300px' }} alt='sadhguru' src={sadhguruImg} />
                </Box>
                <Box
                    sx={{
                        margin: '30px',
                    }}
                >
                    <Typography
                        variant='h4'
                        gutterBottom
                        sx={{
                            color: `${grey[900]}`,
                        }}
                    >
                        Namaskaram
                    </Typography>

                    <Typography
                        variant='h6'
                        gutterBottom
                        sx={{
                            color: `${grey[900]}`,
                        }}
                    >
                        Welcome to Isha Live Streaming test
                    </Typography>

                    <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{
                            color: `${grey[700]}`,
                        }}
                    >
                        For this test we need your Webcam enabled
                    </Typography>

                    <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{
                            color: `${grey[700]}`,
                        }}
                    >
                        {`Press the button below to ${action}.`}
                    </Typography>

                    <Button
                        sx={{
                            float: 'right',
                            marginTop: '50px',
                        }}
                        variant='contained'
                        endIcon={<SendIcon />}
                        color='error'
                        onClick={handleClick}
                    >
                        <Typography>{action}</Typography>
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};
