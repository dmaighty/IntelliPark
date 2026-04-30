import API_BASE from './client';

export async function getVehicle(vehicleId) {
    try {
        const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`);
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getVehiclesForDriver(userId) {
    try {
        const response = await fetch(`${API_BASE}/vehicles/${userId}/vehicles`);
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateVehicle(vehicleId, updates) {
    try {
        const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createVehicle(vehicle) {
    try {
        const response = await fetch(`${API_BASE}/vehicles`, {
            method: 'POST',
            body: JSON.stringify(vehicle),
        });
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}