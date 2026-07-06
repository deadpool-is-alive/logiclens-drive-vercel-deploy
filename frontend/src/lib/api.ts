import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'ngrok-skip-browser-warning': 'true',
    },
});

api.interceptors.request.use((config) =>{
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken'):null;
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if(error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;

            if(isRefreshing){
                return new Promise( (resolve) => {
                    refreshQueue.push(() => resolve(api(originalRequest)));
                });
            }

            isRefreshing = true;
            try{
                const refreshToken = localStorage.getItem('refreshToken');
                const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {refreshToken});

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                refreshQueue.forEach((cb) => cb());
                refreshQueue= [];

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);