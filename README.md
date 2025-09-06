# HyperGram - Decentralized Messaging on AO
## Version: Alpha 0.2.0

![HyperGram](HyperGram.png)

A secure, decentralized messaging platform built on the AO (Arweave Operating System) using HyperBeam for instant web interactions with end-to-end encryption and advanced race condition handling.

## Current Features

### ✅ Core Messaging
- **Real-time messaging** - Send and receive messages with delivery status tracking
- **Multi-chat support** - Create and manage multiple chat conversations
- **Wallet authentication** - Secure login using ArConnect/Wander wallets
- **Message persistence** - All messages stored permanently on AO process(Arweave)
- **Chat creation** - Start new conversations with any Arweave address that has signed a transaction in the past
- **Delivery confirmation** - Visual status indicators (sending → verifying → sent)
- **Race condition handling** - Advanced conflict detection and manual resend options

### ✅ Security & Encryption
- **End-to-end encryption** - Hybrid encryption using RSA + AES-GCM
- **Wallet-based key derivation** - Secure key generation from wallet signatures
- **Message integrity** - Cryptographic verification of message authenticity
- **Encrypted storage** - All message content encrypted before storage
- **Session security** - Per-chat encryption with unique keys

### ✅ User Interface
- **Modern web interface** - Clean, responsive design with real-time updates
- **Chat list management** - View all your active conversations
- **Message display** - Real-time rendering with timestamps and delivery status
- **User identification** - Messages tagged with shortened wallet addresses
- **Smart auto-refresh** - Automatic message updates (only when tab is visible)
- **Manual refresh controls** - Button to update chat state on demand
- **Loading states** - Visual feedback during encryption and message loading

### ✅ Advanced Features  
- **Conflict resolution** - Smart handling of concurrent message sending
- **Message resend** - Manual retry for failed messages (like mobile messaging apps)
- **State synchronization** - Automatic loading of new messages during conflicts
- **Cache management** - Efficient local message caching and cleanup
- **Auto-refresh system** - Configurable automatic message polling
- **Typing detection** - Pause auto-refresh while user is composing messages

## Getting Started

1. **Connect Wallet**: Install Wander browser extension
2. **Access Interface**: Visit your deployed HyperGram process URL
3. **Authenticate**: Connect your Arweave wallet
4. **Start Messaging**: Create new chats or join existing conversations

## Architecture

```
Frontend (HTML/JS) → HyperBeam → AO Process → Message Storage
```

- **Frontend**: Single-page web application with wallet integration (dev format)
- **HyperBeam**: Enables direct web-to-AO communication and hosts all code
- **AO Process**: Handles message routing, storage, and user management
- **Storage**: In-memory message persistence with JSON serialization

## Coming Soon

### 🚀 Next Major Features

#### Contact Management
- **Encrypted phonebook** - Personal contact storage with wallet-based encryption
- **Contact labeling** - Display custom names instead of wallet addresses in chats
- **Auto-decrypt contacts** - Seamlessly load contact names on wallet connection
- **Contact sync** - Maintain contact list across sessions with signature-based decryption

#### User Experience Improvements  
- **Notification system** - Alert users to new messages

- **Message reactions** - Emoji reactions stored on message objects
- **Chat customization** - Banners, themes, and visual personalization hosted on Arweave
- **Message search** - Find specific messages within chats
- **Export functionality** - Download chat history
- **Dark/light theme toggle** - User-customizable interface themes
- **Message formatting** - Basic text formatting (bold, italic, links)

### 🔮 Future Roadmap

#### Scalability Enhancements
- **Process-per-chat architecture** - Dedicated AO process for each conversation
- **Memory optimization** - Distribute chat storage across multiple processes  
- **Performance scaling** - Handle thousands of concurrent chats
- **Cross-process messaging** - Inter-chat communication protocols

*Note: Process spawning currently limited by HyperBeam constraints, but expected to be available soon*

#### Public Chats
- **Open chat rooms** - Create public channels anyone can join
- **Topic-based organization** - Categorize chats by interest/topic  
- **Discovery mechanism** - Find and join public conversations
- **Member management** - Add/remove participants, role assignments
- **Admin functionality** - Owner/moderator permissions and controls
- **Moderation features** - Message deletion, user blocking, content filtering
- **Chat length manager** - Automatic message history limiting (200 messages per chat)
- **Archive system** - Move older messages to archived storage for performance

#### Advanced Features
- **File sharing** - Send documents, images, and media
- **Voice messages** - Audio message recording and playback
- **Video chat integration** - Video uploads and embedded sharing
- **Bot framework** - Automated chat participants and services
- **Plugin system** - Third-party integrations and extensions

## Technical Details

### Encryption Architecture
- **Hybrid Encryption**: RSA-4096 for key exchange + AES-256-GCM for message content
- **Key Derivation**: Wallet signatures used to derive encryption keys
- **Message Integrity**: Each message cryptographically signed and verified
- **Forward Secrecy**: Unique encryption keys per chat session

### Message Structure (Encrypted)
```json
{
  "encryptedMessages": "base64_encrypted_content",
  "stateHash": "sha256_state_verification",
  "messageCount": 42,
  "lastUpdated": 1234567890123,
  "recipientKeys": {
    "address1": "encrypted_key_for_participant1",
    "address2": "encrypted_key_for_participant2"
  }
}
```

### Local Message Structure (Decrypted)
```json
{
  "id": "msg_timestamp_random",
  "sender": "arweave_wallet_address", 
  "content": "decrypted_message_text",
  "timestamp": "unix_timestamp",
  "deliveryStatus": "sending|verifying|sent|conflict|failed"
}
```

### Race Condition Handling
- **State Comparison**: Compare local state hash with server state before sending
- **Conflict Detection**: Detect when other participants sent messages concurrently  
- **Smart Recovery**: Auto-load new messages and preserve failed message for manual resend
- **Manual Resend**: User-controlled retry with "Resend" button (like mobile messaging)

## Recently Completed ✨

### Version 0.2.0 Achievements
- ✅ **End-to-end encryption** - Full hybrid encryption implementation
- ✅ **Race condition handling** - Advanced conflict detection and resolution
- ✅ **Manual message resend** - User-controlled retry system like mobile apps  
- ✅ **Smart auto-refresh** - Intelligent message polling with tab visibility detection
- ✅ **State synchronization** - Automatic loading of concurrent messages during conflicts
- ✅ **Delivery status tracking** - Visual indicators for message delivery states
- ✅ **Cache management** - Efficient local message storage and cleanup

## Development

HyperGram is built with:
- **Lua** - AO process logic and message handlers  
- **HTML/CSS/JavaScript** - Frontend web interface with modern async patterns
- **Web Crypto API** - Browser-native cryptographic operations
- **JSON** - Data serialization and encrypted message packaging
- **AO/Arweave** - Decentralized compute and permanent storage

## Contributing

This project is under active development. Current focus areas:
1. Public chat rooms and discovery
2. Enhanced user experience features
3. Performance optimization and scaling
4. Mobile-responsive design improvements

## License

[License details to be added]

---


**HyperGram** - Decentralized messaging for the permanent web
