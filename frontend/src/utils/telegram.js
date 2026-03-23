/**
 * Telegram WebApp SDK helpers
 */

const tg = window.Telegram?.WebApp;

export function getTelegramWebApp() {
    return tg;
}

export function getUserData() {
    if (!tg?.initDataUnsafe?.user) {
        // Dev mode fallback
        return {
            id: 0,
            first_name: 'User',
            last_name: 'User',
            username: 'user',
            photo_url: null,
            language_code: 'uz',
        };
    }
    return tg.initDataUnsafe.user;
}

export function getInitData() {
    return tg?.initData || '';
}

export function expandApp() {
    tg?.expand();
}

export function hapticFeedback(type = 'impact') {
    try {
        if (type === 'impact') {
            tg?.HapticFeedback?.impactOccurred('medium');
        } else if (type === 'notification') {
            tg?.HapticFeedback?.notificationOccurred('success');
        } else if (type === 'selection') {
            tg?.HapticFeedback?.selectionChanged();
        }
    } catch (e) { }
}

export function openInvoice(invoiceUrl, callback) {
    if (tg?.openInvoice) {
        tg.openInvoice(invoiceUrl, callback);
    }
}

export function showAlert(message, callback) {
    if (tg?.showAlert) {
        tg.showAlert(message, callback);
    } else {
        alert(message);
        if (callback) callback();
    }
}

export function setHeaderColor(color) {
    try {
        tg?.setHeaderColor(color);
    } catch (e) { }
}

export function setBackgroundColor(color) {
    try {
        tg?.setBackgroundColor(color);
    } catch (e) { }
}

export function ready() {
    tg?.ready();
}
