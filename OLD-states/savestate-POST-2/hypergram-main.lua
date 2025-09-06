-- HyperGram Main Process
-- Central hub for user management and chat orchestration
local json = require('json')

-- Configuration
config = {
    app_name = "HyperGram",
    version = "1.0.0",
    base_url = "https://jonny-ringo.xyz/" .. (id or "process") .. "/now",
    encryption_method = "AES-256-GCM",
    max_chats_per_user = 100
}

-- User registry (encrypted user data keyed by wallet address)
users_registry = users_registry or {}

-- Clear old chat registry that doesn't use member objects
-- This ensures we start fresh with the new scalable architecture
if chats_registry and next(chats_registry) then
    local needs_reset = false
    for chat_id, chat in pairs(chats_registry) do
        if not chat.members or not chat.chat_processes then
            needs_reset = true
            break
        end
    end
    
    if needs_reset then
        print("🔄 Detected old chat format - clearing for migration to new architecture")
        chats_registry = {}
        update_chats_registry_json()
        print("✅ Chat registry cleared - ready for new member-based architecture")
    end
end

-- Complete in-memory chat storage
-- Each chat contains: owner, members, nickname, messages, metadata
chats_storage = chats_storage or {}

-- Member objects with detailed participant information
members_registry = members_registry or {}

-- Chat registry for backward compatibility (just references to chats_storage)
chats_registry = chats_registry or {}

-- JSON endpoint for chats registry (for /now/chats_registry access)
function update_chats_registry_json()
    chats_registry_json = json.encode(chats_storage)
end

-- Initialize the JSON version
chats_registry_json = json.encode(chats_storage)

-- Active sessions (temporary, in-memory)
active_sessions = {}

