import axios from 'axios';

const IP_DA_MAQUINA = '192.168.10.90';

export const API_BASE = `http://${IP_DA_MAQUINA}:8080/api`;
export const WS_URL   = `ws://${IP_DA_MAQUINA}:8080/ws`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});