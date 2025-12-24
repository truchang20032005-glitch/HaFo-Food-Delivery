import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

export default api;