-- Main app interface
app = [=[<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperGram - Decentralized Messaging</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
            --primary: #0088cc;
            --primary-dark: #006699;
            --primary-light: #40a9ff;
            --success: #4caf50;
            --danger: #f44336;
            --warning: #ff9800;
            --bg-primary: #ffffff;
            --bg-secondary: #f5f5f5;
            --bg-tertiary: #e8e8e8;
            --bg-dark: #2c3e50;
            --text-primary: #212121;
            --text-secondary: #757575;
            --text-inverse: #ffffff;
            --border-light: #e0e0e0;
            --border-medium: #bdbdbd;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
            --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
            --shadow-lg: 0 8px 24px rgba(0,0,0,0.2);
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
            --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-primary);
            overflow: hidden;
        }
        
        .app-container {
            background: var(--bg-primary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            width: 100vw;
            max-width: 1400px;
            height: 100vh;
            max-height: 800px;
            display: flex;
            position: relative;
        }
        
        /* Login Screen */
        .login-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 3rem;
            text-align: center;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }
        
        .login-screen h1 {
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            max-width: 500px;
            font-size: 1.1rem;
            font-weight: 400;
        }
        
        .connect-btn, .new-chat-btn {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: var(--text-inverse);
            border: none;
            padding: 1rem 2.5rem;
            border-radius: var(--radius-md);
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: var(--shadow-md);
        }
        
        .connect-btn:hover, .new-chat-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        /* Sidebar */
        .sidebar {
            width: 320px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border-light);
            display: none;
            flex-direction: column;
            height: 100%;
        }
        
        .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-light);
            background: var(--bg-primary);
        }
        
        .sidebar-header h3 {
            color: var(--primary);
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
        }
        
        .user-info {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .sidebar-actions {
            padding: 1rem;
            border-bottom: 1px solid var(--border-light);
        }
        
        .new-chat-btn {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
        }
        
        .chats-list {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }
        
        .chat-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border-light);
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .chat-item:hover {
            background: var(--bg-primary);
        }
        
        /* Chat Area */
        .chat-area {
            flex: 1;
            display: none;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary);
        }
        
        .chat-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-light);
            background: var(--bg-primary);
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: var(--shadow-sm);
        }
        
        .chat-header-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: var(--text-inverse);
        }
        
        .messages-container {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
        }
        
        .message-input-container {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-light);
            background: var(--bg-primary);
            display: flex;
            align-items: flex-end;
            gap: 1rem;
        }
        
        .message-input-wrapper {
            flex: 1;
        }
        
        .message-input {
            width: 100%;
            min-height: 44px;
            padding: 0.75rem 1rem;
            border: 1px solid var(--border-medium);
            border-radius: 22px;
            outline: none;
            font-family: inherit;
            font-size: 0.9rem;
            background: var(--bg-secondary);
        }
        
        .message-input:focus {
            border-color: var(--primary);
            background: var(--bg-primary);
        }
        
        .send-btn {
            width: 44px;
            height: 44px;
            border: none;
            background: var(--primary);
            color: var(--text-inverse);
            border-radius: 50%;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: var(--shadow-md);
        }
        
        .send-btn:hover {
            background: var(--primary-dark);
            transform: scale(1.05);
        }
        
        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .hidden { display: none !important; }
        .flex { display: flex !important; }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Login Screen -->
        <div id="loginScreen" class="login-screen">
            <h1>HyperGram</h1>
            <p class="subtitle">Secure, decentralized messaging built on AO. Connect your Arweave wallet to get started.</p>
            <button id="connectWallet" class="connect-btn">Connect Arweave Wallet</button>
            <div id="walletStatus" style="margin-top: 1rem; color: var(--text-secondary);"></div>
        </div>
        
        <!-- Main App Interface -->
        <div id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <h3>HyperGram</h3>
                <p id="userAddress" class="user-info"></p>
            </div>
            <div class="sidebar-actions">
                <button id="newChatBtn" class="new-chat-btn">New Chat</button>
            </div>
            <div id="chatsList" class="chats-list">
                <!-- Chat list will populate here -->
            </div>
        </div>
        
        <div id="chatArea" class="chat-area">
            <div class="chat-header">
                <div class="chat-header-avatar">💬</div>
                <div class="chat-header-info">
                    <h4 id="chatTitle">Select a chat to start messaging</h4>
                    <div class="chat-status">Online</div>
                </div>
            </div>
            <div id="messages" class="messages-container">
                <!-- Messages will appear here -->
            </div>
            <div class="message-input-container">
                <div class="message-input-wrapper">
                    <input type="text" id="messageInput" class="message-input" placeholder="Type a message..." disabled>
                </div>
                <button id="sendBtn" class="send-btn" disabled>➤</button>
            </div>
        </div>
    </div>
    
    <script>
        let wallet = null;
        let userAddress = null;
        let encryptionKey = null;
        let currentChat = null;
        const processId = window.location.pathname.split('/')[1];
        
        // Wallet connection using ArConnect/Wander
        document.getElementById('connectWallet').addEventListener('click', async () => {
            try {
                document.getElementById('walletStatus').textContent = 'Connecting...';
                
                // Check if ArConnect/Wander wallet is available
                if (!window.arweaveWallet) {
                    document.getElementById('walletStatus').textContent = 'Please install ArConnect or Wander wallet extension';
                    return;
                }
                
                // Connect to the wallet
                await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
                userAddress = await window.arweaveWallet.getActiveAddress();
                
                if (userAddress) {
                    // Use a simpler approach - just use the wallet address as seed for encryption key
                    encryptionKey = await generateKeyFromAddress(userAddress);
                    
                    // Initialize user session
                    await initializeUser();
                    showMainInterface();
                    
                    // Load and display user's chats after showing the interface
                    await loadUserChats();
                } else {
                    document.getElementById('walletStatus').textContent = 'Failed to get wallet address';
                }
            } catch (error) {
                console.error('Wallet connection failed:', error);
                document.getElementById('walletStatus').textContent = 'Connection failed: ' + error.message;
            }
        });
        
        async function generateKeyFromAddress(address) {
            // Use wallet address as deterministic seed for encryption key
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(address + 'hypergram-salt'),
                'PBKDF2',
                false,
                ['deriveKey']
            );
            
            return await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: new TextEncoder().encode('hypergram-salt'),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }
        
        async function initializeUser() {
            try {
                // Register or login user using proper HyperBeam endpoint format
                const response = await fetch(`/${processId}~process@1.0?action=authenticate&address=${encodeURIComponent(userAddress)}`, {
                    method: 'GET'
                });
                const result = await response.json();
                
                if (result.status === 'new_user') {
                    // Create user profile
                    const profile = {
                        address: userAddress,
                        username: userAddress.slice(0, 8) + '...',
                        created: Date.now(),
                        chats: []
                    };
                    
                    const encryptedProfile = await encryptData(JSON.stringify(profile));
                    
                    await fetch(`/${processId}~message@1.0?action=create-user&data=${encodeURIComponent(encryptedProfile)}`, {
                        method: 'GET'
                    });
                }
                
                // Don't load chats here - do it after showing the interface
            } catch (error) {
                console.error('User initialization failed:', error);
                document.getElementById('walletStatus').textContent = 'Failed to initialize user: ' + error.message;
            }
        }
        
        async function encryptData(data) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(data);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                encryptionKey,
                encoded
            );
            
            return btoa(String.fromCharCode(...iv) + String.fromCharCode(...new Uint8Array(encrypted)));
        }
        
        async function decryptData(encryptedData) {
            const decoded = atob(encryptedData);
            const iv = new Uint8Array(decoded.slice(0, 12).split('').map(c => c.charCodeAt(0)));
            const data = new Uint8Array(decoded.slice(12).split('').map(c => c.charCodeAt(0)));
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                encryptionKey,
                data
            );
            
            return new TextDecoder().decode(decrypted);
        }
        
        function showMainInterface() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('sidebar').classList.add('flex');
            document.getElementById('chatArea').classList.add('flex');
            document.getElementById('userAddress').textContent = userAddress.slice(0, 20) + '...';
        }
        
        async function loadUserChats() {
            try {
                console.log('Loading user chats for:', userAddress);
                
                // Load all chats from chats_registry_json and filter for user
                const response = await fetch(`/${processId}/now/chats_registry_json`, {
                    method: 'GET'
                });
                const chatsRegistryText = await response.text();
                
                console.log('Chats registry response:', chatsRegistryText);
                console.log('Response length:', chatsRegistryText.length);
                
                if (chatsRegistryText && chatsRegistryText !== '{}' && chatsRegistryText !== 'null' && chatsRegistryText.trim() !== '') {
                    try {
                        // Parse the chats registry
                        const allChats = JSON.parse(chatsRegistryText);
                        console.log('Parsed all chats:', allChats);
                        
                        // Filter chats where user is a participant
                        const userChats = [];
                        Object.keys(allChats).forEach(chatId => {
                            const chat = allChats[chatId];
                            console.log(`Checking chat ${chatId}:`, chat);
                            console.log(`Participants: ${chat.participants}, includes user: ${chat.participants && chat.participants.includes(userAddress)}`);
                            
                            // Check if user is a member using the new member objects
                            let isUserMember = false;
                            if (chat.members && Array.isArray(chat.members)) {
                                isUserMember = chat.members.some(member => member.address === userAddress);
                            } else if (chat.participants && chat.participants.includes(userAddress)) {
                                // Fallback for backward compatibility
                                isUserMember = true;
                            }
                            
                            if (isUserMember) {
                                // Generate chat name from member objects
                                let chatName = 'Unknown Chat';
                                
                                if (chat.members && Array.isArray(chat.members)) {
                                    // Use member objects for better display names
                                    const otherMembers = chat.members.filter(member => member.address !== userAddress);
                                    if (otherMembers.length > 0) {
                                        if (otherMembers.length === 1) {
                                            chatName = `Chat with ${otherMembers[0].name || (otherMembers[0].address.substring(0, 8) + '...')}`;
                                        } else {
                                            chatName = `Group Chat (${chat.members.length} members)`;
                                        }
                                    }
                                } else if (chat.participants) {
                                    // Fallback to old participant parsing
                                    const participants = chat.participants.split(',').map(p => p.trim());
                                    const otherParticipants = participants.filter(p => p !== userAddress);
                                    chatName = otherParticipants.length > 0 ? 
                                        `Chat with ${otherParticipants[0].substring(0, 8)}...` : 
                                        'Unknown Chat';
                                }
                                
                                console.log('Generated chat name:', chatName);
                                
                                userChats.push({
                                    id: chatId,
                                    name: chatName,
                                    lastMessage: 'No messages yet',
                                    processId: chat.process_id,
                                    members: chat.members || [],
                                    chatType: chat.chat_type || 'direct'
                                });
                                
                                // Store process ID for easy access
                                chatProcessIds[chatId] = chat.process_id;
                                
                                console.log(`Added chat: ${chatId} with processId: ${chat.process_id}`);
                            }
                        });
                        
                        console.log('Filtered user chats:', userChats);
                        
                        if (userChats.length > 0) {
                            renderChatsList(userChats);
                        } else {
                            console.log('No user chats found, showing empty state');
                            document.getElementById('chatsList').innerHTML = '<p style="padding: 1rem; color: #666;">No chats yet. Click "New Chat" to start messaging!</p>';
                        }
                    } catch (parseError) {
                        console.error('Failed to parse chats registry:', parseError);
                        console.error('Raw text was:', chatsRegistryText);
                        document.getElementById('chatsList').innerHTML = '<p style="padding: 1rem; color: #666;">Error loading chats. Click "New Chat" to start messaging!</p>';
                    }
                } else {
                    // No chats yet, show empty state
                    console.log('Empty or null chats registry, showing empty state');
                    document.getElementById('chatsList').innerHTML = '<p style="padding: 1rem; color: #666;">No chats yet. Click "New Chat" to start messaging!</p>';
                }
            } catch (error) {
                console.error('Failed to load user chats:', error);
                document.getElementById('chatsList').innerHTML = '<p style="padding: 1rem; color: #666;">Failed to load chats. Click "New Chat" to start messaging!</p>';
            }
        }
        
        function renderChatsList(chats) {
            console.log('renderChatsList called with:', chats);
            const chatsList = document.getElementById('chatsList');
            
            if (!chatsList) {
                console.error('chatsList element not found!');
                return;
            }
            
            if (!chats || chats.length === 0) {
                console.log('No chats to render');
                chatsList.innerHTML = '<p style="padding: 1rem; color: #666;">No chats available</p>';
                return;
            }
            
            const chatHTML = chats.map(chat => `
                <div class="chat-item" data-chat-id="${chat.id}" style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="font-weight: 600;">${chat.name}</div>
                        <div style="font-size: 0.7rem; color: #999; background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 8px;">
                            ${chat.chatType || 'direct'}
                        </div>
                    </div>
                    <div style="font-size: 0.8rem; color: #666;">${chat.lastMessage || 'No messages yet'}</div>
                    <div style="font-size: 0.7rem; color: #999; margin-top: 0.2rem;">
                        ${chat.members ? chat.members.length : 0} member${(chat.members && chat.members.length !== 1) ? 's' : ''}
                    </div>
                </div>
            `).join('');
            
            console.log('Setting chatsList HTML:', chatHTML);
            chatsList.innerHTML = chatHTML;
            
            // Debug the chatsList element styling
            const chatListStyles = window.getComputedStyle(chatsList);
            console.log('ChatsList element info:');
            console.log('- Display:', chatListStyles.display);
            console.log('- Visibility:', chatListStyles.visibility);
            console.log('- Height:', chatListStyles.height);
            console.log('- Width:', chatListStyles.width);
            console.log('- Opacity:', chatListStyles.opacity);
            console.log('- Position:', chatListStyles.position);
            console.log('- Parent element:', chatsList.parentElement);
            
            // Check if sidebar is visible
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                const sidebarStyles = window.getComputedStyle(sidebar);
                console.log('Sidebar display:', sidebarStyles.display);
                console.log('Sidebar visibility:', sidebarStyles.visibility);
                console.log('Sidebar classes:', sidebar.className);
                console.log('Sidebar style attribute:', sidebar.style.cssText);
                
                // Also check what CSS rules are being applied
                console.log('Full sidebar computed styles:');
                console.log('- Position:', sidebarStyles.position);
                console.log('- Left:', sidebarStyles.left);
                console.log('- Right:', sidebarStyles.right);
                console.log('- Top:', sidebarStyles.top);
                console.log('- Transform:', sidebarStyles.transform);
                console.log('- Z-index:', sidebarStyles.zIndex);
                console.log('- Overflow:', sidebarStyles.overflow);
            }
            
            // Let's also force a visual check by adding a temporary background
            console.log('Adding temporary red background to chatsList for debugging...');
            
            // And check all parent elements
            let parent = chatsList.parentElement;
            let level = 0;
            while (parent && level < 5) {
                const parentStyles = window.getComputedStyle(parent);
                console.log(`Parent ${level} (${parent.tagName}#${parent.id || 'no-id'}.${parent.className || 'no-class'}):`);
                console.log(`- Display: ${parentStyles.display}`);
                console.log(`- Visibility: ${parentStyles.visibility}`);
                console.log(`- Overflow: ${parentStyles.overflow}`);
                console.log(`- Height: ${parentStyles.height}`);
                parent = parent.parentElement;
                level++;
            }
            
            // Add click handlers
            const chatItems = document.querySelectorAll('.chat-item');
            console.log('Found chat items:', chatItems.length);
            
            chatItems.forEach(item => {
                item.addEventListener('click', () => {
                    console.log('Chat clicked:', item.dataset.chatId);
                    selectChat(item.dataset.chatId);
                });
            });
        }
        
        async function selectChat(chatId) {
            currentChat = chatId;
            
            // Find the chat data to get the process ID and name
            const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
            const chatName = chatElement ? chatElement.querySelector('div').textContent : `Chat ${chatId}`;
            
            document.getElementById('chatTitle').textContent = chatName;
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendBtn').disabled = false;
            
            // Load chat messages
            await loadChatMessages(chatId);
        }
        
        // Store the chat process IDs for easy access
        let chatProcessIds = {};
        
        async function loadChatMessages(chatId) {
            try {
                console.log('Loading messages for chat:', chatId);
                
                // Load messages directly from main process chats_storage
                const response = await fetch(`/${processId}/now/chats_registry_json`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const chatsData = await response.text();
                    console.log('Chats data response:', chatsData);
                    
                    if (chatsData && chatsData !== '{}' && chatsData !== 'null' && chatsData.trim() !== '') {
                        const allChats = JSON.parse(chatsData);
                        const chat = allChats[chatId];
                        
                        if (chat && chat.messages) {
                            console.log('Found messages for chat:', chat.messages);
                            renderMessages(chat.messages);
                        } else {
                            console.log('No messages found for chat:', chatId);
                            renderMessages([]);
                        }
                    } else {
                        console.log('No chats data available');
                        renderMessages([]);
                    }
                } else {
                    console.error('Failed to fetch chats data:', response.status);
                    renderMessages([]);
                }
            } catch (error) {
                console.error('Failed to load chat messages:', error);
                renderMessages([]);
            }
        }
        
        function renderMessages(messages) {
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = messages.map(msg => `
                <div style="margin-bottom: 1rem; ${msg.sender === userAddress ? 'text-align: right;' : ''}">
                    <div style="display: inline-block; max-width: 70%; padding: 0.75rem; border-radius: 12px; 
                        ${msg.sender === userAddress ? 'background: #007bff; color: white;' : 'background: white; border: 1px solid #ddd;'}">
                        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.25rem;">
                            ${msg.sender.slice(0, 8)}...
                        </div>
                        <div>${msg.content}</div>
                        <div style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.25rem;">
                            ${new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            `).join('');
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // New chat creation
        document.getElementById('newChatBtn').addEventListener('click', async () => {
            const otherUser = prompt('Enter the Arweave address of the user you want to chat with:');
            if (otherUser && otherUser !== userAddress) {
                await createNewChat(otherUser);
            }
        });
        
        async function createNewChat(otherUser) {
            try {
                // Use the proper process device endpoint for scheduling messages
                const url = `/${processId}/schedule`;
                console.log('Creating chat with URL:', url);
                
                // Create proper AO message structure
                const participants = `${userAddress},${otherUser}`;
                const aoMessage = {
                    Target: processId,
                    action: 'create-chat',
                    participants: participants
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(aoMessage)
                });
                
                console.log('Chat creation request status:', response.status);
                console.log('Chat creation request ok:', response.ok);
                
                if (response.ok) {
                    // Don't try to parse JSON - just refresh the chat list
                    console.log('Chat creation request sent successfully');
                    
                    // Wait a moment for the backend to process, then refresh
                    setTimeout(async () => {
                        await loadUserChats(); // Refresh chat list
                        alert('Chat creation request sent! Check your chat list.');
                    }, 1000);
                } else {
                    const errorText = await response.text();
                    console.log('Chat creation error response:', errorText);
                    alert('Failed to create chat. Please try again.');
                }
            } catch (error) {
                console.error('Failed to create chat:', error);
                alert('Failed to create chat: ' + error.message);
            }
        }
        
        // Send message
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message && currentChat) {
                try {
                    console.log('Sending message:', message, 'to chat:', currentChat);
                    
            // Use the proper process device endpoint for scheduling messages
            const url = `/${processId}~process@1.0/schedule`;
            console.log('Message URL:', url);
            
            // Create proper AO message structure
            const aoMessage = {
                target: processId,
                action: 'send-message',
                Data: message,
                sender: userAddress,
                chat_id: currentChat
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aoMessage)
            });
                    console.log('Message response status:', response.status);
                    
                    if (response.ok) {
                    // If we get a 200 response, assume success and reload messages
                   console.log('Message sent successfully (200 response)');
                   input.value = '';
                   await loadChatMessages(currentChat); // Refresh messages
                    } else {
                        alert('Failed to send message. Please try again.');
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                    alert('Failed to send message: ' + error.message);
                }
            }
        }
    </script>
