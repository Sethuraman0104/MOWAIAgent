/* =========================================
   MOW AI CHAT CONFIGURATION
   ========================================= */

// ASP.NET Core API
const API_URL =
    "https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI/api/chat";

// Anonymous authentication endpoint
const AUTH_URL =
    "https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI/api/auth/anonymous";

// Local testing:
// https://localhost:7144/api/chat
// https://localhost:7144/api/auth/anonymous
//"https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI/api/chat"
//"https://tme-mowapp-2.works.test/web-api-services/MOWAIAgentAPI/api/auth/anonymous"


/* =========================================
   AUTHENTICATION
   ========================================= */

// Temporary JWT token received from API (kept only in browser memory).
let accessToken = null;

// Token expiration time in milliseconds.
let tokenExpiresAt = 0;


/* =========================================
   ELEMENTS
   ========================================= */

const mowAiButton = document.getElementById("mowAiButton");
const chatWindow = document.getElementById("chatWindow");
const closeChat = document.getElementById("closeChat");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");


/* =========================================
   CONVERSATION HISTORY
   ========================================= */

let conversation = [];
let isSending = false;


/* =========================================
   OPEN / CLOSE CHAT
   ========================================= */

mowAiButton.addEventListener("click", function () {

    chatWindow.classList.add("open");
    chatWindow.setAttribute("aria-hidden", "false");

    setTimeout(function () {
        chatInput.focus();
    }, 200);
});


closeChat.addEventListener("click", function () {

    chatWindow.classList.remove("open");
    chatWindow.setAttribute("aria-hidden", "true");
});


/* Escape key closes the chat */
document.addEventListener("keydown", function (event) {

    if (
        event.key === "Escape" &&
        chatWindow.classList.contains("open")
    ) {
        chatWindow.classList.remove("open");
        chatWindow.setAttribute("aria-hidden", "true");
        mowAiButton.focus();
    }
});


/* =========================================
   SEND BUTTON + ENTER KEY
   ========================================= */

sendButton.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});


/* =========================================
   AUTO RESIZE TEXTAREA
   ========================================= */

chatInput.addEventListener("input", function () {

    chatInput.style.height = "auto";

    chatInput.style.height =
        Math.min(chatInput.scrollHeight, 100) + "px";
});


/* =========================================
   GET ANONYMOUS JWT TOKEN
   ========================================= */

async function getAnonymousToken() {

    // Reuse a valid token (30-second safety margin).
    if (accessToken && Date.now() < tokenExpiresAt - 30000) {
        console.log("Using existing anonymous JWT.");
        return accessToken;
    }

    console.log("Requesting new anonymous JWT...");

    try {

        const response = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const responseText = await response.text();

        console.log("Authentication HTTP Status:", response.status);
        console.log("Authentication Response:", responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        }
        catch {
            throw new Error(
                "Authentication API returned invalid JSON. " +
                "HTTP Status: " + response.status
            );
        }

        if (!response.ok || !data.success || !data.token) {
            throw new Error(
                data.error ||
                (
                    "Unable to create anonymous session. " +
                    "HTTP Status: " + response.status
                )
            );
        }

        // Saved in memory only - deliberately NOT in localStorage.
        accessToken = data.token;

        // API returns ExpiresIn in seconds.
        const expiresIn = Number(data.expiresIn);

        tokenExpiresAt = Date.now() + (expiresIn * 1000);

        console.log("Anonymous authentication successful.");
        console.log("Token expires in:", expiresIn, "seconds.");

        return accessToken;
    }
    catch (error) {
        console.error("Anonymous authentication error:", error);
        throw error;
    }
}


/* =========================================
   CLEAR AUTHENTICATION
   ========================================= */

function clearAuthentication() {

    accessToken = null;
    tokenExpiresAt = 0;

    console.log("Anonymous authentication token cleared.");
}


/* =========================================
   CALL CHAT API (single request)
   ========================================= */

async function postChat(token, question) {

    const response = await fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },

        body: JSON.stringify({
            question: question,
            history: conversation.slice(0, -1)
        })
    });

    const responseText = await response.text();

    console.log("HTTP Status:", response.status);
    console.log("API Response:", responseText);

    let data;

    try {
        data = JSON.parse(responseText);
    }
    catch {
        throw new Error(
            "API returned invalid JSON. " +
            "HTTP Status: " + response.status +
            ". Response: " + responseText
        );
    }

    return { response: response, data: data };
}


