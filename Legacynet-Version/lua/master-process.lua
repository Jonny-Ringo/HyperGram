-- HyperGram Master Process - Ultra-lightweight user-to-process mapping
-- This process only handles user registration and spawning child processes

json = require("json")

-- Version Information
MASTER_VERSION = "A01"
USER_PROCESS_VERSION = "A01"
FRONTEND_VERSION = "A01"
BUILD_VERSION = MASTER_VERSION .. "-" .. USER_PROCESS_VERSION .. "-" .. FRONTEND_VERSION

-- Enhanced storage - user address to process structure mapping
UserProcessMap = UserProcessMap or {}

-- Track users currently spawning to prevent duplicate spawns
UsersCurrentlySpawning = UsersCurrentlySpawning or {}

-- Helper function to format elapsed time in human-readable format
function formatElapsedTime(milliseconds)
    local seconds = math.floor(milliseconds / 1000)
    local minutes = math.floor(seconds / 60)
    local hours = math.floor(minutes / 60)

    if hours > 0 then
        return string.format("%dh %dm %ds", hours, minutes % 60, seconds % 60)
    elseif minutes > 0 then
        return string.format("%dm %ds", minutes, seconds % 60)
    else
        return string.format("%ds", seconds)
    end
end

-- Helper function to ensure user has proper structure
function ensureUserStructure(userAddress)
    if not UserProcessMap[userAddress] then
        -- New user - create empty structure
        UserProcessMap[userAddress] = {
            BUILD_VERSION = MASTER_VERSION .. "-" .. USER_PROCESS_VERSION .. "-" .. FRONTEND_VERSION,
            ownedProcesses = {},
            recipientProcesses = {}
        }
        print("📋 MASTER: Created new user structure for: " .. userAddress)
    end
end

-- Helper function to add recipient access
function addRecipientAccess(userAddress, processId)
    ensureUserStructure(userAddress)
    
    -- Check if user already owns this process (no need to add as recipient)
    for _, ownedProcessId in ipairs(UserProcessMap[userAddress].ownedProcesses) do
        if ownedProcessId == processId then
            print("⚠️ MASTER: User " .. userAddress .. " already owns process " .. processId .. " - skipping recipient access")
            return false
        end
    end
    
    -- Check if already exists in recipient list
    for _, existingProcessId in ipairs(UserProcessMap[userAddress].recipientProcesses) do
        if existingProcessId == processId then
            return false -- Already exists
        end
    end
    
    -- Add new recipient process
    table.insert(UserProcessMap[userAddress].recipientProcesses, processId)
    print("📨 MASTER: Added recipient access for " .. userAddress .. " to process: " .. processId)
    return true
end

-- Process spawning configuration
local CHILD_MODULE_ID = nil  -- Will be set to the same module ID as this process
local SCHEDULER_ADDRESS = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"
local AUTHORITY_ADDRESS = "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY"

-- Note: Removed synchronous spawnUserProcess function - now using async approach with Spawned/ProcessReady handlers