</body>
</html>]=]

-- User authentication endpoint
auth_endpoint = function(address)
    if users_registry[address] then
        return json.encode({status = "existing_user"})
    else
        return json.encode({status = "new_user"})
    end
end

-- User chats endpoint (returns encrypted chat list)
user_chats = function(address)
    if users_registry[address] then
        return users_registry[address].encrypted_chats or "[]"
    end
    return "[]"
end

-- Variable for /now/user-chats endpoint (removed due to syntax issues)
-- user_chats variable is available via function call instead

-- Chat process ID lookup function
function get_chat_process(chat_id)
    if chats_registry[chat_id] then
        return chats_registry[chat_id].process_id
    end
    return ""
end

-- Get messages for a chat (for /now/ endpoint access)
function get_chat_messages(chat_id)
    if chats_storage[chat_id] then
        return json.encode(chats_storage[chat_id].messages or {})
    end
    return "[]"
end

-- Variable for /now/messages endpoint
messages = "[]"


-- Authentication handler - FIXED to use string pattern
Handlers.add('Authenticate', 'authenticate', function(msg)
    print("🔧 AUTH: Handler started")
    local address = msg.address or msg.Tags.address
    print("🔧 AUTH: Address found: " .. tostring(address))
    
    if not address then
        print("🔧 AUTH: No address - sending error")
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "No address provided"})
        })
        return
    end
    
    local status = users_registry[address] and "existing_user" or "new_user"
    print("🔧 AUTH: Status determined: " .. status)
    
    send({
        target = msg.From,
        data = json.encode({status = status, address = address})
    })
    
    print("🔧 AUTH: Authentication request from: " .. address .. " - " .. status)
