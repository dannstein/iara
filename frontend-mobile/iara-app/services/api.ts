import axios from 'axios';

const IP_DA_MAQUINA = '192.168.10.90'; 

export const api = axios.create({
  baseURL: `http://${IP_DA_MAQUINA}:8080/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});