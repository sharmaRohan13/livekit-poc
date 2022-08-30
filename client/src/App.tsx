import { useState } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useNavigate } from 'react-router-dom';

import axios from 'axios';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import { Home } from './components/Home';
import { Proctor } from './components/Proctor';
import { LoadTesting } from './components/LoadTesting';
import { Test } from './components/Test';
import { Thanks } from './components/Thanks';
import { AuthRoute, Login, useAuth, useLogout } from './components/Login';

import config from './config';

const fetchToken = async (uid: string) => {
    const tokenUrl = `${config.baseApiUrl}/e2e_test/register`;
    const { data } = await axios.post<Token>(tokenUrl, {
        name: uid,
    });

    return data;
};

const Navbar = () => {
    const navigate = useNavigate();
    const logout = useLogout();
    const isAuth = useAuth();

    return (
        <Box>
            <AppBar
                component='nav'
                sx={{
                    backgroundColor: '#c62828',
                }}
            >
                <Toolbar>
                    <Typography
                        variant='h6'
                        component='div'
                        onClick={() => navigate('/')}
                        sx={{
                            flexGrow: 1,
                            display: { xs: 'none', sm: 'block' },
                            cursor: 'pointer',
                        }}
                    >
                        WebRTC
                    </Typography>
                    {isAuth ? (
                        <Box>
                            {/* <Button
                                sx={{ color: '#fff' }}
                                onClick={() => navigate('/proc')}
                            >
                                Proctor
                            </Button>
                            <Button
                                sx={{ color: '#fff' }}
                                onClick={() => navigate('/load')}
                            >
                                Load Testing
                            </Button> */}

                            <Button
                                variant='outlined'
                                size='small'
                                onClick={() => logout()}
                                color='inherit'
                                sx={{ ml: 3 }}
                                endIcon={<LogoutIcon />}
                            >
                                Logout
                            </Button>
                        </Box>
                    ) : (
                        <Button
                            variant='outlined'
                            size='small'
                            onClick={() => navigate('/login')}
                            color='inherit'
                            sx={{ ml: 3 }}
                            endIcon={<LoginIcon />}
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
};

interface Token {
    producer: string;
    consumer: string;
}

const RouteContainer = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState<Token>({
        producer: '',
        consumer: '',
    });

    const startLoginTest = async (uid: string) => {
        const token = await fetchToken(uid);

        setToken(token);
        navigate('/test');
    };

    return (
        <Routes>
            <Route element={<AuthRoute />}>
                <Route path='proc' element={<Proctor />} />
                <Route path='load' element={<LoadTesting />} />
                <Route path='test' element={<Test token={token} />} />
                <Route path='thanks' element={<Thanks />} />
            </Route>
            <Route
                path='login'
                element={
                    <Login
                        ssoUrl={config.ssoUrl}
                        ssoCbUrl={config.ssoCallBackUrl}
                        apiKey={config.apiKey}
                        formHash={config.formHash}
                        onLoginComplete={(uid: string) => startLoginTest(uid)}
                    />
                }
            />

            <Route path='' element={<Home getToken={startLoginTest} />} />
            <Route path='*' element={<Navigate to='/' />} />
        </Routes>
    );
};

const App = () => {
    console.log(process.env.PUBLIC_URL);
    return (
        <div className='main'>
            <Router>
                <Navbar />
                <RouteContainer />
            </Router>
        </div>
    );
};

export default App;