/* =========================================
   SEND MESSAGE
   ========================================= */

async function sendMessage() {

    if (isSending) {
        return;
    }

    const question = chatInput.value.trim();

    if (!question) {
        return;
    }

    // Show user message
    addMessage("user", question);

    // Clear input
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Save user message
    conversation.push({
        role: "user",
        content: question
    });

    // Loading
    isSending = true;
    sendButton.disabled = true;
    showTyping();

    try {

        // 1. Get anonymous JWT
        const token = await getAnonymousToken();

        // 2. Call API
        console.log("Calling MOW AI API:", API_URL);
        console.log("Question:", question);

        let result = await postChat(token, question);

        // 3. Token expired / unauthorized -> get new token, retry once
        if (result.response.status === 401) {

            console.warn(
                "JWT expired or unauthorized. " +
                "Requesting a new anonymous token."
            );

            clearAuthentication();

            const newToken = await getAnonymousToken();

            result = await postChat(newToken, question);
        }

        // 4. Check API success
        if (!result.response.ok || !result.data.success) {
            throw new Error(
                result.data.error ||
                (
                    "API request failed. " +
                    "HTTP Status: " + result.response.status
                )
            );
        }

        // 5. Show AI answer
        hideTyping();

        addMessage(
            "assistant",
            result.data.answer,
            result.data.sources
        );

        // 6. Save AI response
        conversation.push({
            role: "assistant",
            content: result.data.answer
        });
    }
    catch (error) {

        console.error("MOW AI error:", error);

        hideTyping();

        addMessage("assistant", "API Error: " + error.message);
    }
    finally {

        isSending = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}


/* =========================================
   ADD MESSAGE
   ========================================= */

function addMessage(role, text, sources = null) {

    const row = document.createElement("div");

    row.className =
        "message-row " +
        (role === "user" ? "user-row" : "assistant-row");

    // Assistant avatar
    if (role === "assistant") {

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";
        avatar.textContent = "AI";

        row.appendChild(avatar);
    }

    // Message bubble
    const message = document.createElement("div");

    message.className =
        "message " +
        (role === "user" ? "user-message" : "assistant-message");

    const textElement = document.createElement("div");

    // "plain" keeps line breaks from the API answer
    textElement.className = "message-text plain";

    // textContent (not innerHTML) prevents HTML/JS injection.
    textElement.textContent = text;

    message.appendChild(textElement);

    // Sources
    if (role === "assistant" && sources && sources.length > 0) {

        const sourcesContainer = document.createElement("div");
        sourcesContainer.className = "sources";

        const title = document.createElement("div");
        title.className = "source-title";
        title.textContent = "Sources";

        sourcesContainer.appendChild(title);

        sources.forEach(function (source) {

            const sourceItem = document.createElement("div");

            sourceItem.textContent =
                "• " + (source.sourceName || "MOW document");

            sourcesContainer.appendChild(sourceItem);
        });

        message.appendChild(sourcesContainer);
    }

    row.appendChild(message);
    chatMessages.appendChild(row);

    scrollToBottom();
}


/* =========================================
   TYPING INDICATOR
   ========================================= */

function showTyping() {

    typingIndicator.style.display = "flex";
    scrollToBottom();
}

function hideTyping() {

    typingIndicator.style.display = "none";
}


/* =========================================
   SCROLL
   ========================================= */

function scrollToBottom() {

    setTimeout(function () {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
}


/* =========================================
   CHAT WINDOW RESIZE + EXPAND

   The window is anchored bottom-right, so the
   handle is at the TOP-LEFT: drag up/left to
   make the window bigger.
   ========================================= */

(function () {

    const resizeHandle = document.getElementById("chatResizeHandle");
    const expandBtn = document.getElementById("expandChat");

    if (!chatWindow || !resizeHandle) return;

    const MIN_W = 320;
    const MIN_H = 400;
    const STORAGE_KEY = "mowChatSize";
    const mobileQuery = window.matchMedia("(max-width: 600px)");

    let start = null;

    function isMobile() {
        return mobileQuery.matches;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function currentSize() {
        const r = chatWindow.getBoundingClientRect();
        return { w: r.width, h: r.height };
    }

    // Largest size that keeps the window inside the screen
    function limits() {
        const r = chatWindow.getBoundingClientRect();
        const right = Math.max(window.innerWidth - r.right, 0);
        const bottom = Math.max(window.innerHeight - r.bottom, 0);

        return {
            maxW: Math.max(MIN_W, window.innerWidth - right - 10),
            maxH: Math.max(MIN_H, window.innerHeight - bottom - 10)
        };
    }

    function applySize(w, h) {
        const l = limits();

        w = clamp(w, MIN_W, l.maxW);
        h = clamp(h, MIN_H, l.maxH);

        chatWindow.style.setProperty("--chat-w", w + "px");
        chatWindow.style.setProperty("--chat-h", h + "px");

        return { w: w, h: h };
    }

    function saveSize(size) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    w: Math.round(size.w),
                    h: Math.round(size.h)
                })
            );
        } catch (e) { /* storage unavailable */ }
    }

    function loadSize() {
        try {
            const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (s && s.w && s.h) return s;
        } catch (e) { /* ignore */ }
        return null;
    }

    function setExpanded(on, keepInline) {

        chatWindow.classList.toggle("expanded", on);

        if (expandBtn) {
            expandBtn.setAttribute("aria-pressed", on ? "true" : "false");
            expandBtn.setAttribute(
                "aria-label",
                on ? "Shrink chat window" : "Expand chat window"
            );
            expandBtn.title = on ? "Shrink" : "Expand";
        }

        if (on) {
            // Inline values would override the .expanded size
            chatWindow.style.removeProperty("--chat-w");
            chatWindow.style.removeProperty("--chat-h");
        }
        else if (!keepInline) {
            const s = loadSize();
            if (s && !isMobile()) applySize(s.w, s.h);
        }
    }

    // Restore the size used last time
    const saved = loadSize();
    if (saved && !isMobile()) applySize(saved.w, saved.h);


    /* ----- Drag (mouse / touch / pen) ----- */

    resizeHandle.addEventListener("pointerdown", function (e) {

        if (isMobile()) return;

        e.preventDefault();

        const size = currentSize();

        start = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };

        if (chatWindow.classList.contains("expanded")) {
            setExpanded(false, true);
        }

        chatWindow.classList.add("resizing");
        resizeHandle.setPointerCapture(e.pointerId);
    });

    resizeHandle.addEventListener("pointermove", function (e) {

        if (!start) return;

        applySize(
            start.w + (start.x - e.clientX),
            start.h + (start.y - e.clientY)
        );
    });

    function endDrag(e) {

        if (!start) return;

        start = null;

        chatWindow.classList.remove("resizing");

        if (resizeHandle.hasPointerCapture(e.pointerId)) {
            resizeHandle.releasePointerCapture(e.pointerId);
        }

        saveSize(currentSize());
    }

    resizeHandle.addEventListener("pointerup", endDrag);
    resizeHandle.addEventListener("pointercancel", endDrag);


    /* ----- Keyboard (arrow keys; Shift = bigger steps) ----- */

    resizeHandle.addEventListener("keydown", function (e) {

        if (isMobile()) return;

        const step = e.shiftKey ? 60 : 20;
        let dx = 0;
        let dy = 0;

        if (e.key === "ArrowLeft") dx = step;
        else if (e.key === "ArrowRight") dx = -step;
        else if (e.key === "ArrowUp") dy = step;
        else if (e.key === "ArrowDown") dy = -step;
        else return;

        e.preventDefault();

        if (chatWindow.classList.contains("expanded")) {
            setExpanded(false, true);
        }

        const s = currentSize();

        saveSize(applySize(s.w + dx, s.h + dy));
    });


    /* ----- Double-click handle = reset size ----- */

    resizeHandle.addEventListener("dblclick", function () {

        chatWindow.style.removeProperty("--chat-w");
        chatWindow.style.removeProperty("--chat-h");

        setExpanded(false, true);

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
    });


    /* ----- Expand / shrink button ----- */

    if (expandBtn) {
        expandBtn.addEventListener("click", function () {
            setExpanded(!chatWindow.classList.contains("expanded"));
        });
    }


    /* ----- Keep window on screen when the browser is resized ----- */

    window.addEventListener("resize", function () {

        if (isMobile() || chatWindow.classList.contains("expanded")) return;

        const s = currentSize();

        applySize(s.w, s.h);
    });

})();