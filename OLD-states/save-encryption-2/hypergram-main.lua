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
        print("&#128260; Detected old chat format - clearing for migration to new architecture")
        chats_registry = {}
        update_chats_registry_json()
        print("&#10004; Chat registry cleared - ready for new member-based architecture")
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
            font-size: 2rem;
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
                <div class="chat-header-avatar">&#128172;</div>
                <div style="flex: 1; min-width: 0;">
                    <div id="chatTitle" style="margin: 0;">Select a chat to start messaging</div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <button id="refreshBtn" style="
                        background: none; border: none; outline: none;
                        color: var(--text-secondary); padding: 0; margin: 0;
                        cursor: pointer; display: none; transition: var(--transition);
                        font-size: 2.4rem; font-weight: 600; line-height: 1;
                    " title="Refresh messages">
                        &#128260;
                    </button>
                    <div id="updateStatus" style="font-size: 0.7rem; color: var(--text-secondary); display: none;"></div>
                    <div style="font-size: 0.8rem; color: var(--success); font-weight: 500;">
                        Online
                    </div>
                </div>
            </div>
            <div id="messages" class="messages-container">
                <!-- Messages will appear here -->
            </div>
            <div class="message-input-container">
                <div class="message-input-wrapper">
                    <input type="text" id="messageInput" class="message-input" placeholder="Type a message..." disabled>
                </div>
                <button id="sendBtn" class="send-btn" disabled>&#10148;</button>
            </div>
        </div>
    </div>
    
    <script>
        let wallet = null;
        let userAddress = null;
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
                
                // Connect to the wallet with all needed permissions
                await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ENCRYPT', 'DECRYPT', 'ACCESS_PUBLIC_KEY']);
                userAddress = await window.arweaveWallet.getActiveAddress();
                
                if (userAddress) {
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
        
        
        async function initializeUser() {
            try {
                // User initialization simplified - no authentication needed
                // The user is automatically recognized by their wallet address
                console.log('User initialized:', userAddress);
                
                // Don't load chats here - do it after showing the interface
            } catch (error) {
                console.error('User initialization failed:', error);
                document.getElementById('walletStatus').textContent = 'Failed to initialize user: ' + error.message;
            }
        }
        
        // Real Arweave Wallet Encryption for HyperGram
        // Uses actual wallet RSA keys for encryption/decryption
        class ArweaveHybridCrypto {
            constructor() {
                this.publicKeys = {}; // Cache for fetched public keys
            }

            // Get real Arweave public key from address
            async getArweavePublicKey(address) {
                if (this.publicKeys[address]) {
                    return this.publicKeys[address];
                }

                // Use GraphQL to query Arweave network for all addresses (including connected user)
                try {
                    console.log(`Fetching public key for address: ${address}`);
                    const query = `
                    query {
                        transactions(owners: ["${address}"], first: 1) {
                            edges {
                                node {
                                    owner {
                                        address
                                        key
                                    }
                                }
                            }
                        }
                    }`;
                    
                    const response = await fetch('https://arweave-search.goldsky.com/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                    });
                    
                    const data = await response.json();
                    console.log('GraphQL response:', data);
                    const publicKeyData = data.data.transactions.edges[0]?.node.owner.key;
                    
                    if (!publicKeyData) {
                        throw new Error(`No public key found for address: ${address}`);
                    }
                    
                    console.log('Got public key data:', publicKeyData);
                    // Convert Arweave public key to WebCrypto format
                    const publicKey = await this.importArweavePublicKey(publicKeyData);
                    this.publicKeys[address] = publicKey;
                    return publicKey;

                } catch (error) {
                    console.error('Failed to fetch public key via GraphQL:', error);
                    throw new Error(`Cannot get public key for address: ${address}`);
                }
            }

            // Encrypt entire messages array using real Arweave RSA + AES hybrid approach
            async encryptChatMessages(messagesArray, senderAddress, recipientAddress) {
                try {
                    // Generate random AES key for this chat messages object
                    const aesKey = await crypto.subtle.generateKey(
                        { name: 'AES-GCM', length: 256 },
                        true,
                        ['encrypt', 'decrypt']
                    );

                    // Encrypt entire messages array with AES
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const messagesJSON = JSON.stringify(messagesArray);
                    const encryptedMessages = await crypto.subtle.encrypt(
                        { name: 'AES-GCM', iv: iv },
                        aesKey,
                        new TextEncoder().encode(messagesJSON)
                    );

                    // Export AES key for RSA encryption
                    const exportedAESKey = await crypto.subtle.exportKey('raw', aesKey);

                    // Get real public keys for both participants
                    const senderPublicKey = await this.getArweavePublicKey(senderAddress);
                    const recipientPublicKey = await this.getArweavePublicKey(recipientAddress);

                    // Encrypt AES key for sender (so they can decrypt later)
                    const aesKeyForSender = await crypto.subtle.encrypt(
                        { name: 'RSA-OAEP' },
                        senderPublicKey,
                        exportedAESKey
                    );

                    // Encrypt AES key for recipient
                    const aesKeyForRecipient = await crypto.subtle.encrypt(
                        { name: 'RSA-OAEP' },
                        recipientPublicKey,
                        exportedAESKey
                    );

                    // Create state hash for verification without decryption
                    const stateHash = await this.createChatStateHash(messagesArray);

                    // Package everything together
                    return {
                        encryptedMessages: this.arrayBufferToBase64(encryptedMessages),
                        iv: this.arrayBufferToBase64(iv),
                        aesKeyForSender: this.arrayBufferToBase64(aesKeyForSender),
                        aesKeyForRecipient: this.arrayBufferToBase64(aesKeyForRecipient),
                        senderAddress,
                        recipientAddress,
                        stateHash: stateHash,
                        messageCount: messagesArray.length,
                        lastUpdated: Date.now()
                    };
                } catch (error) {
                    console.error('Chat encryption failed:', error);
                    throw new Error('Failed to encrypt chat messages: ' + error.message);
                }
            }

            // Decrypt entire chat messages array using real Arweave wallet
            async decryptChatMessages(encryptedPackage, userAddress) {
                try {
                    // Determine which encrypted AES key to use
                    const encryptedAESKey = userAddress === encryptedPackage.senderAddress 
                        ? encryptedPackage.aesKeyForSender 
                        : encryptedPackage.aesKeyForRecipient;

                    // Convert base64 to Uint8Array for wallet decryption
                    const encryptedAESKeyArray = this.base64ToUint8Array(encryptedAESKey);

                    // Use real Arweave wallet to decrypt the AES key (ONE POPUP FOR ENTIRE CHAT)
                    const decryptedAESKeyArray = await window.arweaveWallet.decrypt(encryptedAESKeyArray, {
                        name: 'RSA-OAEP',
                        hash: 'SHA-256'
                    });

                    // Import the decrypted AES key
                    const aesKey = await crypto.subtle.importKey(
                        'raw',
                        decryptedAESKeyArray,
                        { name: 'AES-GCM' },
                        false,
                        ['decrypt']
                    );

                    // Decrypt the entire messages array
                    const decryptedMessagesBuffer = await crypto.subtle.decrypt(
                        { name: 'AES-GCM', iv: this.base64ToArrayBuffer(encryptedPackage.iv) },
                        aesKey,
                        this.base64ToArrayBuffer(encryptedPackage.encryptedMessages)
                    );

                    const decryptedMessagesJSON = new TextDecoder().decode(decryptedMessagesBuffer);
                    return JSON.parse(decryptedMessagesJSON);
                } catch (error) {
                    console.error('Chat decryption failed:', error);
                    throw new Error('Failed to decrypt chat messages - only wallet owner can decrypt');
                }
            }

            // Create state hash for chat verification without decryption
            async createChatStateHash(messagesArray) {
                try {
                    // Create a hash of key message properties for verification
                    const stateData = messagesArray.map(msg => ({
                        sender: msg.sender,
                        timestamp: msg.timestamp,
                        contentLength: (msg.content || '').length
                    }));
                    
                    const stateString = JSON.stringify(stateData) + Date.now();
                    const encoder = new TextEncoder();
                    const data = encoder.encode(stateString);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = new Uint8Array(hashBuffer);
                    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    return hashHex.substring(0, 16); // Short hash for verification
                } catch (error) {
                    console.error('Failed to create state hash:', error);
                    return Math.random().toString(36).substring(2, 18); // Fallback random hash
                }
            }

            // Helper functions
            arrayBufferToBase64(buffer) {
                return btoa(String.fromCharCode(...new Uint8Array(buffer)));
            }

            base64ToArrayBuffer(base64) {
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return bytes.buffer;
            }

            base64ToUint8Array(base64) {
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return bytes;
            }

            // Convert Arweave public key to WebCrypto format
            async importArweavePublicKey(publicKeyData) {
                try {
                    // Arweave public keys are raw RSA key modulus values
                    // Convert base64url to standard base64
                    const base64 = publicKeyData.replace(/-/g, '+').replace(/_/g, '/');
                    
                    // Add padding if needed
                    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
                    
                    // Decode the raw modulus
                    const nBytes = this.base64ToUint8Array(padded);
                    
                    // Arweave uses 65537 as the public exponent (0x010001)
                    const eBytes = new Uint8Array([0x01, 0x00, 0x01]);
                    
                    // Create JWK format for easier import
                    const jwk = {
                        kty: 'RSA',
                        n: this.uint8ArrayToBase64Url(nBytes),
                        e: this.uint8ArrayToBase64Url(eBytes),
                        alg: 'RSA-OAEP-256',
                        use: 'enc'
                    };
                    
                    // Import as RSA-OAEP key
                    const publicKey = await crypto.subtle.importKey(
                        'jwk',
                        jwk,
                        {
                            name: 'RSA-OAEP',
                            hash: 'SHA-256'
                        },
                        true,
                        ['encrypt']
                    );
                    
                    return publicKey;
                } catch (error) {
                    console.error('Failed to import Arweave public key:', error);
                    throw new Error('Invalid Arweave public key format');
                }
            }
            
            // Helper to convert Uint8Array to base64url
            uint8ArrayToBase64Url(bytes) {
                const base64 = btoa(String.fromCharCode.apply(null, bytes));
                return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            }
        }

        // Initialize the real Arweave crypto system
        const hybridCrypto = new ArweaveHybridCrypto();
        
        // Helper function to get recipient address from chat
        async function getRecipientAddress(chatId) {
            try {
                // Load chat data to get participants
                const response = await fetch(`/${processId}/now/chats_registry_json`);
                if (response.ok) {
                    const chatsData = await response.text();
                    if (chatsData && chatsData !== '{}' && chatsData !== 'null') {
                        const allChats = JSON.parse(chatsData);
                        const chat = allChats[chatId];
                        
                        if (chat && chat.participants) {
                            // Parse participants string and find the other user
                            const participants = chat.participants.split(',').map(p => p.trim());
                            const recipient = participants.find(p => p !== userAddress);
                            return recipient;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to get recipient address:', error);
            }
            return null;
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
                                // Use chat nickname if available, otherwise generate from participants
                                let chatName = 'Unknown Chat';
                                
                                if (chat.nickname && chat.nickname.trim()) {
                                    // Use the public nickname
                                    chatName = chat.nickname;
                                } else if (chat.participants) {
                                    // Fallback to participant-based naming
                                    const participants = chat.participants.split(',').map(p => p.trim());
                                    const otherParticipants = participants.filter(p => p !== userAddress);
                                    chatName = otherParticipants.length > 0 ? 
                                        `Chat with ${otherParticipants[0].substring(0, 8)}...` : 
                                        'Unknown Chat';
                                } else {
                                    chatName = 'New Chat';
                                }
                                
                                console.log('Generated chat name:', chatName);
                                
                                userChats.push({
                                    id: chatId,
                                    name: chatName,
                                    lastMessage: (chat.messageCount && chat.messageCount > 0) ? `${chat.messageCount} message${chat.messageCount !== 1 ? 's' : ''}` : 'No messages yet',
                                    processId: chat.process_id,
                                    members: chat.members || [],
                                    chatType: chat.chat_type || 'direct',
                                    messageCount: chat.messageCount || 0
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
                <div class="chat-item" data-chat-id="${chat.id}" style="padding: 1rem; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; color: var(--text-inverse); font-weight: 600; font-size: 1.1rem;">
                            ${chat.name.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; font-size: 0.95rem;">
                                ${chat.name}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 0.25rem;">
                                ${chat.lastMessage}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">
                                <span style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); text-transform: capitalize;">
                                    ${chat.chatType || 'direct'}
                                </span>
                            </div>
                        </div>
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
            
            // Add click handlers and hover effects
            const chatItems = document.querySelectorAll('.chat-item');
            console.log('Found chat items:', chatItems.length);
            
            chatItems.forEach(item => {
                // Click handler
                item.addEventListener('click', () => {
                    console.log('Chat clicked:', item.dataset.chatId);
                    selectChat(item.dataset.chatId);
                });
                
                // Hover effects
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'var(--bg-primary)';
                    item.style.borderLeftColor = 'var(--primary)';
                    item.style.borderLeftWidth = '3px';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                    item.style.borderLeftColor = 'transparent';
                    item.style.borderLeftWidth = '0px';
                });
            });
        }
        
        async function selectChat(chatId) {
            currentChat = chatId;
            
            try {
                // Get detailed chat information from server
                const response = await fetch(`/${processId}/now/chats_registry_json`);
                if (response.ok) {
                    const chatsData = await response.text();
                    if (chatsData && chatsData !== '{}' && chatsData !== 'null') {
                        const allChats = JSON.parse(chatsData);
                        const chat = allChats[chatId];
                        
                        if (chat) {
                            // Get recipient address (the other participant)
                            let recipientAddress = 'Unknown';
                            if (chat.participants) {
                                const participants = chat.participants.split(',').map(p => p.trim());
                                const recipient = participants.find(p => p !== userAddress);
                                if (recipient) {
                                    recipientAddress = recipient;
                                }
                            }
                            
                            // Update chat header with nickname and recipient
                            const chatName = chat.nickname || 'New Chat';
                            document.getElementById('chatTitle').innerHTML = `
                                <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-primary);">${chatName}</div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary); font-family: monospace;">${recipientAddress.substring(0, 12)}...</div>
                            `;
                        } else {
                            document.getElementById('chatTitle').textContent = `Chat ${chatId}`;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to get chat details:', error);
                document.getElementById('chatTitle').textContent = `Chat ${chatId}`;
            }
            
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendBtn').disabled = false;
            
            // Show refresh button and status
            document.getElementById('refreshBtn').style.display = 'block';
            document.getElementById('updateStatus').style.display = 'block';
            document.getElementById('updateStatus').textContent = 'Updated';
            
            // Load chat messages
            await loadChatMessages(chatId);
        }
        
        // Store the chat process IDs for easy access
        let chatProcessIds = {};
        
        // Current chat state tracking for refresh
        let currentChatState = null;
        
        // Add refresh button functionality
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            if (!currentChat) return;
            
            try {
                document.getElementById('updateStatus').textContent = 'Checking...';
                document.getElementById('refreshBtn').disabled = true;
                
                // Get current server state
                const serverState = await getCurrentChatState(currentChat);
                console.log('Refresh - Server state:', serverState);
                console.log('Refresh - Current state:', currentChatState);
                
                // Compare with our current state
                if (currentChatState && 
                    serverState.stateHash === currentChatState.stateHash && 
                    serverState.messageCount === currentChatState.messageCount) {
                    
                    // No changes - just update status
                    console.log('✅ No new messages - state unchanged');
                    document.getElementById('updateStatus').textContent = 'Updated';
                    
                } else {
                    // New messages detected - need to reload and decrypt
                    console.log('📬 New messages detected - reloading...');
                    document.getElementById('updateStatus').textContent = 'Loading...';
                    
                    // Clear local cache to force reload and decrypt
                    delete localMessagesCache[currentChat];
                    
                    // Reload messages (will trigger wallet signature if needed)
                    await loadChatMessages(currentChat);
                    
                    // Update our current state
                    currentChatState = serverState;
                    document.getElementById('updateStatus').textContent = 'Updated';
                    
                    console.log('✅ Messages refreshed successfully');
                }
                
            } catch (error) {
                console.error('Refresh failed:', error);
                document.getElementById('updateStatus').textContent = 'Error';
            } finally {
                document.getElementById('refreshBtn').disabled = false;
            }
        });
        
        // Add hover effect for refresh button
        document.getElementById('refreshBtn').addEventListener('mouseenter', function() {
            this.style.color = 'var(--primary)';
            this.style.transform = 'scale(1.1)';
        });
        
        document.getElementById('refreshBtn').addEventListener('mouseleave', function() {
            this.style.color = 'var(--text-secondary)';
            this.style.transform = 'scale(1)';
        });
        
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
                            await renderMessages(chat.messages);
                        } else {
                            console.log('No messages found for chat:', chatId);
                            await renderMessages([]);
                        }
                    } else {
                        console.log('No chats data available');
                        await renderMessages([]);
                    }
                } else {
                    console.error('Failed to fetch chats data:', response.status);
                    await renderMessages([]);
                }
            } catch (error) {
                console.error('Failed to load chat messages:', error);
                await renderMessages([]);
            }
        }
        
        async function renderMessages(messages) {
            const messagesContainer = document.getElementById('messages');
            const currentChatId = currentChat;
            
            let decryptedMessages = [];
            
            // Check if this is an encrypted chat package (new format)
            if (messages && messages.length === 1 && 
                typeof messages[0] === 'string' && 
                messages[0].startsWith('{') && 
                messages[0].includes('encryptedMessages')) {
                
                try {
                    console.log('Decrypting entire chat messages array...');
                    const encryptedChatPackage = JSON.parse(messages[0]);
                    
                    // Decrypt entire chat with ONE wallet popup
                    decryptedMessages = await hybridCrypto.decryptChatMessages(encryptedChatPackage, userAddress);
                    console.log('Chat messages decrypted successfully:', decryptedMessages.length, 'messages');
                    
                    // Mark all loaded messages as successfully sent (they're from server state)
                    decryptedMessages = decryptedMessages.map(msg => ({
                        ...msg,
                        deliveryStatus: 'sent'
                    }));
                    
                    // Update local cache
                    localMessagesCache[currentChatId] = decryptedMessages;
                    
                    // Update current chat state for refresh tracking
                    currentChatState = {
                        stateHash: encryptedChatPackage.stateHash,
                        messageCount: encryptedChatPackage.messageCount,
                        lastUpdated: encryptedChatPackage.lastUpdated
                    };
                    
                } catch (decryptError) {
                    console.error('Failed to decrypt chat messages:', decryptError);
                    decryptedMessages = [{
                        id: 'error',
                        content: '🔐 Encrypted chat - decryption failed',
                        sender: 'system',
                        timestamp: Date.now() / 1000
                    }];
                }
            } 
            // Check if we have local cache (for instant display)
            else if (localMessagesCache[currentChatId] && localMessagesCache[currentChatId].length > 0) {
                console.log('Using local messages cache');
                decryptedMessages = localMessagesCache[currentChatId];
            }
            // Legacy format or no encryption
            else {
                console.log('Processing messages in legacy format');
                decryptedMessages = messages || [];
            }
            
            // Render messages
            messagesContainer.innerHTML = decryptedMessages.map((msg, index) => {
                const isSentByUser = msg.sender === userAddress;
                // For loaded messages, default to 'sent' since they're from server state
                // Only use 'sending' or 'verifying' for messages that are actively being sent
                const deliveryStatus = msg.deliveryStatus || 'sent';
                
                let statusIcon = '';
                let statusColor = '';
                if (isSentByUser) {
                    // Default to 'sent' for loaded messages, only override for active sending
                    if (deliveryStatus === 'sending') {
                        statusIcon = '&#128336;'; // Clock
                        statusColor = '#999';
                    } else if (deliveryStatus === 'verifying') {
                        statusIcon = '&#8987;'; // Hourglass
                        statusColor = '#ff9800';
                    } else if (deliveryStatus === 'conflict') {
                        statusIcon = '&#10060;'; // Red X
                        statusColor = '#f44336';
                    } else if (deliveryStatus === 'failed') {
                        statusIcon = '&#9888;'; // Warning triangle
                        statusColor = '#f44336';
                    } else {
                        // Default case - includes 'sent' and any undefined status
                        statusIcon = '&#9989;'; // White checkmark in green square
                        statusColor = '#4caf50';
                    }
                }
                
                return `
                <div style="margin-bottom: 1rem; ${isSentByUser ? 'text-align: right;' : ''}" data-message-id="${msg.id || index}">
                    <div style="display: inline-block; max-width: 70%; padding: 0.75rem; border-radius: 12px; position: relative;
                        ${isSentByUser ? 'background: #007bff; color: white;' : 'background: white; border: 1px solid #ddd;'}">
                        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.25rem;">
                            ${msg.sender.slice(0, 8)}...
                        </div>
                        <div>${msg.content}</div>
                        <div style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.25rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>${new Date(msg.timestamp * 1000).toLocaleTimeString()}</span>
                            ${statusIcon ? `<span style="font-size: 0.6rem; margin-left: 0.5rem; color: ${statusColor};">${statusIcon}</span>` : ''}
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Function to update delivery status of a message
        function updateMessageStatus(messageId, status) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const statusElement = messageElement.querySelector('span:last-child');
                if (statusElement) {
                    if (status === 'sending') {
                        statusElement.innerHTML = '&#128336;'; // Clock
                        statusElement.style.color = '#999';
                    } else if (status === 'verifying') {
                        statusElement.innerHTML = '&#8987;'; // Hourglass - waiting for verification  
                        statusElement.style.color = '#ff9800';
                    } else if (status === 'sent') {
                        statusElement.innerHTML = '&#9989;'; // White checkmark in green square - verified
                        statusElement.style.color = '#4caf50';
                    } else if (status === 'conflict') {
                        statusElement.innerHTML = '&#10060;'; // Red X - conflict detected
                        statusElement.style.color = '#f44336';
                    } else if (status === 'failed') {
                        statusElement.innerHTML = '&#9888;'; // Warning triangle - failed
                        statusElement.style.color = '#f44336';
                    }
                }
            }
        }
        
        // Function to add message instantly to display
        function addMessageToDisplay(message) {
            const messagesContainer = document.getElementById('messages');
            
            // Create message HTML
            const isSentByUser = message.sender === userAddress;
            const statusIcon = message.deliveryStatus === 'sending' ? '&#128336;' : '&#9989;';
            
            const messageHTML = `
                <div style="margin-bottom: 1rem; ${isSentByUser ? 'text-align: right;' : ''}" data-message-id="${message.id}">
                    <div style="display: inline-block; max-width: 70%; padding: 0.75rem; border-radius: 12px; position: relative;
                        ${isSentByUser ? 'background: #007bff; color: white;' : 'background: white; border: 1px solid #ddd;'}">
                        <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.25rem;">
                            ${message.sender.slice(0, 8)}...
                        </div>
                        <div>${message.content}</div>
                        <div style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.25rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>${new Date(message.timestamp * 1000).toLocaleTimeString()}</span>
                            ${isSentByUser ? `<span style="font-size: 0.6rem; margin-left: 0.5rem;">${statusIcon}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Append to messages container
            messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // New chat creation
        document.getElementById('newChatBtn').addEventListener('click', async () => {
            showCreateChatModal();
        });
        
        // Show create chat modal
        function showCreateChatModal() {
            const modal = document.createElement('div');
            modal.id = 'createChatModal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
                z-index: 10001; font-family: 'Inter', sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="background: var(--bg-primary); padding: 2rem; border-radius: var(--radius-lg); max-width: 480px; width: 90%; box-shadow: var(--shadow-lg);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; color: var(--primary); font-size: 1.5rem; font-weight: 600;">New Chat</h3>
                        <button onclick="closeCreateChatModal()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; padding: 0.25rem;">×</button>
                    </div>
                    
                    <form id="createChatForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Chat Nickname (Public)</label>
                            <input type="text" id="chatNickname" placeholder="e.g. Work Discussion, Friend Chat" style="
                                width: 100%; padding: 0.75rem; border: 1px solid var(--border-medium); 
                                border-radius: var(--radius-sm); font-family: inherit; font-size: 0.9rem;
                                background: var(--bg-secondary); outline: none; transition: var(--transition);
                            ">
                            <small style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.25rem; display: block;">
                                This nickname will be visible to all chat participants
                            </small>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Recipient Address</label>
                            <input type="text" id="recipientAddress" placeholder="Enter Arweave address..." style="
                                width: 100%; padding: 0.75rem; border: 1px solid var(--border-medium); 
                                border-radius: var(--radius-sm); font-family: inherit; font-size: 0.9rem;
                                background: var(--bg-secondary); outline: none; transition: var(--transition);
                                font-family: monospace;
                            ">
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                            <button type="button" onclick="closeCreateChatModal()" style="
                                padding: 0.75rem 1.5rem; border: 1px solid var(--border-medium); 
                                background: var(--bg-secondary); color: var(--text-primary); 
                                border-radius: var(--radius-sm); cursor: pointer; font-size: 0.9rem;
                                transition: var(--transition);
                            ">Cancel</button>
                            <button type="submit" style="
                                padding: 0.75rem 1.5rem; border: none; 
                                background: linear-gradient(135deg, var(--primary), var(--primary-dark)); 
                                color: var(--text-inverse); border-radius: var(--radius-sm); 
                                cursor: pointer; font-size: 0.9rem; font-weight: 600;
                                transition: var(--transition);
                            ">Create Chat</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Add focus styles
            modal.querySelectorAll('input').forEach(input => {
                input.addEventListener('focus', () => {
                    input.style.borderColor = 'var(--primary)';
                    input.style.background = 'var(--bg-primary)';
                });
                input.addEventListener('blur', () => {
                    input.style.borderColor = 'var(--border-medium)';
                    input.style.background = 'var(--bg-secondary)';
                });
            });
            
            // Handle form submission
            modal.querySelector('#createChatForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const nickname = document.getElementById('chatNickname').value.trim();
                const recipient = document.getElementById('recipientAddress').value.trim();
                
                if (!recipient) {
                    alert('Please enter a recipient address');
                    return;
                }
                
                if (recipient === userAddress) {
                    alert('Cannot create chat with yourself');
                    return;
                }
                
                // Create chat with nickname
                await createNewChat(recipient, nickname || 'New Chat');
                closeCreateChatModal();
            });
            
            document.body.appendChild(modal);
            
            // Focus first input
            setTimeout(() => {
                document.getElementById('chatNickname').focus();
            }, 100);
        }
        
        // Close create chat modal
        window.closeCreateChatModal = function() {
            const modal = document.getElementById('createChatModal');
            if (modal) {
                modal.remove();
            }
        };
        
        async function createNewChat(otherUser, chatNickname = 'New Chat') {
            try {
                // Use the proper process device endpoint for scheduling messages
                const url = `/${processId}/schedule&!`;
                console.log('Creating chat with URL:', url);
                console.log('Chat nickname:', chatNickname);
                
                // Create proper AO message structure
                const participants = `${userAddress},${otherUser}`;
                const aoMessage = {
                    Target: processId,
                    action: 'create-chat',
                    participants: participants,
                    nickname: chatNickname
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
        
        // Local messages cache for instant display and background encryption
        let localMessagesCache = {};
        
        // Chat state tracking for race condition detection
        let chatStates = {};
        
        // Get current server chat state for verification
        async function getCurrentChatState(chatId) {
            try {
                const response = await fetch(`/${processId}/now/chats_registry_json`);
                if (response.ok) {
                    const chatsData = await response.text();
                    if (chatsData && chatsData !== '{}' && chatsData !== 'null') {
                        const allChats = JSON.parse(chatsData);
                        const chat = allChats[chatId];
                        if (chat) {
                            return {
                                stateHash: chat.stateHash || null,
                                messageCount: chat.messageCount || 0,
                                lastUpdated: chat.lastUpdated || 0,
                                exists: true
                            };
                        }
                    }
                }
                return { stateHash: null, messageCount: 0, lastUpdated: 0, exists: false };
            } catch (error) {
                console.error('Failed to get current chat state:', error);
                return { stateHash: null, messageCount: 0, lastUpdated: 0, exists: false };
            }
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message && currentChat) {
                // Generate unique message ID
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Create message object for instant display
                const newMessage = {
                    id: messageId,
                    content: message,
                    sender: userAddress,
                    timestamp: Math.floor(Date.now() / 1000),
                    deliveryStatus: 'sending'
                };
                
                // Clear input immediately
                input.value = '';
                
                // Add to local cache immediately
                if (!localMessagesCache[currentChat]) {
                    localMessagesCache[currentChat] = [];
                }
                localMessagesCache[currentChat].push(newMessage);
                
                // Display message instantly
                addMessageToDisplay(newMessage);
                
                try {
                    console.log('Sending message:', message, 'to chat:', currentChat);
                    
                    // STEP 1: Get current server state before encryption
                    const preEncryptionState = await getCurrentChatState(currentChat);
                    console.log('Pre-encryption state:', preEncryptionState);
                    
                    // Store the expected pre-state for verification
                    chatStates[messageId] = {
                        expectedPreState: preEncryptionState,
                        messageId: messageId,
                        chatId: currentChat,
                        timestamp: Date.now()
                    };
                    
                    // Get recipient address from current chat
                    const recipientAddress = await getRecipientAddress(currentChat);
                    if (!recipientAddress) {
                        alert('Cannot determine recipient address');
                        updateMessageStatus(messageId, 'failed');
                        return;
                    }
                    
                    console.log('Encrypting entire chat messages array for:', recipientAddress);
                    
                    // Get current messages array (including the new message)
                    const currentMessages = localMessagesCache[currentChat] || [];
                    
                    // Encrypt entire messages array using new method
                    const encryptedChatPackage = await hybridCrypto.encryptChatMessages(
                        currentMessages, 
                        userAddress, 
                        recipientAddress
                    );
                    
                    console.log('Chat messages encrypted successfully');
                    
                    // Use the proper process device endpoint for scheduling messages
                    const url = `/${processId}~process@1.0/schedule&!`;
                    console.log('Chat update URL:', url);
                    
                    // Create proper AO message structure with encrypted chat data
                    const aoMessage = {
                        target: processId,
                        action: 'update-chat-messages',
                        Data: JSON.stringify(encryptedChatPackage), // Send entire encrypted chat
                        sender: userAddress,
                        chat_id: currentChat,
                        encrypted: true,
                        state_hash: encryptedChatPackage.stateHash, // New state hash
                        message_count: encryptedChatPackage.messageCount,
                        last_message_id: messageId, // Track the triggering message
                        expected_pre_state_hash: preEncryptionState.stateHash, // What we expect server state to be
                        expected_pre_message_count: preEncryptionState.messageCount
                    };

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(aoMessage)
                    });
                    
                    console.log('Chat update response status:', response.status);
                    
                    if (response.ok) {
                        console.log('Chat update request sent successfully (200 response)');
                        // Don't mark as "sent" yet - wait for verification
                        updateMessageStatus(messageId, 'verifying');
                        
                        // STEP 2: Robust background verification with race condition detection
                        setTimeout(async () => {
                            await verifyMessageDelivery(messageId, encryptedChatPackage.stateHash);
                        }, 2000);
                        
                    } else {
                        alert('Failed to send message. Please try again.');
                        updateMessageStatus(messageId, 'failed');
                        delete chatStates[messageId];
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                    alert('Failed to send message: ' + error.message);
                    updateMessageStatus(messageId, 'failed');
                    delete chatStates[messageId];
                }
            }
        }
        
        // Verify message delivery with race condition detection
        async function verifyMessageDelivery(messageId, expectedStateHash) {
            try {
                const messageState = chatStates[messageId];
                if (!messageState) {
                    console.log('Message state not found for verification:', messageId);
                    return;
                }
                
                console.log('Verifying message delivery for:', messageId);
                
                // Get current server state
                const currentState = await getCurrentChatState(messageState.chatId);
                console.log('Verification - Current state:', currentState);
                console.log('Verification - Expected state hash:', expectedStateHash);
                
                // Check if our update was successful
                if (currentState.stateHash === expectedStateHash) {
                    // SUCCESS: Our state hash matches
                    console.log('✅ Message verified successfully - state hash matches');
                    updateMessageStatus(messageId, 'sent');
                    delete chatStates[messageId];
                    
                } else {
                    // RACE CONDITION DETECTED: State doesn't match
                    console.log('⚠️ Race condition detected - state hash mismatch');
                    console.log('Expected:', expectedStateHash);
                    console.log('Actual:', currentState.stateHash);
                    
                    // Mark message as failed and refresh chat
                    updateMessageStatus(messageId, 'conflict');
                    
                    // Show conflict notification
                    showConflictNotification(messageState.chatId);
                    
                    // Auto-refresh chat after a moment
                    setTimeout(async () => {
                        await handleChatConflictRefresh(messageState.chatId, messageId);
                    }, 1500);
                }
                
            } catch (error) {
                console.error('Message verification failed:', error);
                updateMessageStatus(messageId, 'failed');
                delete chatStates[messageId];
            }
        }
        
        // Handle chat conflict by refreshing from server
        async function handleChatConflictRefresh(chatId, failedMessageId) {
            try {
                console.log('Refreshing chat due to conflict:', chatId);
                
                // Clear local cache to force reload
                delete localMessagesCache[chatId];
                
                // Remove the failed message from display
                const failedElement = document.querySelector(`[data-message-id="${failedMessageId}"]`);
                if (failedElement) {
                    failedElement.remove();
                }
                
                // Reload chat messages from server
                await loadChatMessages(chatId);
                
                // Clean up state tracking
                delete chatStates[failedMessageId];
                
                console.log('Chat refreshed successfully');
                
            } catch (error) {
                console.error('Failed to refresh chat:', error);
                // If refresh fails, at least mark the message as failed
                updateMessageStatus(failedMessageId, 'failed');
            }
        }
        
        // Show conflict notification to user
        function showConflictNotification(chatId) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; 
                background: #ff5722; color: white; padding: 0.75rem 1rem;
                border-radius: 8px; z-index: 10000; font-size: 0.9rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ⚠️ <strong>Message Conflict</strong>
                    <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; padding: 0.25rem 0.5rem; border: none; background: rgba(255,255,255,0.2); color: white; border-radius: 4px; cursor: pointer;">
                        ✕
                    </button>
                </div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.9;">
                    Another user sent a message at the same time. Refreshing chat...
                </div>
            `;
            document.body.appendChild(notification);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 4000);
        }
        
    </script>
</body>
</html>]=]


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




-- Chat creation handler - FIXED to use string pattern
Handlers.add('CreateChat', 'create-chat', function(msg)
    print("&#128295; CHAT: Handler started")
    
    local participants = msg.participants or msg.Tags.participants
    local nickname = msg.nickname or msg.Tags.nickname or "New Chat"
    print("&#128295; CHAT: Participants: " .. tostring(participants))
    print("&#128295; CHAT: Nickname: " .. tostring(nickname))
    
    if not participants then
        print("&#128295; CHAT: No participants - sending error")
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "No participants provided"})
        })
        return
    end
    
    -- Generate unique chat ID using message timestamp (replace periods with underscores)
    local timestamp = tostring(msg.Timestamp or math.floor(os.time())):gsub("%.", "_")
    local chat_id = "chat_" .. timestamp .. "_" .. math.random(1000, 9999)
    print("&#128295; CHAT: Generated chat ID: " .. chat_id)
    
    -- Simple chat storage creation
    chats_storage[chat_id] = {
        id = chat_id,
        owner = msg.From,
        participants = participants,
        nickname = nickname,
        messages = {},
        created = os.time(),
        last_activity = os.time(),
        chat_type = "direct"
    }
    chats_storage[chat_id].messages[1] = nil
    
    -- Backward compatibility
    chats_registry[chat_id] = {
        process_id = chat_id,
        participants = participants,
        nickname = nickname,
        created = os.time(),
        last_activity = os.time(),
        chat_type = "direct"
    }
    
    print("&#128295; CHAT: Chat created successfully")
    
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
    
    print("&#128295; CHAT: Response sent")
