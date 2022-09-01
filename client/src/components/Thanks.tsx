import { Box, Button, Container, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { grey } from '@mui/material/colors';

import { useLogout } from './Login';
import sadhguruImg from '../assets/sadhguru.jpeg';

export const Thanks = () => {
    const logout = useLogout();

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
                        Thank you for your participation in the test.
                    </Typography>

                    <Typography
                        variant='subtitle1'
                        gutterBottom
                        sx={{
                            color: `${grey[700]}`,
                            maxWidth: '400px',
                            fontStyle: 'oblique',
                        }}
                    >
                        &quot;Volunteering is a way of learning to make our lives into a process of
                        just giving and being willing.&quot; - Sadhguru
                    </Typography>

                    <Button
                        sx={{
                            float: 'right',
                            marginTop: '50px',
                        }}
                        variant='contained'
                        endIcon={<SendIcon />}
                        color='error'
                        onClick={logout}
                    >
                        <Typography>Logout</Typography>
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};
