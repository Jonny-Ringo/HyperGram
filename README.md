# HyperGram - Decentralized Messaging on AO
## Version: Alpha 0.1.0

A secure, decentralized messaging platform built on the AO (Arweave Operating System) using HyperBeam for instant web interactions.

## Overview

HyperGram provides real-time messaging capabilities through a decentralized architecture, leveraging Arweave wallet authentication and AO process management for secure communication.

## Current Features

### ✅ Core Messaging
- **Real-time messaging** - Send and receive messages instantly
- **Multi-chat support** - Create and manage multiple chat conversations
- **Wallet authentication** - Secure login using ArConnect/Wander wallets
- **Message persistence** - All messages stored permanently on AO
- **Chat creation** - Start new conversations with any Arweave address

### ✅ User Interface
- **Modern web interface** - Clean, responsive design
- **Chat list management** - View all your active conversations
- **Message display** - Real-time message rendering with timestamps
- **User identification** - Messages tagged with sender wallet addresses

### ✅ Technical Architecture
- **AO process-based** - Each chat managed within AO ecosystem
- **JSON data exchange** - Structured message and chat storage
- **HyperBeam integration** - Instant web-to-AO communication
- **In-memory storage** - Fast message retrieval and display

## Getting Started

1. **Connect Wallet**: Install ArConnect or Wander browser extension
2. **Access Interface**: Visit your deployed HyperGram process URL
3. **Authenticate**: Connect your Arweave wallet
4. **Start Messaging**: Create new chats or join existing conversations

## Architecture

```
Frontend (HTML/JS) → HyperBeam → AO Process → Message Storage
```

- **Frontend**: Single-page web application with wallet integration
- **HyperBeam**: Enables direct web-to-AO communication
- **AO Process**: Handles message routing, storage, and user management
- **Storage**: In-memory message persistence with JSON serialization

## Coming Soon

### 🚀 Next Major Features

#### Public Chats (Priority #1)
- **Open chat rooms** - Create public channels anyone can join
- **Topic-based organization** - Categorize chats by interest/topic
- **Discovery mechanism** - Find and join public conversations
- **Moderation tools** - Basic admin controls for public spaces

#### Private Chat Encryption
- **End-to-end encryption** - Secure message content
- **Session key management** - Ephemeral keys for chat sessions
- **Encrypted storage** - Protected message persistence
- **Key derivation** - Wallet-based cryptographic key generation

#### Enhanced Chat Management
- **Custom nicknames** - Personalize chat display names
- **Member management** - Add/remove participants, role assignments
- **Admin functionality** - Owner/moderator permissions and controls
- **Message reactions** - Emoji reactions stored on message objects
- **Chat customization** - Banners, themes, and visual personalization
- **Moderation features** - Message deletion, user blocking, content filtering

#### User Experience Improvements
- **Manual refresh controls** - Button to update chat state
- **Real-time updates** - Explore automatic state synchronization
- **Notification system** - Alert users to new messages
- **Message search** - Find specific messages within chats
- **Export functionality** - Download chat history

### 🔮 Future Roadmap

#### Scalability Enhancements
- **Process-per-chat architecture** - Dedicated AO process for each conversation
- **Memory optimization** - Distribute chat storage across multiple processes  
- **Performance scaling** - Handle thousands of concurrent chats
- **Cross-process messaging** - Inter-chat communication protocols

*Note: Process spawning currently limited by HyperBeam constraints, but expected to be available soon*

#### Advanced Features
- **File sharing** - Send documents, images, and media
- **Voice messages** - Audio message recording and playback
- **Video chat integration** - Real-time video communication
- **Bot framework** - Automated chat participants and services
- **Plugin system** - Third-party integrations and extensions

## Technical Details

### Message Structure
```json
{
  "id": "msg_timestamp_random",
  "sender": "arweave_wallet_address",
  "content": "message_text",
  "timestamp": "unix_timestamp",
  "delivered": true
}
```

### Chat Structure
```json
{
  "id": "chat_timestamp_random",
  "participants": "address1,address2",
  "messages": [...],
  "created": "timestamp",
  "last_activity": "timestamp",
  "chat_type": "direct|public"
}
```

## Development

HyperGram is built with:
- **Lua** - AO process logic and message handlers
- **HTML/CSS/JavaScript** - Frontend web interface
- **JSON** - Data serialization and API communication
- **AO/Arweave** - Decentralized compute and storage

## Contributing

This project is under active development. Current focus areas:
1. Public chat implementation
2. Message encryption protocols
3. UI/UX improvements
4. Performance optimization

## License

[License details to be added]

---

**HyperGram** - Decentralized messaging for the permanent web