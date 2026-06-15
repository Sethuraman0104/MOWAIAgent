const API_BASE = 'https://teu-mowapp-1.works.test/web-api-services/MOWAIAgentAPI';
//'https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI';
//'https://pme-mowapp-2.works.gov.bh/web-api-services/MOWAIAgentAPI';
//'https://teu-mowapp-1.works.test/web-api-services/MOWAIAgentAPI';
//'https://localhost:7186/web-api-services/MOWAIAgentAPI'

// ==============================
// 🔐 AUDIT USER CONTEXT
// ==============================
let auditUserName = "";
let auditFullName = "";

// Call this after login validation
function setAuditUser(userName, fullName) {
    auditUserName = userName || "SYSTEM";
    auditFullName = fullName || "SYSTEM";
}

function getAuditHeaders() {
    return {
        "X-Audit-User": auditUserName || "SYSTEM",
        "X-Audit-FullName": auditFullName || "SYSTEM"
    };
}


// ==============================
// 🔵 GET
// ==============================
async function apiGet(url) {

    const res = await fetch(API_BASE + url, {
        credentials: 'include',
        headers: getAuditHeaders()
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}


async function apiPost(url, body, extraHeaders = {}) {

    const res = await fetch(API_BASE + url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getAuditHeaders(),
            ...extraHeaders
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}


// ==============================
// 🔵 POST (FORM DATA)
// ==============================
async function apiPostForm(url, formData, extraHeaders = {}) {

    const res = await fetch(API_BASE + url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...getAuditHeaders(),
            ...extraHeaders
        },
        body: formData
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    try {
        return await res.json();
    }
    catch {
        return { success: true };
    }
}


// ==============================
// 🔵 DELETE
// ==============================
async function apiDelete(url) {

    const res = await fetch(API_BASE + url, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuditHeaders()
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}