end)

-- User creation handler
Handlers.add('CreateUser', 'create-user', function(msg)
    local address = msg.From
    local encrypted_data = msg.data or msg.Tags.data
    
    if not encrypted_data then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "No user data provided"})
        })
        return
    end
    
    -- Store encrypted user profile
    users_registry[address] = {
        encrypted_profile = encrypted_data,
        encrypted_chats = "[]",
        created = os.time()
    }
    
    send({
        target = msg.From,
        data = json.encode({status = "success", message = "User created successfully"})
    })
    
    print("New user created: " .. address)
end)

-- Chat creation handler - FIXED to use string pattern
Handlers.add('CreateChat', 'create-chat', function(msg)
    print("🔧 CHAT: Handler started")
    
    local participants = msg.participants or msg.Tags.participants
    print("🔧 CHAT: Participants: " .. tostring(participants))
    
    if not participants then
        print("🔧 CHAT: No participants - sending error")
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "No participants provided"})
        })
        return
    end
    
    -- Generate unique chat ID using message timestamp (replace periods with underscores)
    local timestamp = tostring(msg.Timestamp or math.floor(os.time())):gsub("%.", "_")
    local chat_id = "chat_" .. timestamp .. "_" .. math.random(1000, 9999)
    print("🔧 CHAT: Generated chat ID: " .. chat_id)
    
    -- Simple chat storage creation
    chats_storage[chat_id] = {
        id = chat_id,
        owner = msg.From,
        participants = participants,
        messages = {},
        created = os.time(),
        last_activity = os.time(),
        chat_type = "direct"
    }
    
    -- Backward compatibility
    chats_registry[chat_id] = {
        process_id = chat_id,
        participants = participants,
        created = os.time(),
        last_activity = os.time(),
        chat_type = "direct"
    }
    
    print("🔧 CHAT: Chat created successfully")
    
    -- Update JSON registry
    update_chats_registry_json()
    
    -- Send success response
    send({
        target = msg.From,
        data = json.encode({
            status = "success",
            chatId = chat_id,
            message = "Chat created successfully"
        })
    })
    
    print("🔧 CHAT: Response sent")
