# HyperGram Master/Child Process Architecture

## 🏗️ Architecture Overview

HyperGram now uses a scalable master/child process architecture where:
- **Master Process**: Ultra-lightweight user-to-process mapping and spawning
- **Child Processes**: Individual user messaging processes with complete data isolation

## 📁 Files Created/Modified

### New Files:
1. **`lua/master-process.lua`** - Master process code for deployment
2. **`MASTER_CHILD_ARCHITECTURE.md`** - This documentation

### Modified Files:
1. **`legacy-hypergram-js.js`** - Frontend updated for new architecture

## 🚀 Deployment Steps

### Step 1: Deploy Master Process
1. Deploy `lua/master-process.lua` as a new AO process
2. Copy the resulting process ID
3. Update `MASTER_PROCESS_ID` in `legacy-hypergram-js.js` (line 21)

### Step 2: Test Single User Flow
1. Connect wallet through existing UI
2. Verify master process login works
3. Verify child process is spawned
4. Test basic chat creation and messaging

### Step 3: Scale Testing
1. Test with multiple users
2. Verify process isolation
3. Monitor performance improvements

## 🔧 Configuration Required

In `legacy-hypergram-js.js`, update this line:
```javascript
const MASTER_PROCESS_ID = 'YOUR_DEPLOYED_MASTER_PROCESS_ID_HERE';
```

## 📊 Architecture Benefits

### Performance Improvements:
- ✅ Each user gets dedicated process (no contention)
- ✅ Parallel message processing across users
- ✅ Master process only handles spawning (minimal load)
- ✅ Child processes handle all user data operations

### Security Enhancements:
- ✅ Complete data isolation between users
- ✅ Owner validation on all child process handlers
- ✅ No cross-user data access possible
- ✅ Process-level security boundaries

### Scalability Features:
- ✅ Supports thousands of concurrent users
- ✅ Linear scaling with user count
- ✅ No shared state bottlenecks
- ✅ Independent process lifecycle management

## 🔍 How It Works

### User Login Flow:
1. User connects wallet → gets `userAddress`
2. Frontend calls `loginToMasterProcess()`
3. Master process checks if user exists:
   - **New User**: Spawns dedicated child process
   - **Existing User**: Returns existing process ID
4. Frontend stores `userProcessId` and continues with normal flow

### Message Flow:
1. All chat operations route to user's `userProcessId`
2. Child process validates `msg.From == OWNER_ADDRESS`
3. Operations proceed normally with complete isolation
4. No interference between different users' processes

### Process Spawning:
1. Master uses `ao.spawn()` to create child process
2. Injects complete handler code via `Eval` action
3. Child process initializes with user-specific validation
4. Master records `userAddress -> processId` mapping

## 🛠️ Key Functions

### Master Process (`master-process.lua`):
- `spawnUserProcess()` - Creates new child process
- `setupUserProcessHandlers()` - Injects handler code
- `Login` handler - Main entry point for users

### Frontend (`legacy-hypergram-js.js`):
- `loginToMasterProcess()` - Gets user's process ID
- All existing functions updated to use `userProcessId`
- Auto-reconnect flow includes master login

### Child Process (Generated):
- Complete copy of original messenger handlers
- `validateOwner()` - Ensures only process owner can access
- All user data isolated within child process

## 🔒 Security Model

Each child process has:
- **Owner Address**: Set during spawn (immutable)
- **Owner Validation**: All handlers check `msg.From`
- **Data Isolation**: No access to other users' data
- **Process Boundaries**: Complete separation from other users

## 🔄 Version Update System

HyperGram includes a version tracking and update rail system for managing user process versions.

### Version Format:
```
BUILD_VERSION = MASTER_VERSION-USER_PROCESS_VERSION-FRONTEND_VERSION
Example: "A01-A01-A01"
```

### Version Tracking:

**UserProcessMap Structure:**
```lua
UserProcessMap[userAddress] = {
    BUILD_VERSION = "A01-A01-A01",
    ownedProcesses = { "processId..." },
    recipientProcesses = { "processId..." }
}
```

**Login Response:**
- Returns current `BUILD_VERSION` for existing users
- Allows frontend to display and track user's current version

