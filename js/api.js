const API_BASE = 'https://localhost:7186/web-api-services/MOWAIAgentAPI';
//'https://localhost:7186/web-api-services/MOWAIAgentAPI';
//'https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI';
//'https://pme-mowapp-2.works.gov.bh/web-api-services/MOWAIAgentAPI';
//'https://teu-mowapp-1.works.test/web-api-services/MOWAIAgentAPI';
async function apiGet(url) {
    const res = await fetch(API_BASE + url, {
        credentials: 'include'
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}

async function apiPost(url, body) {

    const res = await fetch(API_BASE + url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}

async function apiPostForm(url, formData) {

    const res = await fetch(API_BASE + url, {
        method: 'POST',
        credentials: 'include',
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

async function apiDelete(url) {

    const res = await fetch(API_BASE + url, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}
