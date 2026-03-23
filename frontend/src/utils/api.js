/**
 * API helper — communicates with FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const data = await response.json();
                errorMessage = data.detail || errorMessage;
            } catch {
                // response wasn't JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error(`API Error [${path}]: Server ulanmagan yoki CORS xatosi`);
            throw new Error('Serverga ulanib bo\'lmadi. Iltimos, keyinroq urinib ko\'ring.');
        }
        console.error(`API Error [${path}]:`, error);
        throw error;
    }
}

// ─── User Endpoints ────────────────────
export async function initUser(userData) {
    return request('/users/init', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function getUser(telegramId) {
    return request(`/users/${telegramId}`);
}

export async function getUserBio(telegramId) {
    return request(`/users/${telegramId}/bio`);
}

export async function grantSearches(targetUserId, searchCount) {
    return request('/users/grant', {
        method: 'POST',
        body: JSON.stringify({
            target_user_id: targetUserId,
            search_count: searchCount,
        }),
    });
}

// ─── Search Endpoints ──────────────────
export async function searchUsername(username, telegramId) {
    return request('/search/', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            telegram_id: telegramId,
        }),
    });
}

export async function getSearchHistory(telegramId) {
    return request(`/search/history/${telegramId}`);
}

// ─── Tariff Endpoints ──────────────────
export async function getTariffs() {
    return request('/tariffs/');
}

// ─── Payment Endpoints ────────────────
export async function createInvoice(telegramId, tariffId) {
    return request('/payments/invoice', {
        method: 'POST',
        body: JSON.stringify({
            telegram_id: telegramId,
            tariff_id: tariffId,
        }),
    });
}

export async function confirmPayment(telegramId, tariffId, paymentId, starsAmount) {
    return request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
            telegram_id: telegramId,
            tariff_id: tariffId,
            payment_id: paymentId,
            stars_amount: starsAmount,
        }),
    });
}

// ─── Admin Endpoints ──────────────────
export async function getAdminStats(adminId) {
    return request(`/users/admin/stats?admin_id=${adminId}`);
}

export async function getAllUsers(adminId) {
    return request(`/users/admin/all-users?admin_id=${adminId}`);
}

export async function getAllSearchHistory(adminId) {
    return request(`/search/history/all?admin_id=${adminId}`);
}

export async function getAllTariffs(adminId) {
    return request(`/tariffs/admin/all?admin_id=${adminId}`);
}

export async function createTariff(adminId, tariffData) {
    return request(`/tariffs/?admin_id=${adminId}`, {
        method: 'POST',
        body: JSON.stringify(tariffData),
    });
}

export async function updateTariff(adminId, tariffId, tariffData) {
    return request(`/tariffs/${tariffId}?admin_id=${adminId}`, {
        method: 'PUT',
        body: JSON.stringify(tariffData),
    });
}

export async function deleteTariff(adminId, tariffId) {
    return request(`/tariffs/${tariffId}?admin_id=${adminId}`, {
        method: 'DELETE',
    });
}