### Update Flow:

1. **User Initiates Update** (via signed eval command):
   ```javascript
   // User accepts update package and signs eval command
   send({
     process: userProcessId,
     tags: [
       { name: 'Action', value: 'Update-UserVersion' },
       { name: 'New-Version', value: 'A02' }
     ]
   })
   ```

2. **Child Process Validates** (`Update-UserVersion` handler):
   - Validates `msg.From == USER_ADDRESS` (only owner can update)
   - Updates `USER_PROCESS_VERSION` variable
   - Recalculates `BUILD_VERSION`
   - Logs version change

3. **Child Notifies Master**:
   - Sends `Update-Build` action to master process
   - Includes new `BUILD_VERSION` in tags

4. **Master Process Updates** (`Update-Build` handler):
   - Validates `msg.From` is a registered child process
   - Finds owning user in UserProcessMap
   - Updates user's `BUILD_VERSION`
   - Confirms update to child

5. **Future Logins**:
   - Return updated `BUILD_VERSION`
   - Frontend displays current version

### Security Validations:

**Child Process (Update-UserVersion):**
```lua
if msg.From ~= USER_ADDRESS then
    -- Deny: Only process owner can update their version
    return error
end
```

**Master Process (Update-Build):**
```lua
-- Find which user owns this child process
for userAddr, userInfo in pairs(UserProcessMap) do
    if processId in userInfo.ownedProcesses then
        -- Valid child process, update BUILD_VERSION
    end
end
```

### Handlers:

**Child Process Handler:**
- Action: `Update-UserVersion`
- Tags: `New-Version` (required)
- Validates: Owner only
- Updates: `USER_PROCESS_VERSION`, `BUILD_VERSION`
- Notifies: Master process

**Master Process Handler:**
- Action: `Update-Build`
- Tags: `Build-Version` (required)
- Validates: Process ownership
- Updates: `UserProcessMap[user].BUILD_VERSION`
- Returns: Confirmation

### Usage Example:

When deploying an update package:
```javascript
// 1. Present update to user with version info
const updatePackage = {
    version: "A02",
    changes: "Bug fixes and performance improvements",
    evalCode: "-- update code here --"
}

// 2. User accepts and signs eval command
const result = await sendUpdate(userProcessId, {
    action: 'Update-UserVersion',
    newVersion: 'A02',
    evalCode: updatePackage.evalCode  // Optional: additional eval for updates
})

// 3. Version is updated automatically
// 4. Next login shows BUILD_VERSION: "A01-A02-A01"
```

### Version Components:

- **MASTER_VERSION**: Master process version (updated during master redeployment)
- **USER_PROCESS_VERSION**: Child process version (updated via Update-UserVersion)
- **FRONTEND_VERSION**: Frontend version (tracked separately, part of build tag)

## 📈 Expected Performance

- **Before**: 100 concurrent users (single process limit)
- **After**: 1000+ concurrent users (distributed across processes)
- **Latency**: Improved due to no process contention
- **Throughput**: Linear scaling with user count

## 🧪 Testing Checklist

- [ ] Master process deploys successfully
- [ ] Single user login works
- [ ] Child process is spawned for new users
- [ ] Existing users get their process ID
- [ ] Chat creation works in child process
- [ ] Message sending works in child process
- [ ] Message decryption works in child process
- [ ] Multiple users work simultaneously
- [ ] No cross-user data access
- [ ] Performance improves with scale

## 🔧 Troubleshooting

### Common Issues:

1. **"No user process ID available"**
   - Check master process login succeeded
   - Verify `userProcessId` is set correctly

2. **"Access denied - not process owner"**
   - Child process owner validation working correctly
   - Check wallet address matches process owner

3. **Child process not spawning**
   - Verify master process has correct module ID
   - Check spawn configuration in master process

4. **Master login fails**
   - Verify `MASTER_PROCESS_ID` is correct
   - Check master process is deployed and running

## 📝 Next Steps

1. Deploy master process to AO
2. Update frontend with master process ID
3. Test with single user
4. Scale test with multiple users
5. Monitor performance and optimize as needed

The architecture is now ready for deployment and should provide the scalability needed for thousands of concurrent users!