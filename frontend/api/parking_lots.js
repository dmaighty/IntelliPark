import { API_BASE } from './client';

export async function getParkingLots() {
    try {
        const response = await fetch(`${API_BASE}/parking/lots`);
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}