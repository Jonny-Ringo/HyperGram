-- HyperGram Enhanced Styles
-- Telegram-inspired modern messaging interface styling

local json = require('json')

-- Enhanced CSS styles (accessible at /now/styles)
styles = [=[
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
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
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
    
    .login-screen .subtitle {
        color: var(--text-secondary);
        margin-bottom: 2rem;
        max-width: 500px;
        font-size: 1.1rem;
        font-weight: 400;
    }
    
    .connect-btn {
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
        position: relative;
        overflow: hidden;
    }
    
    .connect-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .connect-btn:active {
        transform: translateY(0);
    }
    
    .connect-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }
    
    .connect-btn:hover::before {
        left: 100%;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .user-info::before {
        content: '🔗';
        font-size: 0.9rem;
    }
    
    .sidebar-actions {
        padding: 1rem;
        border-bottom: 1px solid var(--border-light);
    }
    
    .new-chat-btn {
        width: 100%;
        background: var(--primary);
        color: var(--text-inverse);
        border: none;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .new-chat-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }
    
    .new-chat-btn::before {
        content: '💬';
        font-size: 1rem;
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
        position: relative;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .chat-item:hover {
        background: var(--bg-primary);
    }
    
    .chat-item.active {
        background: var(--primary-light);
        color: var(--text-inverse);
    }
    
    .chat-item.active .chat-name {
        color: var(--text-inverse);
    }
    
    .chat-item.active .chat-preview {
        color: rgba(255,255,255,0.8);
    }
    
    .chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--text-inverse);
        flex-shrink: 0;
    }
    
    .chat-content {
        flex: 1;
        min-width: 0;
    }
    
    .chat-name {
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .chat-preview {
        color: var(--text-secondary);
        font-size: 0.8rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .chat-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        flex-shrink: 0;
    }
    
    .chat-time {
        font-size: 0.7rem;
        color: var(--text-secondary);
    }
    
    .unread-badge {
        background: var(--primary);
        color: var(--text-inverse);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
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
        position: relative;
        z-index: 10;
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
    
    .chat-header-info h4 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.1rem;
    }
    
    .chat-status {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .chat-actions {
        margin-left: auto;
        display: flex;
        gap: 0.5rem;
    }
    
    .chat-action-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }
    
    .chat-action-btn:hover {
        background: var(--bg-secondary);
    }
    
    .messages-container {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
        scroll-behavior: smooth;
    }
    
    .message-group {
        margin-bottom: 1.5rem;
    }
    
    .message {
        display: flex;
        margin-bottom: 0.5rem;
        align-items: flex-end;
        gap: 0.5rem;
    }
    
    .message.own {
        flex-direction: row-reverse;
    }
    
    .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .message.own .message-avatar {
        background: var(--primary);
        color: var(--text-inverse);
    }
    
    .message-content {
        max-width: 70%;
        position: relative;
    }
    
    .message-bubble {
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        box-shadow: var(--shadow-sm);
        position: relative;
        word-wrap: break-word;
        line-height: 1.4;
    }
    
    .message.own .message-bubble {
        background: var(--primary);
        color: var(--text-inverse);
    }
    
    .message-bubble::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        bottom: 0;
        border: 8px solid transparent;
    }
    
    .message:not(.own) .message-bubble::before {
        left: -8px;
        border-right-color: var(--bg-primary);
        border-bottom-color: var(--bg-primary);
    }
    
    .message.own .message-bubble::before {
        right: -8px;
        border-left-color: var(--primary);
        border-bottom-color: var(--primary);
    }
    
    .message-sender {
        font-size: 0.7rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
        opacity: 0.8;
    }
    
    .message.own .message-sender {
        color: rgba(255,255,255,0.9);
    }
    
    .message-text {
        margin-bottom: 0.25rem;
    }
    
    .message-meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        font-size: 0.7rem;
        opacity: 0.6;
        margin-top: 0.25rem;
    }
    
    .message.own .message-meta {
        color: rgba(255,255,255,0.8);
    }
    
    .message-time {
        white-space: nowrap;
    }
    
    .message-status {
        font-size: 0.8rem;
    }
    
    /* Message Input */
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
        position: relative;
    }
    
    .message-input {
        width: 100%;
        min-height: 44px;
        max-height: 120px;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-medium);
        border-radius: 22px;
        outline: none;
        font-family: inherit;
        font-size: 0.9rem;
        resize: none;
        transition: var(--transition);
        background: var(--bg-secondary);
    }
    
    .message-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(0, 136, 204, 0.2);
        background: var(--bg-primary);
    }
    
    .input-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .input-action-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }
    
    .input-action-btn:hover {
        background: var(--bg-secondary);
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
    
    .send-btn:active {
        transform: scale(0.95);
    }
    
    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    /* Utility Classes */
    .hidden { display: none !important; }
    .flex { display: flex !important; }
    .loading { opacity: 0.6; pointer-events: none; }
    
    /* Scrollbar Styling */
    .chats-list::-webkit-scrollbar,
    .messages-container::-webkit-scrollbar {
        width: 6px;
    }
    
    .chats-list::-webkit-scrollbar-track,
    .messages-container::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .chats-list::-webkit-scrollbar-thumb,
    .messages-container::-webkit-scrollbar-thumb {
        background: var(--border-medium);
        border-radius: 3px;
    }
    
    .chats-list::-webkit-scrollbar-thumb:hover,
    .messages-container::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .app-container {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
            max-width: none;
            max-height: none;
        }
        
        .sidebar {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 20;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .sidebar.show {
            transform: translateX(0);
        }
        
        .chat-area {
            width: 100%;
        }
        
        .message-content {
            max-width: 85%;
        }
    }
    
    /* Animation Classes */
    .fade-in {
        animation: fadeIn 0.3s ease;
    }
    
    .slide-up {
        animation: slideUp 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    /* Typing Indicator */
    .typing-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-style: italic;
    }
    
    .typing-dots {
        display: flex;
        gap: 2px;
    }
    
    .typing-dots span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--text-secondary);
        animation: typingDots 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typingDots {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
    }
]=]