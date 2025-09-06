-- HyperGram Chat Process Template
-- Individual chat/channel process spawned for each conversation
local json = require('json')

-- Chat Configuration (set during spawning)
chat_config = {
    id = id or "unknown",
    name = "Chat",
    type = "direct", -- "direct", "group", "channel"
    created = os.time(),
    participants = {}, -- Array of wallet addresses
    admins = {}, -- For group chats/channels
    settings = {
        max_message_length = 4096,
        allow_media = true,
        retention_days = 365
    }
}

-- Encrypted message storage (array of encrypted message objects)
messages_table = messages_table or {}

-- Participants storage (encrypted)
participants_table = participants_table or {}

-- Chat metadata (minimal public info)
chat_info = {
    id = chat_config.id,
    type = chat_config.type,
    participant_count = #chat_config.participants,
    created = chat_config.created,
    last_activity = os.time()
}

-- Messages endpoint (returns encrypted messages array)
messages = json.encode(messages_table)

-- Participants endpoint (returns encrypted participants list)
participants = json.encode(participants_table)

-- Chat info endpoint (public metadata only)
info = json.encode(chat_info)

-- Utility functions for message management
local function cleanup_old_messages()
    local cutoff = os.time() - (chat_config.settings.retention_days * 24 * 60 * 60)
    local cleaned = {}
    
    for _, message in ipairs(messages_table) do
        if message.timestamp and message.timestamp > cutoff then
            table.insert(cleaned, message)
        end
    end
    
    messages_table = cleaned
    messages = json.encode(messages_table)
    print("Cleaned up old messages, " .. #messages_table .. " messages retained")
end

local function validate_participant(address)
    for _, participant in ipairs(chat_config.participants) do
        if participant == address then
            return true
        end
    end
    return false
end

-- Message sending handler
Handlers.add('SendMessage', 'send-message', function(msg)
    local sender = msg.From
    local encrypted_data = msg.data or msg.Tags.data
    local timestamp = tonumber(msg.timestamp) or os.time() * 1000
    
    -- Validate sender is participant
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({
                status = "error",
                message = "Not authorized to send messages in this chat"
            })
        })
        return
    end
    
    if not encrypted_data then
        send({
            target = msg.From,
            data = json.encode({
                status = "error", 
                message = "No message data provided"
            })
        })
        return
    end
    
    -- Create message object
    local message = {
        id = "msg_" .. timestamp .. "_" .. math.random(1000, 9999),
        encrypted_content = encrypted_data,
        sender = sender,
        timestamp = timestamp,
        type = "text", -- "text", "image", "file", "system"
        edited = false,
        reactions = {}
    }
    
    -- Add to storage
    table.insert(messages_table, message)
    
    -- Update endpoints
    messages = json.encode(messages_table)
    chat_info.last_activity = os.time()
    info = json.encode(chat_info)
    
    -- Send confirmation
    send({
        target = msg.From,
        data = json.encode({
            status = "success",
            message_id = message.id,
            timestamp = timestamp
        })
    })
    
    -- Notify other participants (optional - for real-time updates)
    for _, participant in ipairs(chat_config.participants) do
        if participant ~= sender then
            send({
                target = participant,
                action = "new-message",
                chat_id = chat_config.id,
                message_id = message.id
            })
        end
    end
    
    print("Message sent in chat " .. chat_config.id .. " by " .. sender)
end)

-- Message editing handler
Handlers.add('EditMessage', 'edit-message', function(msg)
    local sender = msg.From
    local message_id = msg.message_id or msg.Tags.message_id
    local new_encrypted_content = msg.data or msg.Tags.data
    
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized"})
        })
        return
    end
    
    -- Find and update message
    for i, message in ipairs(messages_table) do
        if message.id == message_id and message.sender == sender then
            message.encrypted_content = new_encrypted_content
            message.edited = true
            message.edited_at = os.time()
            
            messages = json.encode(messages_table)
            
            send({
                target = msg.From,
                data = json.encode({status = "success", message = "Message edited"})
            })
            
            print("Message edited: " .. message_id)
            return
        end
    end
    
    send({
        target = msg.From,
        data = json.encode({status = "error", message = "Message not found or unauthorized"})
    })
end)

-- Message deletion handler
Handlers.add('DeleteMessage', 'delete-message', function(msg)
    local sender = msg.From
    local message_id = msg.message_id or msg.Tags.message_id
    
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized"})
        })
        return
    end
    
    -- Find and remove message
    for i, message in ipairs(messages_table) do
        if message.id == message_id and (message.sender == sender or table.contains(chat_config.admins, sender)) then
            table.remove(messages_table, i)
            messages = json.encode(messages_table)
            
            send({
                target = msg.From,
                data = json.encode({status = "success", message = "Message deleted"})
            })
            
            print("Message deleted: " .. message_id)
            return
        end
    end
    
    send({
        target = msg.From,
        data = json.encode({status = "error", message = "Message not found or unauthorized"})
    })
end)

