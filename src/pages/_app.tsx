import '../app/globals.css';
import { NextPage } from 'next';
import { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';
import styles from './App.module.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, setToken, setRole, fetchUserInfo, setupAxiosDefaults, AppDispatch, RootState, loginUser, setModalOpen } from '../store';
import { fetchTeamInfo } from '../store';
import { Button, Input } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type AppPropsWithLayout = AppProps & {
  Component: NextPage & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
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
      setErrorMessage(error || 'An unknown error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Gajkesari</h2>
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

const CreateDailyPricingModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [newBrand, setNewBrand] = useState({
    brandName: 'Gajkesari',
    price: '',
    city: '',
   
    employeeDto: { id: 86 }
  });
  const isModalOpen = useSelector((state: RootState) => state.auth.isModalOpen);
  const token = useSelector((state: RootState) => state.auth.token);

  const handleCreateBrand = async () => {
    const newBrandData = {
      ...newBrand,
      price: parseFloat(newBrand.price),
    };

    try {
      const response = await fetch('http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/brand/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBrandData),
      });

      if (response.ok) {
        dispatch(setModalOpen(false));
        setNewBrand({
          brandName: 'Gajkesari',
          price: '',
          city: '',
         
          employeeDto: { id: 86 }
        });
      } else {
        console.error('Error creating brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(isOpen) => dispatch(setModalOpen(isOpen))}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Pricing</DialogTitle>
          <DialogDescription className="mt-2">
            Daily Pricing for today has not been created. Please fill out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brandName" className="text-right">
              Brand Name
            </Label>
            <Input
              id="brandName"
              value={newBrand.brandName}
              disabled
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              value={newBrand.price}
              onChange={(e) => setNewBrand({ ...newBrand, price: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input
              id="city"
              value={newBrand.city}
              onChange={(e) => setNewBrand({ ...newBrand, city: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button htmlType="submit" onClick={handleCreateBrand}>

            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <Provider store={store}>
      <AuthWrapper>
        <CreateDailyPricingModal />
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
