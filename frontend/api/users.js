import API_BASE from './client';

export async function getUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`);
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getMyProfile() {
    try {
        const response = await fetch(`${API_BASE}/users/me/profile`);
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
