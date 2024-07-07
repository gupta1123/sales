import '../app/globals.css';
import { NextPage } from 'next';
import { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';
import styles from './App.module.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, setToken, setRole, fetchUserInfo, setupAxiosDefaults, AppDispatch, RootState, loginUser } from '../store'; // Added loginUser import
import { fetchTeamInfo } from '../store';
import React, { ReactNode, useEffect, useState } from 'react'; // Add useState import
import { useRouter } from 'next/router';

const Card = ({ children }: { children: ReactNode }) => (
  <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">{children}</div>
);

const Input = ({ type, id, placeholder, value, onChange }: {
  type: string;
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <input
    type={type}
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    autoComplete="off"
    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
  />
);

const Button = ({ children, className, onClick, disabled }: {
  children: ReactNode;
  className?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) => (
  <button
    className={`${className} w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Typography = {
  Title: ({ level, children }: { level: number; children: ReactNode }) => (
    <h2 className="text-3xl font-bold mb-6 text-black">{children}</h2>
  ),
  Text: ({ className, children }: { className?: string; children: ReactNode }) => (
    <p className={`${className} text-gray-600`}>{children}</p>
  ),
};

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authStatus = useSelector((state: RootState) => state.auth.status);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const result = await dispatch(loginUser({ username, password })).unwrap();
      if (result.token) {
        router.push('/Dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'An unknown error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-black">Gajkesari</h2>
          <img src="/GajkesariLogo.jpeg" alt="Gajkesari Logo" className="mx-auto mb-6" style={{ maxWidth: '200px' }} />
          {errorMessage && <p className="text-center mb-4 text-red-500">{errorMessage}</p>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="text"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="mb-6 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
            <button
              className={`w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${authStatus === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => handleLogin(e)}
              disabled={authStatus === 'loading'}
            >
              {authStatus === 'loading' ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

type AppPropsWithLayout = AppProps & {
  Component: NextPage & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <Provider store={store}>
      <AuthWrapper>
        <div className={styles.appContainer}>
          <Sidebar />
          <main className={styles.mainContent}>{getLayout(<Component {...pageProps} />)}</main>
        </div>
      </AuthWrapper>
    </Provider>
  );
}

const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const username = useSelector((state: RootState) => state.auth.username);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && !token) {
      dispatch(setToken(storedToken));
      setupAxiosDefaults(storedToken);
    }

    if (storedRole && !role) {
      dispatch(setRole(storedRole as RootState['auth']['role']));
    }

    if (storedUsername && !username) {
      dispatch(fetchUserInfo(storedUsername));
    }
  }, [dispatch, token, role, username]);

  useEffect(() => {
    if (role === 'MANAGER' && employeeId && !teamId) {
      dispatch(fetchTeamInfo());
    }
  }, [dispatch, role, employeeId, teamId]);

  useEffect(() => {
    if (!token && router.pathname !== '/') {
      router.push('/');
    }
  }, [token, router]);

  if (!token) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default MyApp;