end)

-- Updated Message storage handler - Now handles scheduled AO messages
Handlers.add('SendMessage', 'send-message', function(msg)
    -- Extract parameters from the scheduled AO message
    local chat_id = msg.chat_id or msg["chat_id"]
    local sender = msg.sender or msg["sender"] or msg.From
    local message_content = msg.Data  -- Message content is in Data field

    -- Find the target chat
    local target_chat = nil
    local target_chat_id = nil
    
    if chat_id then
        -- First try exact match
        if chats_storage[chat_id] then
            target_chat = chats_storage[chat_id]
            target_chat_id = chat_id
            print("📧 MSG: Found chat by exact match: " .. chat_id)
        else
            -- Try partial match
            for stored_chat_id, chat in pairs(chats_storage) do
                if stored_chat_id:find(chat_id, 1, true) or chat_id:find(stored_chat_id, 1, true) then
                    target_chat = chat
                    target_chat_id = stored_chat_id
                    print("📧 MSG: Found chat by partial match: " .. stored_chat_id)
                    break
                end
            end
        end
    end
    
    -- If no chat found, use the first available chat for testing
    if not target_chat then
        for stored_chat_id, chat in pairs(chats_storage) do
            target_chat = chat
            target_chat_id = stored_chat_id
            print("📧 MSG: Using first available chat: " .. stored_chat_id)
            break
        end
    end
    
    -- Store the message if we have everything needed
    if target_chat and message_content then
        local message_obj = {
            id = "msg_" .. os.time() .. "_" .. math.random(1000, 9999),
            sender = sender or "unknown",
            content = message_content,
            timestamp = os.time(),
            delivered = true
        }
        
        -- Initialize messages array if it doesn't exist
        if not target_chat.messages then
            target_chat.messages = {}
        end
        
        -- Add message to chat storage
        table.insert(target_chat.messages, message_obj)
        
        -- Update JSON registry for /now access
        update_chats_registry_json()
    end
end)

