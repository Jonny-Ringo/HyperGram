# HyperGram

**Decentralized End-to-End Encrypted Group Messaging on AO**

**Updated:** 2025-10-02
**Docs Version:** v0.1
**Current Version:** Alpha 0.3.0

---

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Architecture Summary](#architecture-summary)
- [Login Flow](#login-flow)
- [Create Group Chat](#create-group-chat)
- [Messaging & Sync](#messaging--sync)
- [Reactions](#reactions)
- [Contacts](#contacts)
- [Security Model](#security-model)
- [Public Key Source](#public-key-source)
- [Versioning](#versioning)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

---

## Quick Start

1. **Serve the application:**
   ```bash
   # Navigate to the hypergram-legacy directory
   cd Legacynet-version/hypergram-legacy

   # Serve index.html with any HTTP server (e.g., Python)
   python -m http.server 8000
   ```

2. **Connect your wallet:**
   - Install the [Wander](https://wander.arweave.dev) browser extension
   - Open `http://localhost:8000` in your browser
   - Click "Connect Wallet" and approve the connection

3. **Configure MASTER_PROCESS_ID:**
   - Open `legacy-hypergram-js.js`
   - Update line ~367:
     ```javascript
     const MASTER_PROCESS_ID = 'YOUR_DEPLOYED_MASTER_PROCESS_ID_HERE';
     ```

4. **Start messaging:**
   - Create a new group chat with one or more members
   - All messages are end-to-end encrypted and stored on AO/Arweave

---

## Requirements

- **Wander Wallet**: Browser extension for Arweave wallet connection
- **Modern Browser**: Chrome, Firefox, or Edge with Web Crypto API support
- **AO Connectivity**: Access to Arweave/AO network (automatic via @permaweb/aoconnect)
- **HTTP Server**: Any static file server for local development

---

## Architecture Summary

HyperGram uses a **master/child process architecture** for scalability:

```
┌─────────────┐
│   Frontend  │ (index.html + legacy-hypergram-js.js)
└──────┬──────┘
       │
       ├─ Login → MASTER_PROCESS_ID
       │          ├─ New User: Spawns child process
       │          └─ Existing User: Returns process ID
       │
       └─ All Actions → USER_PROCESS_ID (child)
                       ├─ create-chat
                       ├─ update-chat-messages
                       ├─ add-reaction
                       ├─ add-member
                       └─ update-contacts
```

### Key Components

1. **Master Process** (`lua/master-process.lua`):
   - Ultra-lightweight user-to-process mapping
   - Spawns dedicated child process for each new user
   - Tracks `UserProcessMap[userAddress] → { ownedProcesses, recipientProcesses, BUILD_VERSION }`

2. **Child Processes** (spawned per user):
   - Complete data isolation per user
   - Owner validation on all handlers (`msg.From == OWNER_ADDRESS`)
   - Stores user's chats, messages, contacts, and state

3. **Group Chat Model**:
   - Each chat has a `members` array: `[{address, encryptedKey, joinedAt}, ...]`
   - Shared AES-256-GCM key encrypted per member with RSA-OAEP
   - Messages table: `{userAddress: [encryptedPackage], ...}`
   - State hashes and counts tracked per member for sync optimization

### Performance Benefits

- **Scalability**: Supports 1000+ concurrent users (vs. 100 on single-process)
- **Isolation**: No cross-user data access or contention
- **Parallel Processing**: Each user's operations run independently
- **Linear Scaling**: Performance scales linearly with user count

---

## Login Flow

### User Experience

When a user connects their wallet, HyperGram shows only a **spinner** until login completes. No extra screens or confirmations.

### Technical Flow

1. User connects Wander wallet → frontend gets `userAddress`
2. Frontend sends `Login` action to `MASTER_PROCESS_ID`:
   ```javascript
   import { message, result } from '@permaweb/aoconnect';

   const messageId = await message({
       process: MASTER_PROCESS_ID,
       tags: [{ name: 'Action', value: 'Login' }],
       signer: createDataItemSigner(wallet),
       data: ""
   });
   ```

3. Master process checks `UserProcessMap`:
   - **New user**: Spawns child process via `ao.spawn()`, injects handlers, returns `processId`
   - **Existing user**: Returns existing `processId` and `BUILD_VERSION`

4. Frontend polls with `results()` until response received:
   ```javascript
   const { Messages } = await result({
       message: messageId,
       process: MASTER_PROCESS_ID
   });

   const userProcessId = Messages[0]?.Tags.find(t => t.name === 'UserProcessId')?.value;
   ```

5. Frontend stores `userProcessId` and proceeds to main interface

### Master Process Handler

```lua
Handlers.add('Login',
    Handlers.utils.hasMatchingTag('Action', 'Login'),
    function(msg)
        local userAddress = msg.From

        if UserProcessMap[userAddress] then
            -- Existing user
            Send({
                Target = msg.From,
                Tags = {
                    { name = "Action", value = "Login-Response" },
                    { name = "UserProcessId", value = UserProcessMap[userAddress].ownedProcesses[1] },
                    { name = "Build-Version", value = UserProcessMap[userAddress].BUILD_VERSION }
                }
            })
        else
            -- Spawn new child process
            local processId = spawnUserProcess(userAddress)
            Send({
                Target = msg.From,
                Tags = {
                    { name = "Action", value = "Login-Response" },
                    { name = "UserProcessId", value = processId },
                    { name = "Build-Version", value = BUILD_VERSION }
                }
            })
        end
    end
)
```

---

## Create Group Chat

### Requirements

- Minimum 1 other member (besides chat owner)
- Each member must have `encryptedKey` (shared AES key encrypted with their RSA public key)
- Invalid members (e.g., no public key available) are **skipped** with a toast notification
- If no valid non-owner members remain, creation **fails**

### Frontend Implementation

```javascript
async function createNewChat(memberAddresses, chatNickname = 'New Chat') {
    // 1. Generate shared AES-256-GCM key
    const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const aesKeyRaw = await crypto.subtle.exportKey('raw', aesKey);
    const aesKeyArray = new Uint8Array(aesKeyRaw);

    // 2. Build members array with encrypted keys
    const members = [];

    // Add owner
    const userPublicKey = await hybridCrypto.getArweavePublicKey(userAddress);
    const userEncryptedKeyBuffer = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        userPublicKey,
        aesKeyArray
    );
    members.push({
        address: userAddress,
        encryptedKey: hybridCrypto.arrayBufferToBase64(userEncryptedKeyBuffer),
        joinedAt: Date.now()
    });

    // Add other members
    for (const memberAddress of memberAddresses) {
        try {
            const memberPublicKey = await hybridCrypto.getArweavePublicKey(memberAddress);
            const memberEncryptedKeyBuffer = await crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                memberPublicKey,
                aesKeyArray
            );
            members.push({
                address: memberAddress,
                encryptedKey: hybridCrypto.arrayBufferToBase64(memberEncryptedKeyBuffer),
                joinedAt: Date.now()
            });
        } catch (error) {
            console.warn(`Skipping invalid member: ${memberAddress}`);
            showToast(`Could not add ${memberAddress} - invalid address`, 'warning');
        }
    }

    // 3. Send to child process
    const messageId = await message({
        process: userProcessId,
        tags: [
            { name: "Action", value: "create-chat" },
            { name: "Members", value: JSON.stringify(members) },
            { name: "Nickname", value: chatNickname }
        ],
        signer: createDataItemSigner(wallet),
        data: ""
    });
}
```

### Child Process Handler

```lua
Handlers.add('CreateChat',
    Handlers.utils.hasMatchingTag('Action', 'create-chat'),
    function(msg)
        if msg.From ~= OWNER_ADDRESS then
            return Send({ Target = msg.From, Data = "Access denied" })
        end

        local membersJson = msg.Tags.Members
        local members = json.decode(membersJson)
        local nickname = msg.Tags.Nickname or "New Chat"

        local chatId = generateChatId()

        Chats[chatId] = {
            chatId = chatId,
            nickname = nickname,
            members = members,
            messages = {},
            stateHashes = {},
            messageCounts = {},
            createdAt = msg.Timestamp
        }

        -- Notify master process for recipient discovery
        local memberAddresses = {}
        for _, member in ipairs(members) do
            table.insert(memberAddresses, member.address)
        end

        Send({
            Target = MASTER_PROCESS_ID,
            Tags = {
                { name = "Action", value = "NotifyChatCreated" },
                { name = "Participants", value = table.concat(memberAddresses, ",") },
                { name = "Chat-Id", value = chatId }
            }
        })
    end
)
```

---

## Messaging & Sync

### Encryption

All messages use **hybrid AES-256-GCM + RSA-OAEP encryption**:

1. Each chat has one shared AES key (generated at creation)
2. AES key is encrypted per member with their RSA public key
3. Messages encrypted with AES-GCM (unique IV per message)
4. Encrypted package stored in `messages[userAddress]`

### State Hash Optimization

To avoid unnecessary decryption, HyperGram uses **state hashes**:

```javascript
// Frontend checks hash before decrypting
const currentStateHash = chat.stateHashes[userAddress] || '';
const storedStateHash = localStorage.getItem(`ownStateHash_${chatId}`);

if (storedStateHash === currentStateHash) {
    // Use cached messages (no decryption needed)
    messages = JSON.parse(localStorage.getItem(`ownMessages_${chatId}`));
} else {
    // State changed - decrypt from server
    messages = await decryptChatMessages(chat.messages[userAddress], userAddress, chatId, chat);
    localStorage.setItem(`ownMessages_${chatId}`, JSON.stringify(messages));
    localStorage.setItem(`ownStateHash_${chatId}`, currentStateHash);
}
```

### Per-Member Message Counts

Each chat tracks message counts per member:

```lua
Chats[chatId].messageCounts = {
    ["address1"] = 15,
    ["address2"] = 8,
    ["address3"] = 23
}
```

Frontend uses this for sync and notifications.

### Unseen Badge Logic

```javascript
// Unseen count = server total - last seen count
const serverTotal = serverTotalCountCache[chatId] || 0;
const lastSeen = lastSeenCount[chatId] || 0;
const unseenCount = Math.max(0, serverTotal - lastSeen);

if (unseenCount > 0) {
    badge.textContent = unseenCount;
    badge.style.display = 'flex';
}
```

When user opens a chat, `lastSeenCount[chatId]` is updated to current total.

### Sending Messages

```javascript
const messageId = await message({
    process: userProcessId,
    tags: [
        { name: "Action", value: "update-chat-messages" },
        { name: "Chat-Id", value: chatId },
        { name: "Message-Package", value: JSON.stringify(encryptedPackage) }
    ],
    signer: createDataItemSigner(wallet),
    data: ""
});
```

Backend validates ownership, updates `messages[msg.From]`, increments `messageCounts[msg.From]`, and recalculates `stateHashes[msg.From]`.

---

## Reactions

### UX Rules

- **Add reaction**: Corner menu **only** (three-dot menu on message)
- **View reactions**: Click reaction bubble shows who reacted (read-only info)
- **No duplication**: Clicking existing reaction bubble does **not** add duplicate

### De-duplication Logic

Reactions are de-duplicated on `(messageId, emoji, reactorAddress)`:

```javascript
// Frontend checks before sending
const existingReaction = message.reactions?.find(r =>
    r.emoji === selectedEmoji && r.reactorAddress === userAddress
);

if (existingReaction) {
    showToast('You already reacted with this emoji', 'info');
    return;
}
```

### Backend Storage

```lua
-- Reactions stored on message object
Messages[messageId].reactions = {
    { emoji = "👍", reactorAddress = "addr1", timestamp = 1234567890 },
    { emoji = "❤️", reactorAddress = "addr2", timestamp = 1234567891 }
}
```

### Add Reaction Example

```javascript
const messageId = await message({
    process: userProcessId,
    tags: [
        { name: "Action", value: "add-reaction" },
        { name: "Chat-Id", value: chatId },
        { name: "Message-Id", value: targetMessageId },
        { name: "Emoji", value: "👍" }
    ],
    signer: createDataItemSigner(wallet),
    data: ""
});
```

Child process handler:

```lua
Handlers.add('AddReaction',
    Handlers.utils.hasMatchingTag('Action', 'add-reaction'),
    function(msg)
        if msg.From ~= OWNER_ADDRESS then return end

        local chatId = msg.Tags["Chat-Id"]
        local messageId = msg.Tags["Message-Id"]
        local emoji = msg.Tags.Emoji

        -- Find message in chat
        local chat = Chats[chatId]
        -- ... locate message and add reaction if not duplicate

        table.insert(message.reactions, {
            emoji = emoji,
            reactorAddress = msg.From,
            timestamp = msg.Timestamp
        })
    end
)
```

---

## Contacts

HyperGram stores contacts as an **encrypted blob** using **hybrid AES + RSA encryption**:

### Storage Model

- Contacts encrypted with AES-256-GCM
- AES key encrypted with user's RSA public key (from wallet)
- Stored in child process: `Contacts = { encryptedData: "...", encryptedKey: "..." }`

### Sync Flow

1. User adds/edits contact locally
2. Frontend encrypts entire contact list
3. Sends to child process with `Action=update-contacts`
4. Child process validates `msg.From == OWNER_ADDRESS` and stores encrypted blob
5. On reconnect, frontend fetches and decrypts contacts

### Contact Structure (Decrypted)

```javascript
[
    {
        id: "contact_1234567890_abc",
        name: "Alice",
        address: "arweave_address_here",
        email: "alice@example.com",  // optional
        phone: "+1-555-0123",         // optional
        twitter: "@alice",            // optional
        linkedin: "linkedin.com/in/alice",  // optional
        company: "Acme Corp",         // optional
        website: "https://alice.com", // optional
        notes: "Met at conference",   // optional
        tags: ["work", "blockchain"]  // optional
    }
]
```

### Update Contacts Example

```javascript
const messageId = await message({
    process: userProcessId,
    tags: [{ name: 'Action', value: 'update-contacts' }],
    signer: createDataItemSigner(wallet),
    data: JSON.stringify({
        encryptedData: base64EncryptedBlob,
        encryptedKey: base64EncryptedAESKey
    })
});
```

---

## Security Model

### Owner Validation

All child process handlers validate ownership:

```lua
if msg.From ~= OWNER_ADDRESS then
    Send({ Target = msg.From, Data = "Access denied - not process owner" })
    return
end
```

This ensures:
- Only the process owner can read/write their data
- No cross-user data access
- Process-level security boundaries

### Idempotency

To prevent duplicate processing, HyperGram tracks processed message IDs:

```lua
local ProcessedMessageIds = ProcessedMessageIds or {}

if ProcessedMessageIds[msg.Id] then
    print("Already processed message: " .. msg.Id)
    return
end

ProcessedMessageIds[msg.Id] = true
```

This prevents:
- Duplicate message sends
- Double reactions
- Race condition artifacts

### Data Isolation

Each user's child process stores:
- **Chats**: Only chats the user is a member of
- **Messages**: Only encrypted messages for this user
- **Contacts**: Only this user's encrypted contacts
- **State**: Only this user's sync state

Master process only stores lightweight mappings (no message content).

---

## Public Key Source

### Primary Source: GraphQL (On-Chain)

HyperGram fetches recipient public keys from **Arweave GraphQL** by querying the user's transaction history:

```javascript
async getArweavePublicKey(address) {
    const query = `
        query {
            transactions(
                owners: ["${address}"],
                first: 1
            ) {
                edges {
                    node {
                        owner {
                            key
                        }
                    }
                }
            }
        }
    `;

    const response = await fetch('https://arweave.net/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    const data = await response.json();
    const publicKeyJWK = data.data.transactions.edges[0].node.owner.key;

    // Import JWK as CryptoKey
    return await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: publicKeyJWK, e: 'AQAB' },
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}
```

### Fallback Strategy (Deferred)

`hybridCrypto` module has fallback methods but they are **optional** for this sprint. GraphQL is the authoritative source.

### Requirements

Recipients must have:
- ✅ At least one signed transaction on Arweave (to establish public key on-chain)
- ❌ Cannot add users who have never signed a transaction

---

## Versioning

HyperGram uses a **three-part version system**:

```
BUILD_VERSION = MASTER_VERSION-USER_PROCESS_VERSION-FRONTEND_VERSION
Example: "A01-A01-A01"
```

### Version Components

1. **MASTER_VERSION**: Master process version (updated on master redeployment)
2. **USER_PROCESS_VERSION**: Child process version (updated via `Update-UserVersion` action)
3. **FRONTEND_VERSION**: Frontend code version (tracked in `legacy-hypergram-js.js`)

### Version Tracking

Master process stores versions per user:

```lua
UserProcessMap[userAddress] = {
    BUILD_VERSION = "A01-A01-A01",
    ownedProcesses = { "processId..." },
    recipientProcesses = { "processId..." }
}
```

Login response includes `BUILD_VERSION` tag for frontend display.

### Update Flow

When deploying updates to user processes:

1. User receives update package and signs eval command
2. Frontend sends `Update-UserVersion` action to child process
3. Child process validates `msg.From == OWNER_ADDRESS`, updates version
4. Child notifies master with `Update-Build` action
5. Master updates `UserProcessMap[user].BUILD_VERSION`
6. Next login returns updated version

Example:

```javascript
// User signs update
const messageId = await message({
    process: userProcessId,
    tags: [
        { name: 'Action', value: 'Update-UserVersion' },
        { name: 'New-Version', value: 'A02' }
    ],
    signer: createDataItemSigner(wallet),
    data: updateCode  // eval code for the update
});

// Next login shows: "A01-A02-A01"
```

---

## Known Limitations

### Multi-Device Sync (Deferred)

- Currently, each wallet is tied to one child process
- Using the same wallet on multiple devices will share the same process
- Multi-device conflict resolution is **not implemented** (future enhancement)

### Member Add Requires Keys

- Adding a member requires encrypting the shared AES key with their public key
- Recipients must have at least one on-chain transaction for public key availability
- Cannot add brand-new wallets that have never signed a transaction

### Overlapping Chats Allowed

- Users can create multiple chats with the same members
- Child process prevents exact duplicate (same owner + same member set) for the same owner
- Different owners can create chats with overlapping members
- This is **by design** to allow different conversation contexts

### No Message Deletion

- Messages are permanent once sent (stored on Arweave)
- Deletion/editing is not supported in current architecture
- Future: Could implement "tombstone" markers for soft deletion

---

## Troubleshooting

### "No user process ID available"

**Cause**: Master process login did not complete successfully.

**Solution**:
1. Check console for errors during login
2. Verify `MASTER_PROCESS_ID` is correct in `legacy-hypergram-js.js` (line ~367)
3. Ensure master process is deployed and running
4. Try refreshing the page and reconnecting wallet

### "Access denied - not process owner"

**Cause**: Child process owner validation is working correctly (this is expected if you try to access someone else's process).

**Solution**:
- Ensure you're using the correct wallet that owns the process
- Check that `msg.From` matches the wallet you connected with
- If switching wallets, logout and login with the correct wallet

### "Could not add member - invalid address"

**Cause**: Recipient address has no public key on-chain (never signed a transaction).

**Solution**:
- Ask recipient to sign at least one transaction on Arweave first
- Use a different address that has transaction history
- Skip this member and add them later once they have on-chain activity

### Child process not spawning

**Cause**: Master process configuration issue or AO connectivity problem.

**Solution**:
1. Verify master process has correct `MODULE_ID` for spawning
2. Check AO network connectivity
3. Review master process logs for spawn errors
4. Ensure master process has sufficient compute resources

### Reaction state not updating

**Cause**: Reaction de-duplication or state sync issue.

**Solution**:
1. Refresh chat to reload reactions from server
2. Check console for errors during `add-reaction` action
3. Verify reaction emoji is valid Unicode
4. Clear localStorage for the chat if state is corrupted:
   ```javascript
   localStorage.removeItem(`ownMessages_${chatId}`);
   localStorage.removeItem(`ownStateHash_${chatId}`);
   ```

### Wallet Address Mismatch

**Cause**: Connected wallet doesn't match expected child process owner.

**Solution**:
- Logout and reconnect with the correct wallet
- Check `userAddress` in console matches your wallet
- If you need a new process, create a new account or use a different wallet

---

## Development

### Technology Stack

- **Frontend**: HTML, CSS, JavaScript (ES6+)
  - `@permaweb/aoconnect` for AO messaging
  - Web Crypto API for encryption
  - Vanilla JS (no framework dependencies)

- **Backend**: Lua (AO Process)
  - `lua/master-process.lua` - Master process handlers
  - `lua/child-process-template.lua` - Child process template (injected at spawn)

- **Storage**: AO/Arweave
  - Master: Lightweight user mappings
  - Child: Full chat/message/contact data per user

### Project Structure

```
HyperGram/
├── README.md (this file)
├── Legacynet-version/
│   └── hypergram-legacy/
│       ├── index.html              # Main UI
│       ├── legacy-hypergram-js.js  # Frontend logic
│       ├── style.css               # Styling
│       └── lua/
│           ├── master-process.lua  # Master process
│           └── child-process-template.lua  # Child template
```

### Deployment Steps

1. **Deploy Master Process**:
   ```bash
   # Use AO CLI or similar tool
   ao deploy lua/master-process.lua
   # Copy the returned process ID
   ```

2. **Update Frontend**:
   ```javascript
   // In legacy-hypergram-js.js, line ~367
   const MASTER_PROCESS_ID = 'YOUR_PROCESS_ID_HERE';
   ```

3. **Serve Frontend**:
   ```bash
   cd Legacynet-version/hypergram-legacy
   python -m http.server 8000
   ```

4. **Test**:
   - Connect wallet
   - Verify child process spawns
   - Create test chat
   - Send encrypted messages

### Action Tags Reference

**Master Process**:
- `Login` - Get or create user child process
- `NotifyChatCreated` - Notify master of new chat (for recipient discovery)
- `Update-Build` - Update user's BUILD_VERSION

**Child Process**:
- `create-chat` - Create new group chat with members
- `update-chat-messages` - Send new encrypted message
- `add-reaction` - Add emoji reaction to message
- `update-contacts` - Update encrypted contacts blob
- `add-member` - Add new member to existing chat
- `remove-member` - Remove member from chat (owner only)
- `Update-UserVersion` - Update child process version

---

## License

[License details to be added]

## Contributing

This project is under active development. Focus areas:

1. **Multi-device sync** - Support same wallet across devices
2. **Public chat discovery** - Find and join public channels
3. **Mobile responsiveness** - Optimize UI for mobile browsers
4. **Performance optimization** - Reduce encryption overhead

---

**HyperGram** - Permanent, private group messaging for the decentralized web