-- Function to inject handlers into child process
function setupUserProcessHandlers(processId, userAddress)
    print("⚙️ MASTER: Setting up handlers for process: " .. processId)
    
    -- Create the complete handler code for the child process
    local handlerCode = [[
        -- Child Process - User's Personal Messaging Process
        json = require("json")

        -- Version Information
        MASTER_VERSION = "A01"
        USER_PROCESS_VERSION = "A01"
        FRONTEND_VERSION = "A01"
        BUILD_VERSION = MASTER_VERSION .. "-" .. USER_PROCESS_VERSION .. "-" .. FRONTEND_VERSION

        -- Set the fixed owner address
        Owner = "_mI4yx17CeHplIAJfMQwYACY4pAs6t8DMULvm0RsFFg"

        local OWNER_ADDRESS = "]] .. userAddress .. [["

        -- Set the user this process serves
        local USER_ADDRESS = "]] .. userAddress .. [["
        
        -- User profile storage (all user data lives here)
        UserProfile = {
            owner = USER_ADDRESS,
            signerPublicKey = "",
            nickname = "",
            personalDetails = {},
            contacts = {},
            contactsStateHash = "",
            createdAt = ]] .. os.time() .. [[,
            lastLogin = ]] .. os.time() .. [[
        }
        
        -- Initialize storage tables (same as original messenger.lua)
        chats_storage = chats_storage or {}
        chats_registry = {}
        members_registry = {}
        processed_message_ids = processed_message_ids or {}
        chats_registry_json = {}
        
        
        -- Copy all functions from original messenger.lua
        function update_chats_registry_json()
            if chats_storage then
                chats_registry_json = json.encode(chats_storage)
            else
                chats_registry_json = "{}"
            end
        end
        
        function get_chat_process(chat_id)
            if chats_registry[chat_id] then
                return chats_registry[chat_id].process_id
            end
            return ""
        end
        
        function get_chat_messages(chat_id)
            if chats_storage[chat_id] then
                return json.encode(chats_storage[chat_id].messages or {})
            end
            return "[]"
        end
        
        function cleanup_processed_messages()
            local count = 0
            for _ in pairs(processed_message_ids) do
                count = count + 1
            end
            
            if count > 1000 then
                local to_remove = {}
                local current_time = os.time()
                
                for msg_id, data in pairs(processed_message_ids) do
                    if current_time - data.timestamp > 3600 then
                        table.insert(to_remove, msg_id)
                    end
                end
                
                for _, msg_id in ipairs(to_remove) do
                    processed_message_ids[msg_id] = nil
                end
                
                print("🧹 CHILD: Cleaned up " .. #to_remove .. " old processed message IDs")
            end
        end
        
        function add_member_to_chat(chat_id, member_address)
            if not chats_storage[chat_id] then
                return false, "Chat not found"
            end
            
            for _, member in ipairs(chats_storage[chat_id].members) do
                if member.address == member_address then
                    return false, "Already a member"
                end
            end
            
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
        
        -- Handler: Create Chat (with owner validation)
        Handlers.add('CreateChat', Handlers.utils.hasMatchingTag('Action', 'create-chat'), function(msg)
            if msg.From ~= USER_ADDRESS then 
                print("❌ CHILD: Create chat denied - wrong user. Expected: " .. USER_ADDRESS .. ", Got: " .. msg.From)
                return 
            end
            
            print("✅ CHILD: Create chat request from authorized user: " .. msg.From)
            
            local participants = msg.Participants or msg.Tags.Participants
            local nickname = msg.Nickname or msg.Tags.Nickname or "New Chat"
            
            print("📋 CHILD: Chat creation parameters:")
            print("   • Participants: " .. tostring(participants))
            print("   • Nickname: " .. tostring(nickname))
            print("   • From: " .. tostring(msg.From))
            
            if not participants then
                print("❌ CHILD: No participants - sending error")
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "No participants provided"})
                })
                return
            end
            
            local timestamp = tostring(msg.Timestamp or math.floor(os.time())):gsub("%.", "_")
            local chat_id = "chat_" .. timestamp .. "_" .. math.random(1000, 9999)
            
            print("🆔 CHILD: Generated chat_id: " .. chat_id)
            
            local participant_list = {}
            for participant in participants:gmatch("[^,]+") do
                table.insert(participant_list, participant:match("^%s*(.-)%s*$"))
            end

            print("👥 CHILD: Parsed participants:")
            for i, participant in ipairs(participant_list) do
                print("   • " .. i .. ": " .. participant)
            end

            -- Check for existing chat with same participants where user is owner
            print("🔍 CHILD: Checking for existing chats with same participants...")
            for existing_chat_id, chat_data in pairs(chats_storage) do
                if chat_data.owner == msg.From then
                    -- Check if participants match (order independent)
                    local existing_participants = {}
                    for participant in chat_data.participants:gmatch("[^,]+") do
                        table.insert(existing_participants, participant:match("^%s*(.-)%s*$"))
                    end

                    -- Compare participant lists
                    if #existing_participants == #participant_list then
                        local participants_match = true
                        for _, new_participant in ipairs(participant_list) do
                            local found = false
                            for _, existing_participant in ipairs(existing_participants) do
                                if new_participant == existing_participant then
                                    found = true
                                    break
                                end
                            end
                            if not found then
                                participants_match = false
                                break
                            end
                        end

                        if participants_match then
                            print("❌ CHILD: Duplicate chat detected - chat " .. existing_chat_id .. " already exists with same participants")
                            Send({
                                target = msg.From,
                                data = json.encode({
                                    status = "error",
                                    message = "Chat with these participants already exists",
                                    existing_chat_id = existing_chat_id
                                })
                            })
                            return
                        end
                    end
                end
            end
            print("✅ CHILD: No duplicate chats found, proceeding with creation")
            
            chats_storage[chat_id] = {
                id = chat_id,
                owner = msg.From,
                participants = participants,
                user1_address = participant_list[1],
                user2_address = participant_list[2],
                nickname = nickname,
                user1_messages = {},
                user2_messages = {},
                user1_messageCount = 0,
                user2_messageCount = 0,
                total_messageCount = 0,
                user1_stateHash = nil,
                user2_stateHash = nil,
                reactions = {},  -- Array of reaction objects
                reactionsStateHash = "",  -- For sync validation
                created = os.time(),
                last_activity = os.time(),
                chat_type = "direct"
            }
            
            chats_registry[chat_id] = {
                process_id = chat_id,
                participants = participants,
                nickname = nickname,
                created = os.time(),
                last_activity = os.time(),
                chat_type = "direct"
            }
            
            print("✅ CHILD: Chat created successfully")
            print("💾 CHILD: Storing chat in chats_storage with key: " .. chat_id)
            print("📝 CHILD: Chat details:")
            print("   • Owner: " .. tostring(chats_storage[chat_id].owner))
            print("   • User1: " .. tostring(chats_storage[chat_id].user1_address))
            print("   • User2: " .. tostring(chats_storage[chat_id].user2_address))
            
            update_chats_registry_json()
            print("📊 CHILD: Updated chats_registry_json")
            
            local response_data = json.encode({
                status = "success",
                chatId = chat_id,
                message = "Chat created successfully"
            })
            
            print("📤 CHILD: Sending response to " .. msg.From)
            print("📦 CHILD: Response data: " .. response_data)
            
            Send({
                target = msg.From,
                data = response_data
            })
            
            print("✅ CHILD: Response sent successfully")
            
            -- Notify master process about chat creation for cross-process discovery
            print("📡 CHILD: Notifying master process about chat creation")
            Send({
                Target = "]] .. ao.id .. [[",
                Tags = {
                    { name = "Action", value = "NotifyChatCreated" },
                    { name = "Chat-Id", value = chat_id },
                    { name = "Participants", value = participants },
                    { name = "Process-Id", value = ao.id }
                },
                Data = json.encode({
                    chatId = chat_id,
                    participants = participants,
                    nickname = nickname,
                    creator = USER_ADDRESS
                })
            })
            
            print("📨 CHILD: Master notification sent for chat discovery")
        end)
        
        -- Handler: Update Chat Messages (with participant validation)
        Handlers.add('UpdateChatMessages', Handlers.utils.hasMatchingTag('Action', 'update-chat-messages'), function(msg)
            
            local sender = msg.From
            local chat_id = msg.Tags["Chat-Id"]
            local state_hash = msg.Tags["State-Hash"]
            local message_count = tonumber(msg.Tags["Message-Count"])
            local last_updated = tonumber(msg.Tags["Last-Updated"])
            local last_message_id = msg.Tags["Last-Message-Id"]
            
            local data = msg.Data
            local encrypted_messages = nil
            local iv = nil
            local aes_key_sender = nil
            local aes_key_recipient = nil
            local sender_address = nil
            local recipient_address = nil
            
            if data and data ~= "" then
                local success, messageData = pcall(json.decode, data)
                if success and messageData then
                    encrypted_messages = messageData.encryptedMessages
                    iv = messageData.iv
                    aes_key_sender = messageData.aesKeyForSender
                    aes_key_recipient = messageData.aesKeyForRecipient
                    sender_address = messageData.senderAddress
                    recipient_address = messageData.recipientAddress
                end
            end
            
            if last_message_id and processed_message_ids[last_message_id] then
                print("⚠️ CHILD: DUPLICATE MESSAGE DETECTED - Message ID already processed: " .. tostring(last_message_id))
                Send({
                    target = msg.From,
                    data = json.encode({
                        status = "duplicate",
                        message = "Message already processed",
                        messageId = last_message_id
                    })
                })
                return
            end
            
            if last_message_id then
                processed_message_ids[last_message_id] = {
                    timestamp = os.time(),
                    sender = sender,
                    chat_id = chat_id
                }
                print("✅ CHILD: Marked message as processed: " .. tostring(last_message_id))
            end
            
            local encrypted_chat_data = {
                encryptedMessages = encrypted_messages,
                iv = iv,
                aesKeyForSender = aes_key_sender,
                aesKeyForRecipient = aes_key_recipient,
                senderAddress = sender_address,
                recipientAddress = recipient_address,
                stateHash = state_hash,
                messageCount = message_count,
                lastUpdated = last_updated
            }
            
            local target_chat = nil
            local target_chat_id = nil
            
            if chat_id then
                if chats_storage[chat_id] then
                    target_chat = chats_storage[chat_id]
                    target_chat_id = chat_id
                    print("✅ CHILD: Found chat by exact match: " .. chat_id)
                else
                    for stored_chat_id, chat in pairs(chats_storage) do
                        if stored_chat_id:find(chat_id, 1, true) or chat_id:find(stored_chat_id, 1, true) then
                            target_chat = chat
                            target_chat_id = stored_chat_id
                            print("✅ CHILD: Found chat by partial match: " .. stored_chat_id)
                            break
                        end
                    end
                end
            end
            
            -- Early participant validation - check if sender is authorized for this chat
            if target_chat then
                local is_user1 = (sender == target_chat.user1_address)
                local is_user2 = (sender == target_chat.user2_address)
                
                if not (is_user1 or is_user2) then
                    print("❌ CHILD: Update messages denied - sender not a participant in this chat")
                    print("   • Sender: " .. sender)
                    print("   • User1: " .. tostring(target_chat.user1_address))
                    print("   • User2: " .. tostring(target_chat.user2_address))
                    
                    Send({
                        target = msg.From,
                        data = json.encode({
                            status = "error",
                            message = "Unauthorized: You are not a participant in this chat"
                        })
                    })
                    return
                end
                
                print("✅ CHILD: Sender authorized as " .. (is_user1 and "User1" or "User2") .. " for chat: " .. (target_chat_id or "unknown"))
            end
            
            if target_chat and encrypted_chat_data and sender then
                -- We already validated participant access above, now determine which user
                local is_user1 = (sender == target_chat.user1_address)
                local is_user2 = (sender == target_chat.user2_address)
                
                if is_user1 then
                    print("📝 CHILD: Updating User1 messages for: " .. sender)
                    target_chat.user1_messages = { encrypted_chat_data }
                    target_chat.user1_messageCount = tonumber(message_count) or 0
                    target_chat.user1_stateHash = state_hash or "unknown"
                elseif is_user2 then
                    print("📝 CHILD: Updating User2 messages for: " .. sender)
                    target_chat.user2_messages = { encrypted_chat_data }
                    target_chat.user2_messageCount = tonumber(message_count) or 0
                    target_chat.user2_stateHash = state_hash or "unknown"
                else
                    print("❌ CHILD: ERROR - Sender not found in chat participants")
                    return
                end
                
                target_chat.user1_messageCount = target_chat.user1_messageCount or 0
                target_chat.user2_messageCount = target_chat.user2_messageCount or 0
                target_chat.total_messageCount = target_chat.user1_messageCount + target_chat.user2_messageCount
                target_chat.lastUpdated = os.time()
                
                -- Enforce strict user isolation - users can only update their own data
                if is_user1 then
                    chats_registry[target_chat_id].user1_messageCount = target_chat.user1_messageCount
                    chats_registry[target_chat_id].user1_stateHash = target_chat.user1_stateHash
                    -- Don't touch user2_* fields!
                elseif is_user2 then
                    chats_registry[target_chat_id].user2_messageCount = target_chat.user2_messageCount  
                    chats_registry[target_chat_id].user2_stateHash = target_chat.user2_stateHash
                    -- Don't touch user1_* fields!
                end
                chats_registry[target_chat_id].total_messageCount = target_chat.total_messageCount or 0
                chats_registry[target_chat_id].last_activity = os.time()
                
                print("✅ CHILD: Updated " .. (is_user1 and "User1" or "User2") .. " with " .. message_count .. " messages")
                
                update_chats_registry_json()
                cleanup_processed_messages()
                
                Send({
                    target = msg.From,
                    data = json.encode({
                        status = "success",
                        message = "Messages updated successfully",
                        chatId = target_chat_id,
                        messageCount = target_chat.total_messageCount
                    })
                })
            else
                print("❌ CHILD: ERROR - Chat not found or invalid data")
                Send({
                    target = msg.From,
                    data = json.encode({
                        status = "error",
                        message = "Chat not found or invalid data"
                    })
                })
            end
        end)
        
        -- Handler: Info (returns user's chat data and contacts) - Allow open access
        Handlers.add('Info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(msg)

            update_chats_registry_json()

            -- Create response structure that preserves existing chat format
            local responseData = {}

            -- First, populate with existing chat data (preserve original structure)
            if chats_registry_json and chats_registry_json ~= "" then
                local success, chatData = pcall(json.decode, chats_registry_json)
                if success and chatData then
                    -- Copy all chat data to response root level (maintains backward compatibility)
                    for key, value in pairs(chatData) do
                        responseData[key] = value
                    end
                end
            end

            -- Add contacts data as additional fields (not replacing chat structure)
            responseData._contactsData = UserProfile.contacts or {}
            responseData._contactsStateHash = UserProfile.contactsStateHash or ""

            -- Add version information
            responseData._BUILD_VERSION = BUILD_VERSION
            responseData._MASTER_VERSION = MASTER_VERSION
            responseData._USER_PROCESS_VERSION = USER_PROCESS_VERSION
            responseData._FRONTEND_VERSION = FRONTEND_VERSION

            Send({
                Target = msg.From,
                Data = json.encode(responseData)
            })

            print("📊 CHILD: Sent chat registry data and contacts to " .. msg.From)
            print("📞 CHILD: Contacts state hash: " .. tostring(UserProfile.contactsStateHash))
        end)
        
        -- Handler: Get Messages - Allow open access for recipients
        Handlers.add('GetMessages', Handlers.utils.hasMatchingTag('Action', 'get-messages'), function(msg)
            
            local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
            
            if not chat_id then
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "Missing chat_id"})
                })
                return
            end
            
            if not chats_storage[chat_id] then
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "Chat not found"})
                })
                return
            end
            
            local messages = chats_storage[chat_id].messages or {}
            
            Send({
                target = msg.From,
                data = json.encode({
                    status = "success",
                    messages = messages,
                    count = #messages
                })
            })
            
            print("📨 CHILD: Retrieved " .. #messages .. " messages from chat " .. chat_id)
        end)
        
        -- Additional handlers (AddMember, GetMembers, UpdateMemberProfile) with owner validation
        Handlers.add('AddMember', Handlers.utils.hasMatchingTag('Action', 'add-member'), function(msg)
            if msg.From ~= USER_ADDRESS then 
                print("❌ CHILD: Add member denied - wrong user. Expected: " .. USER_ADDRESS .. ", Got: " .. msg.From)
                return 
            end
            
            local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
            local member_address = msg.member_address or msg.Tags.member_address
            local sender = msg.From
            
            if not chat_id or not member_address then
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "Missing chat_id or member_address"})
                })
                return
            end
            
            local success, message = add_member_to_chat(chat_id, member_address)
            
            Send({
                target = msg.From,
                data = json.encode({
                    status = success and "success" or "error",
                    message = message
                })
            })
        end)
        
        Handlers.add('GetMembers', Handlers.utils.hasMatchingTag('Action', 'get-members'), function(msg)
            
            local chat_id = msg.chat_id or msg["chat_id"] or msg.Tags.chat_id or msg.Tags["chat_id"]
            
            if not chat_id then
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "Missing chat_id"})
                })
                return
            end
            
            local members = get_chat_members(chat_id)
            
            Send({
                target = msg.From,
                data = json.encode({
                    status = "success",
                    members = members
                })
            })
        end)
        
        Handlers.add('UpdateMemberProfile', Handlers.utils.hasMatchingTag('Action', 'update-member-profile'), function(msg)
            if msg.From ~= USER_ADDRESS then 
                print("❌ CHILD: Update member profile denied - wrong user. Expected: " .. USER_ADDRESS .. ", Got: " .. msg.From)
                return 
            end
            
            local name = msg.name or msg.Tags.name
            local avatar = msg.avatar or msg.Tags.avatar
            local sender = msg.From
            
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
            
            Send({
                target = msg.From,
                data = json.encode({status = "success", message = "Profile updated"})
            })
        end)

        -- Handler: Update Contacts (with owner validation)
        Handlers.add('UpdateContacts', Handlers.utils.hasMatchingTag('Action', 'update-contacts'), function(msg)
            if msg.From ~= USER_ADDRESS then
                print("❌ CHILD: Update contacts denied - wrong user. Expected: " .. USER_ADDRESS .. ", Got: " .. msg.From)
                return
            end

            print("✅ CHILD: Update contacts request from authorized user: " .. msg.From)

            local data = msg.Data
            if not data or data == "" then
                print("❌ CHILD: No contacts data provided")
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "No contacts data provided"})
                })
                return
            end

            local success, contactsData = pcall(json.decode, data)
            if not success or not contactsData then
                print("❌ CHILD: Invalid JSON data provided")
                Send({
                    target = msg.From,
                    data = json.encode({status = "error", message = "Invalid contacts data format"})
                })
                return
            end

            -- Update the user profile with encrypted contacts data
            UserProfile.contacts = contactsData.encryptedContacts or {}
            UserProfile.contactsStateHash = contactsData.stateHash or ""

            print("✅ CHILD: Contacts updated successfully")
            print("📊 CHILD: New state hash: " .. tostring(UserProfile.contactsStateHash))

            Send({
                target = msg.From,
                data = json.encode({
                    status = "success",
                    message = "Contacts updated successfully",
                    stateHash = UserProfile.contactsStateHash
                })
            })
        end)

        -- Handler: Update User Process Version (with owner validation)
        Handlers.add('Update-UserVersion', Handlers.utils.hasMatchingTag('Action', 'Update-UserVersion'), function(msg)
            if msg.From ~= USER_ADDRESS then
                print("❌ CHILD: Update version denied - wrong user. Expected: " .. USER_ADDRESS .. ", Got: " .. msg.From)
                Send({
                    Target = msg.From,
                    Data = json.encode({
                        status = "error",
                        message = "Unauthorized: Only the process owner can update their version"
                    })
                })
                return
            end

            print("🔄 CHILD: Version update request from authorized user: " .. msg.From)

            local newVersion = msg.Tags["New-Version"] or msg.Tags["new_version"]

            if not newVersion then
                print("❌ CHILD: Missing new version in update request")
                Send({
                    Target = msg.From,
                    Data = json.encode({
                        status = "error",
                        message = "Missing new version string"
                    })
                })
                return
            end

            -- Update the USER_PROCESS_VERSION
            USER_PROCESS_VERSION = newVersion

            -- Recalculate BUILD_VERSION
            BUILD_VERSION = MASTER_VERSION .. "-" .. USER_PROCESS_VERSION .. "-" .. FRONTEND_VERSION

            print("✅ CHILD: User process version updated")
            print("   • New USER_PROCESS_VERSION: " .. USER_PROCESS_VERSION)
            print("   • New BUILD_VERSION: " .. BUILD_VERSION)

            -- Notify master process about the build version change
            Send({
                Target = "]] .. ao.id .. [[",
                Tags = {
                    { name = "Action", value = "Update-Build" },
                    { name = "Build-Version", value = BUILD_VERSION }
                },
                Data = json.encode({
                    userProcessVersion = USER_PROCESS_VERSION,
                    buildVersion = BUILD_VERSION,
                    userAddress = USER_ADDRESS
                })
            })

            print("📡 CHILD: Notified master process of build version update")

            -- Send success response to user
            Send({
                Target = msg.From,
                Data = json.encode({
                    status = "success",
                    message = "User process version updated successfully",
                    USER_PROCESS_VERSION = USER_PROCESS_VERSION,
                    BUILD_VERSION = BUILD_VERSION
                })
            })

            print("✅ CHILD: Version update complete")
        end)

        -- Handler: Add Reaction (with participant validation)
        Handlers.add('AddReaction', Handlers.utils.hasMatchingTag('Action', 'add-reaction'), function(msg)
            print("🎭 CHILD: Add reaction request from: " .. msg.From)

            local chat_id = msg.Tags["Chat-Id"] or msg.Tags["chat_id"]
            local message_id = msg.Tags["Message-Id"] or msg.Tags["message_id"]
            local emoji = msg.Tags["Emoji"] or msg.Tags["emoji"]

            if not chat_id or not message_id or not emoji then
                print("❌ CHILD: Missing required reaction data")
                Send({
                    Target = msg.From,
                    Data = json.encode({
                        status = "error",
                        message = "Missing chat_id, message_id, or emoji"
                    })
                })
                return
            end

            -- Check if chat exists
            if not chats_storage[chat_id] then
                print("❌ CHILD: Chat not found: " .. chat_id)
                Send({
                    Target = msg.From,
                    Data = json.encode({status = "error", message = "Chat not found"})
                })
                return
            end

            local chat = chats_storage[chat_id]

            -- Verify user is a participant in this chat
            local is_participant = false
            for participant in chat.participants:gmatch("[^,]+") do
                local clean_participant = participant:match("^%s*(.-)%s*$")
                if clean_participant == msg.From then
                    is_participant = true
                    break
                end
            end

            if not is_participant then
                print("❌ CHILD: User not participant in chat: " .. msg.From)
                Send({
                    Target = msg.From,
                    Data = json.encode({status = "error", message = "Not a participant in this chat"})
                })
                return
            end

            -- Initialize reactions array if it doesn't exist
            if not chat.reactions then
                chat.reactions = {}
            end

            -- Check if user already reacted to this message
            local existing_reaction_index = nil
            for i, reaction in ipairs(chat.reactions) do
                if reaction.messageId == message_id and reaction.reactorAddress == msg.From then
                    existing_reaction_index = i
                    break
                end
            end

            -- Create reaction object
            local reaction = {
                id = "reaction_" .. tostring(os.time()) .. "_" .. math.random(1000, 9999),
                messageId = message_id,
                emoji = emoji,
                reactorAddress = msg.From,
                timestamp = os.time(),
                chatId = chat_id
            }

            if existing_reaction_index then
                -- Update existing reaction
                chat.reactions[existing_reaction_index] = reaction
                print("✅ CHILD: Updated existing reaction for message " .. message_id)
            else
                -- Add new reaction
                table.insert(chat.reactions, reaction)
                print("✅ CHILD: Added new reaction for message " .. message_id)
            end

            -- Update reactions state hash for sync validation
            local reactions_string = json.encode(chat.reactions)
            chat.reactionsStateHash = tostring(os.time()) .. "_" .. tostring(#chat.reactions)

            print("📊 CHILD: Reactions state hash updated: " .. chat.reactionsStateHash)

            Send({
                Target = msg.From,
                Data = json.encode({
                    status = "success",
                    message = "Reaction added successfully",
                    reactionId = reaction.id,
                    reactionsStateHash = chat.reactionsStateHash
                })
            })
        end)

        print("🎯 CHILD: Process initialized!")
        print("👤 CHILD: User this process serves: " .. USER_ADDRESS)
        print("🔒 CHILD: All handlers secured with user validation")
        print("📱 CHILD: Ready for secure messaging operations")
        
        -- Notify master that setup is complete
        Send({Target = "]] .. ao.id .. [[", Action = "ProcessReady", Data = "Child process ready for " .. USER_ADDRESS})
    ]]
    
    -- Send the handler code to the child process
    Send({
        Target = processId,
        Action = "Eval", 
        Data = handlerCode
    })
    print("✅ MASTER: Child process " .. processId .. " has been updated for user " .. userAddress .. " with necessary handlers. Awaiting readiness response")
