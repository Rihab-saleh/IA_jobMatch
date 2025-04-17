import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/jobs',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});