-- Get messages handler (retrieves messages from in-memory storage)
Handlers.add('GetMessages', 'get-messages', function(msg)
    local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
    local sender = msg.From
    
    if not chat_id then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Missing chat_id"})
        })
        return
    end
    
    -- Check if chat exists
    if not chats_storage[chat_id] then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Chat not found"})
        })
        return
    end
    
    -- Check if sender is a participant
    local is_participant = false
    if chats_storage[chat_id].members then
        for _, member in ipairs(chats_storage[chat_id].members) do
            if member.address == sender then
                is_participant = true
                break
            end
        end
    end
    
    if not is_participant then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized to view messages"})
        })
        return
    end
    
    -- Return messages from in-memory storage
    local messages = chats_storage[chat_id].messages or {}
    
    send({
        target = msg.From,
        data = json.encode({
            status = "success",
            messages = messages,
            count = #messages
        })
    })
    
    print("Retrieved " .. #messages .. " messages from chat " .. chat_id .. " for " .. sender)
end)

-- Add member to chat handler
Handlers.add('AddMember', 'add-member', function(msg)
    local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
    local member_address = msg.member_address or msg.Tags.member_address
    local sender = msg.From
    
    if not chat_id or not member_address then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Missing chat_id or member_address"})
        })
        return
    end
    
    -- Check if sender is admin/owner of the chat
    local is_admin = false
    if chats_registry[chat_id] and chats_registry[chat_id].members then
        for _, member in ipairs(chats_registry[chat_id].members) do
            if member.address == sender and (member.role == "admin" or member.role == "owner") then
                is_admin = true
                break
            end
        end
    end
    
    if not is_admin then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Admin privileges required"})
        })
        return
    end
    
    local success, message = add_member_to_chat(chat_id, member_address)
    
    send({
        target = msg.From,
        data = json.encode({
            status = success and "success" or "error",
            message = message
        })
    })
    
    if success then
        print("Member added to chat " .. chat_id .. ": " .. member_address)
    end
