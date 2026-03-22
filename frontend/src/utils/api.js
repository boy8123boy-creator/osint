/**
 * API helper — communicates with FastAPI backend
 */

const API_BASE = '/api';

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
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
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
