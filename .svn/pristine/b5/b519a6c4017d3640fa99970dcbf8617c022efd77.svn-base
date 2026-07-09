// function initChatbot() {
//     const container = document.getElementById('chatContainer');
//     if(!container) return;
//     container.innerHTML = `
//         <h2>Chatbot</h2>
//         <div id="chatbox" style="border:1px solid #ccc; padding:10px; height:200px; overflow-y:auto;"></div>
//         <input type="text" id="chatInput" placeholder="Ask something..." style="width:70%">
//         <button onclick="sendChat()">Send</button>
//     `;

//     window.sendChat = async function() {
//         const input = document.getElementById('chatInput');
//         const msg = input.value;
//         if(!msg) return;
//         const chatbox = document.getElementById('chatbox');
//         const div = document.createElement('div'); div.innerHTML = `<b>You:</b> ${msg}`; chatbox.appendChild(div);
//         const resp = await apiPost('/api/ai-chat/ask', { message: msg });
//         const div2 = document.createElement('div'); div2.innerHTML = `<b>AI:</b> ${resp.reply}`; chatbox.appendChild(div2);
//         chatbox.scrollTop = chatbox.scrollHeight;
//         input.value='';
//     }
// }