end

-- Handler: Login - Main entry point for users
Handlers.add('Login', Handlers.utils.hasMatchingTag('Action', 'Login'), function(msg)
    local userAddress = msg.From
    
    print("🔐 MASTER: Login request from: " .. userAddress)
    
    -- Check if user is currently spawning
    if UsersCurrentlySpawning[userAddress] then
        local spawnInfo = UsersCurrentlySpawning[userAddress]
        local timeElapsedMs = msg.Timestamp - spawnInfo.startTime
        local timeElapsedSeconds = math.floor(timeElapsedMs / 1000)
        local SPAWN_TIMEOUT = 300 -- 5 minutes in seconds

        if timeElapsedSeconds > SPAWN_TIMEOUT then
            print("⏰ MASTER: Spawn timeout for user " .. userAddress .. " (elapsed: " .. formatElapsedTime(timeElapsedMs) .. "), clearing flag and retrying...")
            UsersCurrentlySpawning[userAddress] = nil
            -- Continue with normal spawn logic below
        else
            print("⏳ MASTER: User " .. userAddress .. " is currently spawning (elapsed: " .. formatElapsedTime(timeElapsedMs) .. ")")

            Send({
                Target = msg.From,
                Data = json.encode({
                    status = "spawning_in_progress",
                    message = "Your process is still being created, please wait...",
                    timeElapsed = timeElapsedSeconds
                })
            })
            return
        end
    end
    
    ensureUserStructure(userAddress)
    
    if #UserProcessMap[userAddress].ownedProcesses == 0 then
        -- New user - spawn dedicated process
        print("👤 MASTER: New user detected, spawning process...")
        
        -- Mark user as currently spawning (this is done inside spawnUserProcess, but we need to do it here for async)
        UsersCurrentlySpawning[userAddress] = {
            startTime = msg.Timestamp,
            status = "spawning",
            requesterMsg = msg  -- Store the original message to respond to later
        }
        
        -- Start spawn process asynchronously
        Spawn(ao.env.Module.Id, {
            Tags = {
                { name = "Authority", value = AUTHORITY_ADDRESS },
                { name = "User-Owner", value = userAddress },
                { name = "Process-Type", value = "UserMessaging"}
            }
        })
        
        print("🚀 MASTER: Spawn initiated for user: " .. userAddress)
        
        -- Send a "spawning" status so frontend knows to wait/retry
        Send({
            Target = msg.From,
            Data = json.encode({
                status = "spawning",
                message = "Creating your secure process, please wait a moment..."
            })
        })
    else
        -- Existing user - return their processes
        local userInfo = UserProcessMap[userAddress]
        print("👤 MASTER: Returning existing processes for user")
        print("   • Owned: " .. #userInfo.ownedProcesses .. " processes")
        print("   • Recipient: " .. #userInfo.recipientProcesses .. " processes")
        print("   • Build Version: " .. tostring(userInfo.BUILD_VERSION))

        Send({
            Target = msg.From,
            Data = json.encode({
                status = "existing_user",
                ownedProcesses = userInfo.ownedProcesses,
                recipientProcesses = userInfo.recipientProcesses,
                BUILD_VERSION = userInfo.BUILD_VERSION,
                message = "Welcome back to HyperGram!"
            })
        })
    end
    
    print("✅ MASTER: Login response sent to " .. userAddress)
end)

-- Handler: Process Spawned - Handle successful spawn events
Handlers.add('Spawned', Handlers.utils.hasMatchingTag('Action', 'Spawned'), function(msg)
    local spawnedProcessId = msg.Process
    local userAddress = nil
    
    -- Find which user this spawn was for
    for addr, spawnInfo in pairs(UsersCurrentlySpawning) do
        if spawnInfo.status == "spawning" then
            userAddress = addr
            break
        end
    end
    
    if not userAddress then
        print("⚠️ MASTER: Received Spawned message but no user found in spawning state")
        return
    end
    
    print("✅ MASTER: Child process spawned: " .. spawnedProcessId .. " for user: " .. userAddress)
    
    -- Setup the child process with user handlers
    setupUserProcessHandlers(spawnedProcessId, userAddress)
    
    -- Update spawning info with process ID (but don't complete yet - wait for ProcessReady)
    UsersCurrentlySpawning[userAddress].processId = spawnedProcessId
    UsersCurrentlySpawning[userAddress].status = "setting_up"
end)

-- Handler: Process Ready - Handle when child process is fully ready
Handlers.add('ProcessReady', Handlers.utils.hasMatchingTag('Action', 'ProcessReady'), function(msg)
    local childProcessId = msg.From
    
    -- Find which user this process belongs to
    local userAddress = nil
    local spawnInfo = nil
    
    for addr, info in pairs(UsersCurrentlySpawning) do
        if info.processId == childProcessId then
            userAddress = addr
            spawnInfo = info
            break
        end
    end
    
    if not userAddress or not spawnInfo then
        print("⚠️ MASTER: ProcessReady from unknown process: " .. childProcessId)
        return
    end
    
    print("✅ MASTER: ProcessReady confirmation received - child process " .. childProcessId .. " is fully ready for user " .. userAddress)
    
    -- Add process to user's owned processes
    ensureUserStructure(userAddress)
    table.insert(UserProcessMap[userAddress].ownedProcesses, childProcessId)
    print("✅ MASTER: New user process created: " .. childProcessId)
    
    -- Send success response to the original requester
    print("🔍 DEBUG: About to check spawnInfo.requesterMsg")
    print("🔍 DEBUG: spawnInfo exists: " .. tostring(spawnInfo ~= nil))
    if spawnInfo and spawnInfo.requesterMsg then
        print("🔍 DEBUG: spawnInfo.requesterMsg exists: " .. tostring(spawnInfo.requesterMsg ~= nil))
        print("🔍 DEBUG: requesterMsg.From: " .. tostring(spawnInfo.requesterMsg.From))
        print("🔍 DEBUG: childProcessId: " .. tostring(childProcessId))
        print("📤 MASTER: Sending login success message to " .. spawnInfo.requesterMsg.From)
        
        Send({
            Target = spawnInfo.requesterMsg.From,
            Data = json.encode({
                status = "new_process",
                ownedProcesses = {childProcessId},
                recipientProcesses = UserProcessMap[userAddress].recipientProcesses,
                message = "Welcome to HyperGram! Your secure process has been created."
            })
        })
        print("✅ MASTER: Login response sent to " .. userAddress)
    else
        print("❌ MASTER: Cannot send login response - spawnInfo.requesterMsg is missing!")
        print("🔍 DEBUG: spawnInfo: " .. tostring(spawnInfo))
        if spawnInfo then
            print("🔍 DEBUG: spawnInfo.requesterMsg: " .. tostring(spawnInfo.requesterMsg))
        end
    end
    
    -- Clean up spawning state
    UsersCurrentlySpawning[userAddress] = nil
end)

-- Handler: Get User Process (utility for debugging)
Handlers.add('GetUserProcess', Handlers.utils.hasMatchingTag('Action', 'GetUserProcess'), function(msg)
    local userAddress = msg.From
    ensureUserStructure(userAddress)
    local userInfo = UserProcessMap[userAddress]
    
    if #userInfo.ownedProcesses > 0 or #userInfo.recipientProcesses > 0 then
        Send({
            Target = msg.From,
            Data = json.encode({
                status = "success",
                ownedProcesses = userInfo.ownedProcesses,
                recipientProcesses = userInfo.recipientProcesses,
                userAddress = userAddress
            })
        })
    else
        Send({
            Target = msg.From,
            Data = json.encode({
                status = "not_found",
                message = "No processes found for user",
                userAddress = userAddress
            })
        })
    end
end)

-- Handler: Update Build Version from child process
Handlers.add('Update-Build', Handlers.utils.hasMatchingTag('Action', 'Update-Build'), function(msg)
    local childProcessId = msg.From
    local newBuildVersion = msg.Tags["Build-Version"] or msg.Tags["build_version"]

    print("🔄 MASTER: Build version update request from process: " .. childProcessId)
    print("   • New Build Version: " .. tostring(newBuildVersion))

    if not newBuildVersion then
        print("❌ MASTER: Missing build version in update request")
        Send({
            Target = childProcessId,
            Data = json.encode({
                status = "error",
                message = "Missing build version"
            })
        })
        return
    end

    -- Find which user owns this process
    local ownerAddress = nil
    for userAddr, userInfo in pairs(UserProcessMap) do
        for _, processId in ipairs(userInfo.ownedProcesses) do
            if processId == childProcessId then
                ownerAddress = userAddr
                break
            end
        end
        if ownerAddress then break end
    end

    if not ownerAddress then
        print("❌ MASTER: Process not found in any user's owned processes: " .. childProcessId)
        Send({
            Target = childProcessId,
            Data = json.encode({
                status = "error",
                message = "Process not registered to any user"
            })
        })
        return
    end

    -- Update the build version for this user
    UserProcessMap[ownerAddress].BUILD_VERSION = newBuildVersion

    print("✅ MASTER: Updated build version for user " .. ownerAddress)
    print("   • Process: " .. childProcessId)
    print("   • New Version: " .. newBuildVersion)

    -- Send confirmation back to child process
    Send({
        Target = childProcessId,
        Data = json.encode({
            status = "success",
            message = "Build version updated successfully",
            buildVersion = newBuildVersion
        })
    })
end)

-- Handler: Chat Creation Notification from child processes
Handlers.add('NotifyChatCreated', Handlers.utils.hasMatchingTag('Action', 'NotifyChatCreated'), function(msg)
    local chatId = msg.Tags["Chat-Id"] or msg.Tags["chat_id"]
    local participants = msg.Tags["Participants"] or msg.Tags["participants"]
    local childProcessId = msg.Tags["Process-Id"] or msg.Tags["process_id"]
    
    -- Get the creator address from the message data, not msg.From (which is the process ID)
    local creatorAddress = nil
    if msg.Data then
        local success, chatData = pcall(json.decode, msg.Data)
        if success and chatData and chatData.creator then
            creatorAddress = chatData.creator
        end
    end
    
    -- Validation: Don't allow process IDs to register as users
    if not creatorAddress or creatorAddress == childProcessId then
        print("❌ MASTER: Invalid creator address - preventing process self-registration")
        return
    end
    
    print("📨 MASTER: Chat creation notification received")
    print("   • Chat ID: " .. tostring(chatId))
    print("   • Participants: " .. tostring(participants))
    print("   • Creator: " .. tostring(creatorAddress))
    print("   • Process: " .. tostring(childProcessId))
    
    if not participants or not childProcessId then
        print("❌ MASTER: Missing required fields for chat notification")
        return
    end
    
    -- Parse participants
    local participantList = {}
    for participant in participants:gmatch("[^,]+") do
        table.insert(participantList, participant:match("^%s*(.-)%s*$"))
    end
    
    -- Ensure creator has the process in their owned list (should already be there)
    ensureUserStructure(creatorAddress)
    local creatorHasProcess = false
    for _, processId in ipairs(UserProcessMap[creatorAddress].ownedProcesses) do
        if processId == childProcessId then
            creatorHasProcess = true
            break
        end
    end
    
    if not creatorHasProcess then
        table.insert(UserProcessMap[creatorAddress].ownedProcesses, childProcessId)
        print("📋 MASTER: Added process to creator's owned list")
    end
    
    -- Add recipient access for all other participants
    for _, participant in ipairs(participantList) do
        if participant ~= creatorAddress then
            local added = addRecipientAccess(participant, childProcessId)
            if added then
                print("✅ MASTER: Granted " .. participant .. " recipient access to process " .. childProcessId)
            end
        end
    end
    
    print("🔗 MASTER: Chat discovery updated for all participants")
end)

-- Handler: Master Process Info (for debugging)
Handlers.add('Info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(msg)
    local processCount = 0
    for _ in pairs(UserProcessMap) do
        processCount = processCount + 1
    end
    
    Send({
        Target = msg.From,
        Data = json.encode({
            type = "master_process",
            totalUsers = processCount,
            userProcessMap = UserProcessMap,
            BUILD_VERSION = BUILD_VERSION,
            MASTER_VERSION = MASTER_VERSION,
            USER_PROCESS_VERSION = USER_PROCESS_VERSION,
            FRONTEND_VERSION = FRONTEND_VERSION
        })
    })
    
    print("📊 MASTER: Info request served - " .. processCount .. " users registered")
end)

-- Initialize master process
print("🚀 HYPERGRAM MASTER PROCESS INITIALIZED")
print("⚡ Ultra-lightweight architecture for maximum scalability")
print("👥 Ready to manage user processes")
print("🔧 Available actions: Login, GetUserProcess, NotifyChatCreated, Info")
print("📊 Current registered users: " .. (function()
    local count = 0
    for _ in pairs(UserProcessMap) do
        count = count + 1
    end
    return count
end)())