import { useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

const handleSSOLogin = ({ ssoUrl, ssoCbUrl, apiKey, formHash }: { [key: string]: string }) => {
    const buildHiddenInput = (name: string, value: string): HTMLInputElement => {
        const hiddenInput = document.createElement('input');
        hiddenInput.setAttribute('type', 'hidden');
        hiddenInput.setAttribute('name', name);
        hiddenInput.setAttribute('value', value);

        return hiddenInput;
    };

    const hiddenForm = document.createElement('form');
    hiddenForm.setAttribute('type', 'hidden');
    hiddenForm.setAttribute('action', ssoUrl);
    hiddenForm.setAttribute('method', 'post');

    hiddenForm.appendChild(
        buildHiddenInput('request_url', `${window.location.origin}/livekit/login`)
    );
    hiddenForm.appendChild(buildHiddenInput('callback_url', `${ssoCbUrl}/livekit/sso/callback`));
    hiddenForm.appendChild(buildHiddenInput('api_key', apiKey));
    hiddenForm.appendChild(buildHiddenInput('hash_value', formHash));
    hiddenForm.appendChild(buildHiddenInput('legal_entity', 'IFINC'));
    hiddenForm.appendChild(buildHiddenInput('force_consent', '1'));
    hiddenForm.appendChild(buildHiddenInput('action', '0'));

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();
    hiddenForm.remove();
};

interface jwtPayload {
    exp: number;
    iat: number;
    iss: string;
    sub: string;
}

const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload) as jwtPayload;
};

export const getToken = (): string => localStorage.getItem('token') || '';
export const getUid = (): string => localStorage.getItem('uid') || '';

export const useLogout = () => {
    const navigate = useNavigate();

    return () => {
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
        navigate('/');
    };
};

export const useAuth = () => {
    const token = getToken();
    const logout = useLogout();
    let isAuth = true;

    if (token) {
        const parsedJwt = parseJwt(token);
        const now = Math.round(new Date().getTime() / 1000);
        if (parsedJwt.exp < now) {
            isAuth = false;
            logout();
        }
    } else {
        isAuth = false;
    }

    return isAuth;
};

export const AuthRoute = () => {
    const isAuth = useAuth();

    return isAuth ? <Outlet /> : <Navigate to='/' />;
};

interface Props {
    ssoUrl: string;
    ssoCbUrl: string;
    apiKey: string;
    formHash: string;
    onLoginComplete: (uid: string, token: string) => void;
}

export const Login: React.FC<Props> = ({ ssoUrl, ssoCbUrl, apiKey, formHash, onLoginComplete }) => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const uid = params.get('uid');
        const token = params.get('token');

        if (uid && token) {
            localStorage.setItem('uid', uid);
            localStorage.setItem('token', token);
            navigate('/');
            onLoginComplete(uid, token);
        } else {
            handleSSOLogin({ ssoUrl, ssoCbUrl, apiKey, formHash });
        }
    }, []);

    return <></>;
};
