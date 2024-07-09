import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Interfaces
interface AuthState {
  user: null | { [key: string]: any };
  token: null | string;
  employeeId: null | number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: null | string | { [key: string]: any };
  username: null | string;
  role: "ADMIN" | "MANAGER" | "FIELD OFFICER" | "OFFICE MANAGER" | null;
  firstName: null | string;
  lastName: null | string;
  teamId: null | number;
  officeManagerId: number | null;

}

interface LoginResponse {
  role: string;
  token: string;
}

interface UserInfo {
  username: string;
  roles: string;
  employeeId: number;
  firstName: string;
  lastName: string;
}

interface TeamInfo {
  id: number;
  officeManager: {
    id: number;
    firstName: string;
    lastName: string;
    // ... other properties
  };
  fieldOfficers: any[];
}

// API Configuration
export const api = axios.create({
  baseURL: 'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081'
});

// Async Thunks
export const loginUser = createAsyncThunk<LoginResponse, { username: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ username, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/user/token', { username, password });

      if (response.data === 'Bad credentials') {
        return rejectWithValue('Invalid username or password');
      }

      if (!response.data || typeof response.data !== 'string' || !response.data.includes(' ')) {
        console.error('Unexpected response format:', response.data);
        return rejectWithValue('Unexpected response from server');
      }

      const [role, token] = response.data.split(' ');
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await dispatch(fetchUserInfo(username));

      if (role === 'MANAGER') {
        await dispatch(fetchTeamInfo());
      }

      return { role, token };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        return rejectWithValue(error.response.data || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        return rejectWithValue('No response received from server');
      } else {
        console.error('Error message:', error.message);
        return rejectWithValue(error.message || 'An unknown error occurred');
      }
    }
  }
);


export const fetchUserInfo = createAsyncThunk<UserInfo, string, { rejectValue: string }>(
  'auth/fetchUserInfo',
  async (username, { rejectWithValue }) => {
    try {
      const response = await api.get(`/user/manage/get?username=${username}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTeamInfo = createAsyncThunk<TeamInfo | null, void, { rejectValue: string }>(
  'auth/fetchTeamInfo',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const employeeId = state.auth.employeeId;
      if (!employeeId) {
        console.log('Employee ID not available, skipping team info fetch');
        return null;
      }
      const response = await api.get(`/employee/team/getbyEmployee?id=${employeeId}`);
      return response.data[0]; // Assuming the API returns an array with one item
    } catch (error: any) {
      console.error('Error fetching team info:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('teamId');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  employeeId: null,
  status: 'idle',
  error: null,
  username: null,
  role: null,
  firstName: null,
  lastName: null,
  teamId: null,
  officeManagerId: null,

};

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      api.defaults.headers.common['Authorization'] = `Bearer ${action.payload}`;
    },
    setRole: (state, action: PayloadAction<AuthState['role']>) => {
      state.role = action.payload;
    },
    resetState: (state) => {
      Object.assign(state, initialState);
      delete api.defaults.headers.common['Authorization'];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.role = action.payload.role as AuthState['role'];
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unknown error';
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.employeeId = action.payload.employeeId;
        state.username = action.payload.username;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
      })
      .addCase(fetchTeamInfo.fulfilled, (state, action) => {
        if (action.payload) {
          state.teamId = action.payload.id;
          localStorage.setItem('teamId', action.payload.id.toString());
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
      });
  },
});

// Action Creators
export const { setToken, setRole, resetState } = authSlice.actions;

// Store Configuration
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Utility Functions
export const setupAxiosDefaults = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};