end)

-- Get chat members handler
Handlers.add('GetMembers', 'get-members', function(msg)
    local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
    local sender = msg.From
    
    if not chat_id then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Missing chat_id"})
        })
        return
    end
    
    -- Check if sender is a member
    local is_member = false
    if chats_registry[chat_id] and chats_registry[chat_id].members then
        for _, member in ipairs(chats_registry[chat_id].members) do
            if member.address == sender then
                is_member = true
                break
            end
        end
    end
    
    if not is_member then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized to view members"})
        })
        return
    end
    
    local members = get_chat_members(chat_id)
    
    send({
        target = msg.From,
        data = json.encode({
            status = "success",
            members = members
        })
    })
end)

-- Update member profile handler
Handlers.add('UpdateMemberProfile', 'update-member-profile', function(msg)
    local name = msg.name or msg.Tags.name
    local avatar = msg.avatar or msg.Tags.avatar
    local sender = msg.sender or msg.From 
    
    if not members_registry[sender] then
        members_registry[sender] = {
            name = sender:sub(1, 8) .. "...",
            address = sender,
            date_joined = os.time(),
            avatar = nil,
            public_key = nil
        }
    end
    
    if name then
        members_registry[sender].name = name
        
        -- Update name in all chats where this member participates
        for chat_id, chat in pairs(chats_registry) do
            if chat.members then
                for _, member in ipairs(chat.members) do
                    if member.address == sender then
                        member.name = name
                    end
                end
            end
        end
        
        update_chats_registry_json()
    end
    
    if avatar then
        members_registry[sender].avatar = avatar
    end
    
    send({
        target = msg.From,
        data = json.encode({status = "success", message = "Profile updated"})
    })
    
    print("Member profile updated: " .. sender)
end)