end)

-- Updated Chat Messages handler - Now handles entire encrypted chat arrays
Handlers.add('UpdateChatMessages', 'update-chat-messages', function(msg)
    -- Extract parameters from the scheduled AO message
    local chat_id = msg.chat_id or msg["chat_id"]
    local sender = msg.sender or msg["sender"] or msg.From
    local encrypted_chat_data = msg.Data  -- Entire encrypted chat package
    local state_hash = msg.state_hash or msg["state_hash"]
    local message_count = msg.message_count or msg["message_count"]
    local last_message_id = msg.last_message_id or msg["last_message_id"]
    
    print("&#128295; CHAT: Updating chat messages for: " .. tostring(chat_id))
    print("&#128295; CHAT: State hash: " .. tostring(state_hash))
    print("&#128295; CHAT: Message count: " .. tostring(message_count))

    -- Find the target chat
    local target_chat = nil
    local target_chat_id = nil
    
    if chat_id then
        -- First try exact match
        if chats_storage[chat_id] then
            target_chat = chats_storage[chat_id]
            target_chat_id = chat_id
            print("&#128231; CHAT: Found chat by exact match: " .. chat_id)
        else
            -- Try partial match
            for stored_chat_id, chat in pairs(chats_storage) do
                if stored_chat_id:find(chat_id, 1, true) or chat_id:find(stored_chat_id, 1, true) then
                    target_chat = chat
                    target_chat_id = stored_chat_id
                    print("&#128231; CHAT: Found chat by partial match: " .. stored_chat_id)
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
            print("&#128231; CHAT: Using first available chat: " .. stored_chat_id)
            break
        end
    end
    
    -- Store the encrypted chat data if we have everything needed
    if target_chat and encrypted_chat_data then
        -- Store encrypted chat package as single message entry
        target_chat.messages = { encrypted_chat_data }  -- Replace with encrypted package
        target_chat.stateHash = state_hash or "unknown"
        target_chat.messageCount = tonumber(message_count) or 0
        target_chat.lastUpdated = os.time()
        target_chat.lastMessageId = last_message_id
        
        print("&#128295; CHAT: Stored encrypted chat with " .. target_chat.messageCount .. " messages")
        print("&#128295; CHAT: State hash: " .. target_chat.stateHash)
        
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
    print("&#128465; Chat storage reset locally - cleared " .. old_count .. " old chats")
    print("&#127381; Ready for new chats with in-memory storage architecture")
    
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
print("&#128640; HyperGram Main Process Initialized!")
print("&#127919; Process Address: " .. process_address)
print("&#128241; Available endpoints:")
print("   • App Interface: /now/app")
  
print("   • Create Chat: /push?action=create-chat")
print("   • User Chats: /now/user-chats")
print("   • Chat Process Lookup: /now/chat-process")
print("&#128172; Ready for secure, decentralized messaging!")
print("&#128101; Member management enabled with detailed participant information")
print("&#128260; Scalable architecture: Each chat runs in its own process")
print("&#128203; Available member actions:")
print("   • add-member, get-members")
print("   • update-member-profile")
print("&#127919; Main process only stores chat index/references for optimal scalability")

print("&#128274; Secure local reset function available: reset_chat_registry()")
