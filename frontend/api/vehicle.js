import { API_BASE } from './client';

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

export async function getMyVehicles(accessToken) {
    try {
        const response = await fetch(`${API_BASE}/users/me/vehicles`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
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

export async function createMyVehicle(accessToken, vehicle) {
    const response = await fetch(`${API_BASE}/users/me/vehicles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            license_plate: vehicle.licensePlate,
            make: vehicle.make || null,
            model: vehicle.model || null,
            color: vehicle.color || null,
            year: vehicle.year || null,
            title: vehicle.title || null,
            color_id: vehicle.colorId || null,
            image_url: null,
            parked_latitude: vehicle.parkedLocation?.latitude ?? null,
            parked_longitude: vehicle.parkedLocation?.longitude ?? null,
        }),
    });
    return response.json();
}