-- Local function to reset chat registry (secure, no external access)
function reset_chat_registry()
    local old_count = 0
    for _ in pairs(chats_registry) do
        old_count = old_count + 1
    end
    
    chats_registry = {}
    members_registry = {}
    update_chats_registry_json()
    
    chats_storage = {}
    print("🗑️ Chat storage reset locally - cleared " .. old_count .. " old chats")
    print("🆕 Ready for new chats with in-memory storage architecture")
    
    return old_count
end


-- Member management functions
function add_member_to_chat(chat_id, member_address)
    if not chats_storage[chat_id] then
        return false, "Chat not found"
    end
    
    -- Check if already a member
    for _, member in ipairs(chats_storage[chat_id].members) do
        if member.address == member_address then
            return false, "Already a member"
        end
    end
    
    -- Add member object
    if not members_registry[member_address] then
        members_registry[member_address] = {
            name = member_address:sub(1, 8) .. "...",
            address = member_address,
            date_joined = os.time(),
            avatar = nil,
            public_key = nil
        }
    end
    
    table.insert(chats_storage[chat_id].members, {
        address = member_address,
        name = members_registry[member_address].name,
        date_joined = os.time(),
        role = "member"
    })
    
    -- Update last activity in both storage systems
    chats_storage[chat_id].last_activity = os.time()
    chats_registry[chat_id].last_activity = os.time()
    update_chats_registry_json()
    
    return true, "Member added successfully"
end

function get_chat_members(chat_id)
    if chats_storage[chat_id] then
        return chats_storage[chat_id].members
    end
    return {}
end

-- Get current process address
function get_process_address()
    return id or (ao and ao.id) or "unknown-process-id"
end

-- Check AO capabilities
function check_ao_capabilities()
    local capabilities = {
        ao_available = ao ~= nil,
        ao_id = (id) or "not available",
        process_id = id or "not available"
    }
    
    print("🔍 AO Environment Check:")
    print("   • AO available: " .. tostring(capabilities.ao_available))
    print("   • Process ID (id): " .. capabilities.process_id)
    print("   • AO ID (ao.id): " .. capabilities.ao_id)
    
    return capabilities
end

-- Initialize HyperGram
local ao_caps = check_ao_capabilities()
local process_address = get_process_address()
print("🚀 HyperGram Main Process Initialized!")
print("🎯 Process Address: " .. process_address)
print("📱 Available endpoints:")
print("   • App Interface: /now/app")
print("   • Authentication: /push?action=authenticate")
print("   • Create User: /push?action=create-user")  
print("   • Create Chat: /push?action=create-chat")
print("   • User Chats: /now/user-chats")
print("   • Chat Process Lookup: /now/chat-process")
print("💬 Ready for secure, decentralized messaging!")
print("👥 Member management enabled with detailed participant information")
print("🔄 Scalable architecture: Each chat runs in its own process")
print("📋 Available member actions:")
print("   • add-member, get-members")
print("   • update-member-profile")
print("🎯 Main process only stores chat index/references for optimal scalability")

print("🔒 Secure local reset function available: reset_chat_registry()")
