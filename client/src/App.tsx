import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
} from 'react-router-dom';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';

import { Proctor } from './components/Proctor';
import { LoadTesting } from './components/LoadTesting';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <Box>
            <AppBar
                component="nav"
                sx={{
                    backgroundColor: '#c62828',
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            display: { xs: 'none', sm: 'block' },
                        }}
                    >
                        WebRTC
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button
                            sx={{ color: '#fff' }}
                            onClick={() => navigate('proc')}
                        >
                            Proctor
                        </Button>
                        <Button
                            sx={{ color: '#fff' }}
                            onClick={() => navigate('load')}
                        >
                            Load Testing
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="proc" element={<Proctor />} />
                <Route path="load" element={<LoadTesting />} />
            </Routes>
            <Navbar />
        </Router>
    );
};

export default App;