-- Add participant handler (for group chats)
Handlers.add('AddParticipant', 'add-participant', function(msg)
    local sender = msg.From
    local new_participant = msg.participant or msg.Tags.participant
    
    -- Check if sender is admin
    local is_admin = false
    for _, admin in ipairs(chat_config.admins) do
        if admin == sender then
            is_admin = true
            break
        end
    end
    
    if not is_admin then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Admin privileges required"})
        })
        return
    end
    
    -- Add participant if not already present
    local already_participant = false
    for _, participant in ipairs(chat_config.participants) do
        if participant == new_participant then
            already_participant = true
            break
        end
    end
    
    if not already_participant then
        table.insert(chat_config.participants, new_participant)
        chat_info.participant_count = #chat_config.participants
        info = json.encode(chat_info)
        
        -- Add system message
        local system_message = {
            id = "sys_" .. os.time() .. "_" .. math.random(1000, 9999),
            type = "system",
            content = new_participant .. " joined the chat",
            timestamp = os.time() * 1000,
            sender = "system"
        }
        
        table.insert(messages_table, system_message)
        messages = json.encode(messages_table)
        
        send({
            target = msg.From,
            data = json.encode({status = "success", message = "Participant added"})
        })
        
        print("Participant added to chat " .. chat_config.id .. ": " .. new_participant)
    else
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Already a participant"})
        })
    end
end)

-- Leave chat handler
Handlers.add('LeaveChat', 'leave-chat', function(msg)
    local sender = msg.From
    
    -- Remove from participants
    for i, participant in ipairs(chat_config.participants) do
        if participant == sender then
            table.remove(chat_config.participants, i)
            chat_info.participant_count = #chat_config.participants
            info = json.encode(chat_info)
            
            -- Add system message
            local system_message = {
                id = "sys_" .. os.time() .. "_" .. math.random(1000, 9999),
                type = "system", 
                content = sender .. " left the chat",
                timestamp = os.time() * 1000,
                sender = "system"
            }
            
            table.insert(messages_table, system_message)
            messages = json.encode(messages_table)
            
            send({
                target = msg.From,
                data = json.encode({status = "success", message = "Left chat successfully"})
            })
            
            print("Participant left chat " .. chat_config.id .. ": " .. sender)
            return
        end
    end
    
    send({
        target = msg.From,
        data = json.encode({status = "error", message = "Not a participant in this chat"})
    })
end)

-- Message reaction handler
Handlers.add('ReactToMessage', 'react-message', function(msg)
    local sender = msg.From
    local message_id = msg.message_id or msg.Tags.message_id
    local reaction = msg.reaction or msg.Tags.reaction -- emoji
    
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized"})
        })
        return
    end
    
    -- Find message and add/toggle reaction
    for _, message in ipairs(messages_table) do
        if message.id == message_id then
            if not message.reactions then
                message.reactions = {}
            end
            
            if not message.reactions[reaction] then
                message.reactions[reaction] = {}
            end
            
            -- Toggle reaction
            local user_reacted = false
            for i, user in ipairs(message.reactions[reaction]) do
                if user == sender then
                    table.remove(message.reactions[reaction], i)
                    user_reacted = true
                    break
                end
            end
            
            if not user_reacted then
                table.insert(message.reactions[reaction], sender)
            end
            
            messages = json.encode(messages_table)
            
            send({
                target = msg.From,
                data = json.encode({status = "success", message = "Reaction updated"})
            })
            
            return
        end
    end
    
    send({
        target = msg.From,
        data = json.encode({status = "error", message = "Message not found"})
    })
end)

-- Search messages handler
Handlers.add('SearchMessages', 'search-messages', function(msg)
    local sender = msg.From
    local query = msg.query or msg.Tags.query
    
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized"})
        })
        return
    end
    
    -- Note: Search would need to be done client-side on decrypted messages
    -- This handler could return message IDs for client-side filtering
    send({
        target = msg.From,
        data = json.encode({
            status = "success",
            message = "Search should be performed client-side on decrypted messages",
            total_messages = #messages_table
        })
    })
end)

-- Cleanup old messages periodically (called manually or by timer)
Handlers.add('CleanupMessages', 'cleanup-messages', function(msg)
    local sender = msg.From
    
    -- Only allow admins or system to cleanup
    local is_admin = false
    for _, admin in ipairs(chat_config.admins) do
        if admin == sender then
            is_admin = true
            break
        end
    end
    
    if is_admin or sender == "system" then
        cleanup_old_messages()
        send({
            target = msg.From,
            data = json.encode({
                status = "success", 
                message = "Cleanup completed",
                message_count = #messages_table
            })
        })
    else
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Admin privileges required"})
        })
    end
end)

-- Get chat statistics
Handlers.add('GetChatStats', 'get-stats', function(msg)
    local sender = msg.From
    
    if not validate_participant(sender) then
        send({
            target = msg.From,
            data = json.encode({status = "error", message = "Not authorized"})
        })
        return
    end
    
    local stats = {
        total_messages = #messages_table,
        participants = #chat_config.participants,
        created = chat_config.created,
        last_activity = chat_info.last_activity,
        chat_type = chat_config.type
    }
    
    send({
        target = msg.From,
        data = json.encode({status = "success", stats = stats})
    })
end)

-- Initialize chat process
print("💬 HyperGram Chat Process Initialized")
print("📋 Chat ID: " .. chat_config.id)
print("👥 Participants: " .. #chat_config.participants)
print("🔗 Available endpoints:")
print("   • Messages: /now/messages")
print("   • Participants: /now/participants") 
print("   • Chat Info: /now/info")
print("📨 Available actions:")
print("   • send-message, edit-message, delete-message")
print("   • add-participant, leave-chat")
print("   • react-message, search-messages")
print("   • cleanup-messages, get-stats")
print("🔐 All messages stored encrypted!")