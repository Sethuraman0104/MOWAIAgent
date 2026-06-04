const API_BASE = 'https://teu-mowapp-1.works.test/web-api-services/MOWAIAgentAPI';
//'https://localhost:7186/web-api-services/MOWAIAgentAPI';
//'https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI';
//'https://pme-mowapp-2.works.gov.bh/web-api-services/MOWAIAgentAPI';
//'https://teu-mowapp-1.works.test/web-api-services/MOWAIAgentAPI';
async function apiGet(url) {
    const res = await fetch(API_BASE + url);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}

async function apiPost(url, body) {
    const res = await fetch(API_BASE + url, {
        method: 'POST',
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

    console.log("DELETE CALLED:", API_BASE + url);

    const res = await fetch(API_BASE + url, {
        method: 'DELETE'
    });

    console.log("STATUS:", res.status);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return await res.json();
}
