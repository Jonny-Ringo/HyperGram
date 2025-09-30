import {
  result,
  results,
  message,
  spawn,
  monitor,
  unmonitor,
  dryrun,
  createDataItemSigner,
  connect,
} from "@permaweb/aoconnect";

import { WanderConnect } from "@wanderapp/connect";
import { EmojiPalette, EmojiUtils } from "./emoji-palette.js";

        // Version Information
        const MASTER_VERSION = "A01";
        const USER_PROCESS_VERSION = "A01";
        const FRONTEND_VERSION = "A01";
        const BUILD_VERSION = `${MASTER_VERSION}-${USER_PROCESS_VERSION}-${FRONTEND_VERSION}`;

        let wallet = null;
        let userAddress = null;
        let currentChat = null;
        let walletType = null; // 'wander-extension' or 'wander-connect'
        let wanderConnect = null; // Wander Connect instance
        
        // Theme Manager
        const themeManager = {
            currentTheme: 'default',
            themeLink: null,
            
            // Initialize theme system
            initialize() {
                this.themeLink = document.getElementById('theme-link');
                const savedTheme = this.getThemePreference();
                this.loadTheme(savedTheme);
                this.setupThemeSelector();
            },
            
            // Load a specific theme
            loadTheme(themeName) {
                if (!this.themeLink) {
                    // Create theme link if it doesn't exist
                    this.themeLink = document.createElement('link');
                    this.themeLink.id = 'theme-link';
                    this.themeLink.rel = 'stylesheet';
                    document.head.appendChild(this.themeLink);
                }
                
                this.themeLink.href = `themes/${themeName}.css`;
                this.currentTheme = themeName;
                this.saveThemePreference(themeName);
                
                // Update skin option selection in modal
                this.updateSkinsModal(themeName);
                
                console.log(`🎨 Theme changed to: ${themeName}`);
            },
            
            // Setup Options menu and Skins modal
            setupThemeSelector() {
                console.log('🎨 Setting up theme selector...');
                this.setupOptionsMenu();
                this.setupSkinsModal();
                console.log('✅ Theme selector setup complete');
            },
            
            // Setup Options menu functionality
            setupOptionsMenu() {
                const optionsBtn = document.getElementById('optionsBtn');
                const optionsDropdown = document.getElementById('optionsDropdown');
                
                // Setup Options menu functionality
                
                if (optionsBtn && optionsDropdown) {
                    // Remove existing event listeners to prevent duplicates
                    const newOptionsBtn = optionsBtn.cloneNode(true);
                    optionsBtn.parentNode.replaceChild(newOptionsBtn, optionsBtn);
                    
                    const newOptionsDropdown = optionsDropdown.cloneNode(true);
                    optionsDropdown.parentNode.replaceChild(newOptionsDropdown, optionsDropdown);
                    
                    // Get fresh references after cloning
                    const freshOptionsBtn = document.getElementById('optionsBtn');
                    const freshOptionsDropdown = document.getElementById('optionsDropdown');
                    
                    // Toggle dropdown
                    freshOptionsBtn.addEventListener('click', (e) => {
                        // Options button clicked
                        e.stopPropagation();
                        const isOpen = freshOptionsDropdown.classList.contains('open');
                        
                        if (isOpen) {
                            this.closeOptionsMenu();
                        } else {
                            this.openOptionsMenu();
                        }
                    });
                    
                    // Handle option clicks
                    freshOptionsDropdown.addEventListener('click', (e) => {
                        // Options dropdown clicked
                        const item = e.target.closest('.options-item');
                        if (item && !item.hasAttribute('disabled')) {
                            const action = item.dataset.action;
                            console.log('🎯 Options item clicked:', action);
                            this.handleOptionAction(action);
                            this.closeOptionsMenu();
                        } else if (item && item.hasAttribute('disabled')) {
                            console.log('🚫 Disabled option clicked:', item.dataset.action);
                        }
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', () => {
                        this.closeOptionsMenu();
                    });
                } else {
                    console.error('❌ Options menu elements not found!', { optionsBtn, optionsDropdown });
                }
            },
            
            // Open Options menu
            openOptionsMenu() {
                console.log('📂 Opening Options menu...');
                const optionsBtn = document.getElementById('optionsBtn');
                const optionsDropdown = document.getElementById('optionsDropdown');
                
                if (optionsBtn && optionsDropdown) {
                    optionsBtn.classList.add('open');
                    optionsDropdown.classList.add('open');
                    console.log('✅ Options menu opened');
                } else {
                    console.error('❌ Cannot open Options menu - elements not found');
                }
            },
            
            // Close Options menu
            closeOptionsMenu() {
                const optionsBtn = document.getElementById('optionsBtn');
                const optionsDropdown = document.getElementById('optionsDropdown');
                
                if (optionsBtn && optionsDropdown) {
                    optionsBtn.classList.remove('open');
                    optionsDropdown.classList.remove('open');
                }
            },
            
            // Handle option actions
            handleOptionAction(action) {
                switch (action) {
                    case 'skins':
                        this.openSkinsModal();
                        break;
                    case 'contacts':
                        openContactsModal();
                        break;
                }
            },
            
            // Setup Skins modal functionality
            setupSkinsModal() {
                const modal = document.getElementById('skinsModal');
                const closeBtn = document.getElementById('closeSkinsModal');
                const skinOptions = document.querySelectorAll('.skin-option');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.closeSkinsModal();
                    });
                }
                
                if (modal) {
                    // Close modal when clicking overlay
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeSkinsModal();
                        }
                    });
                    
                    // Close modal with Escape key
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && modal.classList.contains('open')) {
                            this.closeSkinsModal();
                        }
                    });
                }
                
                // Handle skin selection
                skinOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        const theme = option.dataset.theme;
                        this.loadTheme(theme);
                        // Keep modal open so user can try different themes
                    });
                });
                
                // Set initial selection
                this.updateSkinsModal(this.currentTheme);
            },
            
            // Open Skins modal
            openSkinsModal() {
                const modal = document.getElementById('skinsModal');
                if (modal) {
                    modal.classList.add('open');
                    // Update selection when opening
                    this.updateSkinsModal(this.currentTheme);
                }
            },
            
            // Close Skins modal
            closeSkinsModal() {
                const modal = document.getElementById('skinsModal');
                if (modal) {
                    modal.classList.remove('open');
                }
            },
            
            // Update skin selection in modal
            updateSkinsModal(themeName) {
                const skinOptions = document.querySelectorAll('.skin-option');
                skinOptions.forEach(option => {
                    if (option.dataset.theme === themeName) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            },
            
            // Save theme preference to localStorage
            saveThemePreference(themeName) {
                localStorage.setItem('hyperGramTheme', themeName);
            },
            
            // Get saved theme preference from localStorage
            getThemePreference() {
                return localStorage.getItem('hyperGramTheme') || 'default';
            },
            
            // Get list of available themes
            getAvailableThemes() {
                return [
                    { value: 'default', name: 'Light Mode' },
                    { value: 'dark-mode', name: 'Dark Mode' },
                    { value: 'dark', name: 'Midnight' },
                    { value: 'neon', name: 'Cyber' },
                    { value: 'retro98', name: 'Retro98' }
                ];
            }
        };

        // Toast Notification System
        const toastManager = {
            container: null,
            toastCount: 0,

            // Initialize toast system
            initialize() {
                this.container = document.getElementById('toastContainer');
                if (!this.container) {
                    console.error('❌ Toast container not found!');
                    return false;
                }
                console.log('✅ Toast system initialized');
                return true;
            },

            // Show a toast notification
            show(message, type = 'info', duration = 4000) {
                if (!this.container && !this.initialize()) {
                    console.error('❌ Cannot show toast - container not available');
                    return;
                }

                const toast = this.createToast(message, type);
                this.container.appendChild(toast);

                // Trigger entrance animation
                requestAnimationFrame(() => {
                    toast.classList.add('toast-show');
                });

                // Auto-remove after duration
                setTimeout(() => {
                    this.removeToast(toast);
                }, duration);

                return toast;
            },

            // Create toast element
            createToast(message, type) {
                const toast = document.createElement('div');
                this.toastCount++;

                toast.className = `toast toast-${type}`;
                toast.setAttribute('data-toast-id', this.toastCount);

                // Get icon for toast type
                const icon = this.getIcon(type);

                toast.innerHTML = `
                    <div class="toast-content">
                        <span class="toast-icon">${icon}</span>
                        <span class="toast-message">${message}</span>
                        <button class="toast-close" aria-label="Close notification">×</button>
                    </div>
                `;

                // Add click to close functionality
                const closeBtn = toast.querySelector('.toast-close');
                closeBtn.addEventListener('click', () => {
                    this.removeToast(toast);
                });

                // Click anywhere on toast to close (optional)
                toast.addEventListener('click', () => {
                    this.removeToast(toast);
                });

                return toast;
            },

            // Get icon for toast type
            getIcon(type) {
                const icons = {
                    'success': '✓',
                    'error': '✕',
                    'warning': '⚠',
                    'info': 'ℹ'
                };
                return icons[type] || icons.info;
            },

            // Remove toast with animation
            removeToast(toast) {
                if (!toast || !toast.parentNode) return;

                toast.classList.add('toast-hide');

                // Remove from DOM after animation
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300); // Match CSS animation duration
            },

            // Clear all toasts
            clearAll() {
                if (!this.container) return;

                const toasts = this.container.querySelectorAll('.toast');
                toasts.forEach(toast => this.removeToast(toast));
            }
        };

        // Global toast function for easy use
        function showToast(message, type = 'info', duration = 4000) {
            return toastManager.show(message, type, duration);
        }

        // Master/Child Process Architecture
        const MASTER_PROCESS_ID = 'DZnLHbcvDL1tnfrVY0BDaaiZfimW4ToLcSGnMruSdp0'; // Replace with your master process ID
        let userProcessId = null; // Primary process (first owned process)
        let allUserProcesses = { owned: [], recipient: [] }; // All processes user has access to
        let isLoggingIn = false; // Track login state to prevent concurrent requests

        // Contacts management variables
        let userContacts = []; // Local contacts cache
        let contactsStateHash = ''; // State hash for sync validation

        window.MASTER_PROCESS_ID = MASTER_PROCESS_ID;

        // ===== WALLET SETUP FUNCTIONS =====

        // Setup currentWallet object (simplified since we use hybridCrypto system)
        async function setupCurrentWallet() {
            try {
                if (!userAddress || !wallet) {
                    throw new Error('No wallet connected');
                }

                console.log('🔑 Setting up wallet for contacts encryption...');

                // Ensure the existing hybridCrypto system has the user's public key cached
                try {
                    await hybridCrypto.getArweavePublicKey(userAddress);
                    console.log('✅ User public key cached in hybridCrypto system');
                } catch (error) {
                    console.log('⚠️ Could not cache public key in hybridCrypto system:', error.message);
                }

                // Set up currentWallet object (simplified for contacts)
                window.currentWallet = {
                    address: userAddress,
                    wallet: wallet,
                    type: walletType
                };

                console.log('✅ Wallet set up for contacts encryption');
                return true;

            } catch (error) {
                console.error('❌ Failed to setup wallet for contacts:', error);
                // Set up minimal currentWallet for address-based functionality
                window.currentWallet = {
                    address: userAddress,
                    wallet: wallet,
                    type: walletType
                };
                return false;
            }
        }

        // ===== CONTACTS MANAGEMENT FUNCTIONS =====

        // Generate state hash for contacts sync validation
        function generateContactsStateHash(contacts) {
            return btoa(JSON.stringify(contacts.map(c => ({ name: c.name, address: c.address })))).slice(0, 16);
        }

        // Load contacts from local storage
        function loadLocalContacts() {
            try {
                const userAddress = window.currentWallet?.address;
                if (!userAddress) return { contacts: [], stateHash: '' };

                const storedData = localStorage.getItem(`hypergramContacts_${userAddress}`);
                if (storedData) {
                    const data = JSON.parse(storedData);
                    return {
                        contacts: data.contacts || [],
                        stateHash: data.stateHash || ''
                    };
                }
                return { contacts: [], stateHash: '' };
            } catch (error) {
                console.error('❌ Failed to load local contacts:', error);
                return { contacts: [], stateHash: '' };
            }
        }

        // Save contacts to local storage
        function saveLocalContacts(contacts, stateHash) {
            try {
                const userAddress = window.currentWallet?.address;
                if (!userAddress) return false;

                localStorage.setItem(`hypergramContacts_${userAddress}`, JSON.stringify({
                    contacts: contacts,
                    stateHash: stateHash,
                    lastUpdated: Date.now()
                }));
                console.log('💾 Contacts saved to local storage:', contacts.length);
                return true;
            } catch (error) {
                console.error('❌ Failed to save local contacts:', error);
                return false;
            }
        }

        // Encrypt contacts JSON blob using hybrid AES + RSA encryption
        async function encryptContactsBlob(contactsJSON) {
            try {
                if (!wallet) {
                    throw new Error('Wallet not available. Please reconnect your wallet.');
                }

                console.log('🔐 Encrypting contacts with hybrid AES + RSA, size:', contactsJSON.length, 'bytes');

                // 1. Generate random AES key
                const aesKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );

                // 2. Generate random IV
                const iv = crypto.getRandomValues(new Uint8Array(12));

                // 3. Encrypt contacts JSON with AES-GCM (no size limit)
                const contactsData = new TextEncoder().encode(contactsJSON);
                const encryptedContactsBuffer = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv },
                    aesKey,
                    contactsData
                );

                // 4. Export AES key for RSA encryption
                const exportedAESKey = await crypto.subtle.exportKey('raw', aesKey);

                // 5. Encrypt AES key with wallet RSA (small key fits RSA limit)
                const encryptedAESKey = await wallet.encrypt(
                    new Uint8Array(exportedAESKey),
                    { name: 'RSA-OAEP', hash: 'SHA-256' }
                );

                // 6. Convert to base64 format
                const result = {
                    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedContactsBuffer))),
                    encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedAESKey))),
                    iv: btoa(String.fromCharCode(...iv))
                };

                console.log('✅ Contacts encrypted successfully with hybrid encryption');
                return result;
            } catch (error) {
                console.error('❌ Error encrypting contacts:', error);
                throw new Error(`Failed to encrypt contacts: ${error.message}`);
            }
        }

        // Decrypt contacts blob from server using hybrid AES + RSA decryption
        async function decryptContactsBlob(encryptedContactsData) {
            try {
                if (!encryptedContactsData) {
                    return [];
                }

                if (!wallet) {
                    console.warn('⚠️ No wallet available for decryption');
                    return [];
                }

                console.log('🔐 Decrypting contacts using hybrid decryption...');

                // Handle different formats
                let encryptedData, encryptedKey, iv;

                if (Array.isArray(encryptedContactsData)) {
                    // Legacy direct RSA format - try direct decryption
                    console.warn('⚠️ Legacy RSA format detected, trying direct decryption');
                    const encryptedArray = new Uint8Array(encryptedContactsData);
                    const decryptedData = await wallet.decrypt(encryptedArray, { name: 'RSA-OAEP', hash: 'SHA-256' });
                    const contactsJSON = new TextDecoder().decode(decryptedData);
                    return JSON.parse(contactsJSON);

                } else if (typeof encryptedContactsData === 'object' && encryptedContactsData.encryptedData) {
                    // New hybrid format
                    encryptedData = encryptedContactsData.encryptedData;
                    encryptedKey = encryptedContactsData.encryptedKey;
                    iv = encryptedContactsData.iv;

                } else {
                    console.warn('⚠️ Unknown encrypted contacts format');
                    return [];
                }

                // 1. Convert base64 to Uint8Array for wallet decryption
                const encryptedKeyArray = new Uint8Array(
                    atob(encryptedKey).split('').map(c => c.charCodeAt(0))
                );

                // 2. Decrypt AES key with wallet RSA
                const decryptedAESKeyBuffer = await wallet.decrypt(
                    encryptedKeyArray,
                    { name: 'RSA-OAEP', hash: 'SHA-256' }
                );

                // 3. Import AES key
                const aesKey = await crypto.subtle.importKey(
                    'raw',
                    decryptedAESKeyBuffer,
                    { name: 'AES-GCM' },
                    false,
                    ['decrypt']
                );

                // 4. Convert encrypted data and IV from base64
                const encryptedContactsBuffer = new Uint8Array(
                    atob(encryptedData).split('').map(c => c.charCodeAt(0))
                );
                const ivArray = new Uint8Array(
                    atob(iv).split('').map(c => c.charCodeAt(0))
                );

                // 5. Decrypt contacts with AES
                const decryptedContactsBuffer = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: ivArray },
                    aesKey,
                    encryptedContactsBuffer
                );

                const contactsJSON = new TextDecoder().decode(decryptedContactsBuffer);
                console.log('✅ Contacts decrypted successfully with hybrid decryption');
                return JSON.parse(contactsJSON);

            } catch (error) {
                console.error('❌ Failed to decrypt contacts blob:', error);
                console.error('❌ Decrypt error details:', error.message);
                return [];
            }
        }

        // Send contacts update to user process (encrypts entire array as single blob)
        async function sendContactsUpdate(contacts) {
            try {
                if (!userProcessId) throw new Error('No user process available');

                const newStateHash = generateContactsStateHash(contacts);

                // Encrypt the entire contacts array as a single JSON blob
                console.log('🔐 Encrypting contacts array:', contacts.length, 'contacts');
                const contactsJSON = JSON.stringify(contacts);
                const encryptedContactsBlob = await encryptContactsBlob(contactsJSON);

                const updateData = {
                    encryptedContacts: encryptedContactsBlob,
                    stateHash: newStateHash
                };

                const messageId = await message({
                    process: userProcessId,
                    tags: [{ name: 'Action', value: 'update-contacts' }],
                    signer: createDataItemSigner(wallet),
                    data: JSON.stringify(updateData)
                });

                const { Messages } = await result({
                    message: messageId,
                    process: userProcessId
                });

                if (Messages && Messages.length > 0) {
                    // Look for data in the Tags array
                    const dataTag = Messages[0].Tags?.find(tag => tag.name === 'data');
                    if (dataTag) {
                        const response = JSON.parse(dataTag.value);
                        if (response.status === 'success') {
                            contactsStateHash = newStateHash;
                            saveLocalContacts(contacts, newStateHash);
                            console.log('✅ Contacts updated successfully on server');
                            return true;
                        }
                    }
                }
                throw new Error('Server update failed');
            } catch (error) {
                console.error('❌ Failed to send contacts update:', error);
                throw error;
            }
        }

        // Add new contact
        async function addContact(contactData) {
            try {
                // Validate contact data
                if (!contactData.name || !contactData.address) {
                    throw new Error('Name and address are required');
                }

                // Validate address format (basic Arweave address check)
                if (!/^[A-Za-z0-9_-]{43}$/.test(contactData.address.trim())) {
                    throw new Error('Invalid Arweave address format');
                }

                // Check for duplicate addresses
                const existingContact = userContacts.find(c => c.address === contactData.address.trim());
                if (existingContact) {
                    throw new Error(`A contact with this address already exists: ${existingContact.name}`);
                }

                // Check if wallet is properly set up for encryption
                if (!window.currentWallet?.wallet || !userAddress) {
                    throw new Error('Wallet encryption not available. Please try reconnecting your wallet.');
                }

                // Create contact object
                const newContact = {
                    id: Date.now().toString(),
                    name: contactData.name.trim(),
                    address: contactData.address.trim(),
                    email: contactData.email ? contactData.email.trim() : '',
                    phone: contactData.phone ? contactData.phone.trim() : '',
                    twitter: contactData.twitter ? contactData.twitter.trim() : '',
                    linkedin: contactData.linkedin ? contactData.linkedin.trim() : '',
                    company: contactData.company ? contactData.company.trim() : '',
                    website: contactData.website ? contactData.website.trim() : '',
                    notes: contactData.notes ? contactData.notes.trim() : '',
                    tags: contactData.tags ? contactData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                // Add to local cache
                userContacts.push(newContact);

                try {
                    // Send to server
                    await sendContactsUpdate(userContacts);
                    console.log('✅ Contact added and synced:', newContact.name);
                    return newContact;
                } catch (serverError) {
                    // Remove from local cache if server update failed
                    userContacts.pop();
                    console.error('❌ Server sync failed, contact not saved:', serverError);
                    throw new Error('Failed to sync contact to server: ' + serverError.message);
                }

            } catch (error) {
                console.error('❌ Failed to add contact:', error);
                throw error;
            }
        }

        // Load contacts from server response (handles single encrypted blob)
        function handleContactsData(contactsData, serverStateHash) {
            try {
                const localData = loadLocalContacts();

                // Compare state hashes
                if (serverStateHash && serverStateHash === localData.stateHash && localData.contacts.length > 0) {
                    // Local cache is current
                    userContacts = localData.contacts;
                    contactsStateHash = serverStateHash;
                    console.log('✅ Using local contacts cache:', userContacts.length);
                    return;
                }

                // Need to decrypt server data
                if (contactsData && contactsData.length > 0) {
                    console.log('🔐 Decrypting contacts blob from server');
                    decryptContactsBlob(contactsData).then(decryptedContacts => {
                        userContacts = decryptedContacts || [];
                        contactsStateHash = serverStateHash || '';
                        saveLocalContacts(userContacts, serverStateHash);
                        console.log('✅ Contacts loaded from server:', userContacts.length);
                    }).catch(error => {
                        console.error('❌ Failed to decrypt server contacts blob:', error);
                        // Fall back to local cache
                        userContacts = localData.contacts;
                        contactsStateHash = localData.stateHash;
                    });
                } else {
                    // No server data, use local cache
                    userContacts = localData.contacts;
                    contactsStateHash = localData.stateHash;
                    console.log('📦 Using local contacts (no server data):', userContacts.length);
                }
            } catch (error) {
                console.error('❌ Failed to handle contacts data:', error);
            }
        }

        // ===== CONTACTS UI FUNCTIONS =====

        // Render contacts list
        function renderContactsList(containerId, searchTerm = '') {
            const container = document.getElementById(containerId);
            if (!container) return;

            let filteredContacts = userContacts;
            if (searchTerm) {
                filteredContacts = userContacts.filter(contact =>
                    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            if (filteredContacts.length === 0) {
                container.innerHTML = '<div class="contacts-empty"><p>No contacts found.</p></div>';
                return;
            }

            // Clear container
            container.innerHTML = '';

            // Get template
            const template = document.getElementById('contactItemTemplate');

            filteredContacts.forEach(contact => {
                // Clone template
                const contactElement = template.content.cloneNode(true);
                const contactItem = contactElement.querySelector('.contact-item');

                // Set basic info
                contactItem.setAttribute('data-contact-id', contact.id);
                contactElement.querySelector('.contact-name').textContent = contact.name;
                contactElement.querySelector('.contact-address').textContent = contact.address;

                // Set optional company
                const companyElement = contactElement.querySelector('.contact-company');
                if (contact.company) {
                    companyElement.textContent = contact.company;
                    companyElement.style.display = '';
                } else {
                    companyElement.style.display = 'none';
                }

                // Set optional contact details
                const emailElement = contactElement.querySelector('.contact-email');
                if (contact.email) {
                    emailElement.querySelector('span').textContent = contact.email;
                    emailElement.style.display = '';
                } else {
                    emailElement.style.display = 'none';
                }

                const phoneElement = contactElement.querySelector('.contact-phone');
                if (contact.phone) {
                    phoneElement.querySelector('span').textContent = contact.phone;
                    phoneElement.style.display = '';
                } else {
                    phoneElement.style.display = 'none';
                }

                const twitterElement = contactElement.querySelector('.contact-twitter');
                if (contact.twitter) {
                    twitterElement.querySelector('span').textContent = contact.twitter;
                    twitterElement.style.display = '';
                } else {
                    twitterElement.style.display = 'none';
                }

                const linkedinElement = contactElement.querySelector('.contact-linkedin');
                if (contact.linkedin) {
                    linkedinElement.querySelector('a').href = contact.linkedin;
                    linkedinElement.style.display = '';
                } else {
                    linkedinElement.style.display = 'none';
                }

                const websiteElement = contactElement.querySelector('.contact-website');
                if (contact.website) {
                    websiteElement.querySelector('a').href = contact.website;
                    websiteElement.style.display = '';
                } else {
                    websiteElement.style.display = 'none';
                }

                // Set notes
                const notesElement = contactElement.querySelector('.contact-notes');
                if (contact.notes) {
                    notesElement.textContent = contact.notes;
                    notesElement.style.display = '';
                } else {
                    notesElement.style.display = 'none';
                }

                // Set tags
                const tagsContainer = contactElement.querySelector('.contact-tags');
                if (contact.tags.length > 0) {
                    tagsContainer.innerHTML = contact.tags.map(tag => `<span class="contact-tag">${tag}</span>`).join('');
                    tagsContainer.style.display = '';
                } else {
                    tagsContainer.style.display = 'none';
                }

                // Set up button event listeners
                const chatBtn = contactElement.querySelector('.contact-chat-btn');
                chatBtn.addEventListener('click', () => selectContactForChat(contact.address, contact.name));

                const editBtn = contactElement.querySelector('.contact-edit-btn');
                editBtn.addEventListener('click', () => {
                    // TODO: Implement edit functionality
                    console.log('Edit contact:', contact.id);
                });

                const moreBtn = contactElement.querySelector('.contact-more-btn');
                moreBtn.addEventListener('click', () => {
                    // TODO: Implement more actions
                    console.log('More actions for contact:', contact.id);
                });

                // Append to container
                container.appendChild(contactElement);
            });
        }

        // Render contact picker list
        function renderContactPickerList(searchTerm = '') {
            const container = document.getElementById('contactSelectorList');
            if (!container) return;

            let filteredContacts = userContacts;
            if (searchTerm) {
                filteredContacts = userContacts.filter(contact =>
                    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.address.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            if (filteredContacts.length === 0) {
                container.innerHTML = '<div class="contacts-empty"><p>No contacts available. Add contacts first to use this feature.</p></div>';
                return;
            }

            const contactsHTML = filteredContacts.map(contact => `
                <div class="contact-item" onclick="selectContactForChat('${contact.address}', '${contact.name}')">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-address">${contact.address}</div>
                </div>
            `).join('');

            container.innerHTML = contactsHTML;
        }

        // Select contact for chat creation
        function selectContactForChat(address, name) {
            const recipientInput = document.getElementById('recipientAddress');
            if (recipientInput) {
                recipientInput.value = address;
                closeContactPickerModal();
                console.log('✅ Selected contact for chat:', name);
            }
        }

        // Modal controls
        function openContactsModal() {
            const modal = document.getElementById('contactsModal');
            if (modal) {
                modal.classList.add('open');
                renderContactsList('contactsList');
                console.log('📱 Contacts modal opened');
            }
        }

        function closeContactsModal() {
            const modal = document.getElementById('contactsModal');
            if (modal) {
                modal.classList.remove('open');
                console.log('📱 Contacts modal closed');
            }
        }

        function openAddContactModal() {
            const modal = document.getElementById('addContactModal');
            if (modal) {
                modal.classList.add('open');
                document.getElementById('addContactForm').reset();
                console.log('📱 Add contact modal opened');
            }
        }

        function closeAddContactModal() {
            const modal = document.getElementById('addContactModal');
            if (modal) {
                modal.classList.remove('open');
                console.log('📱 Add contact modal closed');
            }
        }

        function openContactPickerModal() {
            const modal = document.getElementById('contactSelectorModal');
            if (modal) {
                modal.classList.add('open');
                renderContactPickerList();
                console.log('📱 Contact picker modal opened');
            }
        }

        function closeContactPickerModal() {
            const modal = document.getElementById('contactSelectorModal');
            if (modal) {
                modal.classList.remove('open');
                console.log('📱 Contact picker modal closed');
            }
        }

        // ===== END CONTACTS MANAGEMENT =====

        // Master Process Login - Get user's dedicated process (with results API)
        async function loginToMasterProcess() {
            // Prevent concurrent login requests
            if (isLoggingIn) {
                console.log('⏳ Login already in progress, skipping...');
                return { status: 'login_in_progress', message: 'Login already in progress' };
            }
            
            try {
                isLoggingIn = true;
                console.log('🔐 Logging into HyperGram master process...');
                console.log('📦 HyperGram Build Version:', BUILD_VERSION);
                setStatus('walletStatus', 'Connecting to HyperGram...');
                
                const loginMessageId = await message({
                    process: MASTER_PROCESS_ID,
                    tags: [
                        { name: 'Action', value: 'Login' }
                    ],
                    signer: createDataItemSigner(wallet),
                    data: ''
                });
                
                console.log('📤 Login message sent:', loginMessageId);
                
                // First, check the direct response from Login handler
                const { Messages: loginMessages } = await result({
                    message: loginMessageId,
                    process: MASTER_PROCESS_ID
                });
                
                if (loginMessages && loginMessages.length > 0) {
                    const loginResponse = JSON.parse(loginMessages[0].Data);
                    console.log('📥 Login response:', loginResponse);
                    
                    if (loginResponse.status === 'spawning_in_progress') {
                        console.log('⏳ Spawn already in progress, waiting...');
                        setStatus('walletStatus', `Process creation in progress... (${loginResponse.timeElapsed || 0}s elapsed)`);
                        // Continue to polling logic below
                    } else if (loginResponse.status === 'existing_user' && loginResponse.ownedProcesses) {
                        // Handle existing user immediately
                        allUserProcesses.owned = loginResponse.ownedProcesses || [];
                        allUserProcesses.recipient = loginResponse.recipientProcesses || [];
                        userProcessId = loginResponse.ownedProcesses[0];
                        window.userProcessId = userProcessId;
                        window.allUserProcesses = allUserProcesses;
                        
                        console.log('👤 Existing user logged in immediately');
                        setStatus('walletStatus', 'Welcome back! Process: ' + userProcessId.slice(0,8) + '...');
                        
                        return {
                            status: 'existing_user',
                            processId: userProcessId,
                            message: 'Welcome back to HyperGram!'
                        };
                    } else if (loginResponse.status === 'new_process' && loginResponse.ownedProcesses) {
                        // Handle new process creation completion
                        allUserProcesses.owned = loginResponse.ownedProcesses || [];
                        allUserProcesses.recipient = loginResponse.recipientProcesses || [];
                        userProcessId = loginResponse.ownedProcesses[0];
                        window.userProcessId = userProcessId;
                        window.allUserProcesses = allUserProcesses;
                        
                        console.log('✅ New user process created immediately');
                        setStatus('walletStatus', 'Ready! Process: ' + userProcessId.slice(0,8) + '...');
                        
                        return {
                            status: 'ready',
                            processId: userProcessId,
                            message: 'Process is ready for messaging'
                        };
                    }
                }
                
                // If we reach here, we need to poll for ProcessReady confirmation
                console.log('🔍 Polling for ProcessReady confirmation...');
                setStatus('walletStatus', 'Waiting for process to be ready...');
                
                const maxAttempts = 30;
                const maxConsecutiveFailures = 15;
                let processReadyMessage = null;
                let consecutiveFailures = 0;
                
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    console.log(`⏳ ProcessReady polling attempt ${attempt}/${maxAttempts}`);
                    setStatus('walletStatus', `Creating process... (${attempt}/${maxAttempts})`);
                    
                    try {
                        const resultsOut = await results({
                            process: MASTER_PROCESS_ID,
                            sort: "DESC",
                            limit: 10
                        });
                        
                        // Reset failure counter on successful poll
                        consecutiveFailures = 0;
                        
                        // Look for login response message in Messages array
                        processReadyMessage = resultsOut.edges?.find(edge => {
                            // Check if this edge has Messages array
                            if (edge.node.Messages && edge.node.Messages.length > 0) {
                                // Look for the login response message targeted to our user
                                return edge.node.Messages.some(message => {
                                    // Ensure message is targeted to our user
                                    if (message.Target !== userAddress) {
                                        return false;
                                    }
                                    
                                    // Check if it's the login response with new_process status
                                    if (message.Data) {
                                        try {
                                            const data = JSON.parse(message.Data);
                                            return data.status === 'new_process' && 
                                                   data.ownedProcesses && 
                                                   data.ownedProcesses.length > 0;
                                        } catch (e) {
                                            return false;
                                        }
                                    }
                                    return false;
                                });
                            }
                            return false;
                        });
                        
                        if (processReadyMessage) {
                            console.log(`✅ Found login response message on attempt ${attempt}:`, processReadyMessage);
                            
                            // Extract process ID from the login response
                            const loginMessage = processReadyMessage.node.Messages.find(message => {
                                if (message.Target === userAddress && message.Data) {
                                    try {
                                        const data = JSON.parse(message.Data);
                                        return data.status === 'new_process' && data.ownedProcesses;
                                    } catch (e) {
                                        return false;
                                    }
                                }
                                return false;
                            });
                            
                            if (loginMessage) {
                                const loginData = JSON.parse(loginMessage.Data);
                                const childProcessId = loginData.ownedProcesses[0];
                                console.log('🎯 Process ID extracted from login response:', childProcessId);
                                
                                // Store the process information
                                allUserProcesses.owned = loginData.ownedProcesses || [];
                                allUserProcesses.recipient = loginData.recipientProcesses || [];
                                break;
                            }
                        }
                        
                    } catch (pollError) {
                        consecutiveFailures++;
                        console.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
                        
                        // Only give up if we have too many consecutive failures
                        if (consecutiveFailures >= maxConsecutiveFailures) {
                            console.error(`❌ ${consecutiveFailures} consecutive poll failures, giving up`);
                            throw new Error(`Failed to poll for process creation after ${consecutiveFailures} consecutive failures`);
                        }
                    }
                    
                    // Wait before next attempt (except on last attempt)
                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 3500));
                    }
                }
                
                if (processReadyMessage) {
                    if (allUserProcesses.owned.length > 0) {
                    console.log('✅ Found login response message for our user:', processReadyMessage);
                    
                    // Use the extracted process information
                    userProcessId = allUserProcesses.owned[0];
                    window.userProcessId = userProcessId;
                    window.allUserProcesses = allUserProcesses;
                    
                    console.log('✅ Process ready confirmation received:');
                    console.log('   • Owned processes:', allUserProcesses.owned);
                    console.log('   • Recipient processes:', allUserProcesses.recipient);
                    console.log('   • Primary process ID:', userProcessId);
                    setStatus('walletStatus', 'Ready! Process: ' + userProcessId.slice(0,8) + '...');
                    
                    return {
                        status: 'ready',
                        processId: userProcessId,
                        message: 'Process is ready for messaging'
                    };
                } else {
                    console.error('❌ Could not extract process ID from login response message');
                    throw new Error('Could not get process ID from master');
                }
            } else {
                // If no process ready message found, check if we're an existing user by trying to get our process
                console.log('🔍 No ProcessReady found, checking if existing user...');
                
                const processLookupId = await message({
                    process: MASTER_PROCESS_ID,
                    tags: [
                        { name: 'Action', value: 'GetUserProcess' }
                    ],
                    signer: createDataItemSigner(wallet),
                    data: ''
                });
                
                const { Messages: lookupMessages } = await result({
                    message: processLookupId,
                    process: MASTER_PROCESS_ID
                });
                
                if (lookupMessages && lookupMessages.length > 0) {
                    const processInfo = JSON.parse(lookupMessages[0].Data);
                    
                    if (processInfo.status === 'success' && processInfo.ownedProcesses && processInfo.ownedProcesses.length > 0) {
                        // Store all processes for existing user too
                        allUserProcesses.owned = processInfo.ownedProcesses || [];
                        allUserProcesses.recipient = processInfo.recipientProcesses || [];
                        
                        userProcessId = processInfo.ownedProcesses[0];  // Use first owned process as primary
                        window.userProcessId = userProcessId;
                        window.allUserProcesses = allUserProcesses;
                        
                        console.log('👤 Existing user processes found:');
                        console.log('   • Owned:', allUserProcesses.owned);
                        console.log('   • Recipient:', allUserProcesses.recipient);
                        console.log('   • Primary process ID:', userProcessId);
                        setStatus('walletStatus', 'Welcome back! Process: ' + userProcessId.slice(0,8) + '...');
                        
                        return {
                            status: 'existing_user',
                            processId: userProcessId,
                            message: 'Welcome back to HyperGram!'
                        };
                    }
                }
                
                throw new Error('Process spawn may still be in progress. Please try again in a moment.');
            }
            
        } catch (error) {
            console.error('❌ Master login failed:', error);
            setStatus('walletStatus', 'Login failed: ' + error.message);
            throw error;
        } finally {
            // Always cleanup login state
            isLoggingIn = false;
        }
        }
        
        // Helper function to get chat registry data using Info handler (now from user's process)
        // New function to get chats from ALL processes
        async function getAllChatsFromAllProcesses() {
            try {
                if (!allUserProcesses || (allUserProcesses.owned.length === 0 && allUserProcesses.recipient.length === 0)) {
                    console.error('❌ No processes available');
                    return '{}';
                }
                
                const allChats = {};
                const allProcessIds = [...allUserProcesses.owned, ...allUserProcesses.recipient];
                
                console.log('🔍 Querying chats from', allProcessIds.length, 'processes in parallel:', allProcessIds);
                
                // Create promises for all process queries to run in parallel
                const processPromises = allProcessIds.map(async (processId) => {
                    console.log('📡 Querying process:', processId);
                    
                    const result = await dryrun({
                        process: processId,
                        data: '',
                        tags: [
                            { name: 'Action', value: 'Info' }
                        ]
                    });
                    
                    if (result && result.Messages && result.Messages.length > 0) {
                        const responseMessage = result.Messages[0];
                        const dataTag = responseMessage.Tags?.find(tag => tag.name === 'Data');
                        const chatsData = dataTag?.value || responseMessage.Data;
                        
                        if (chatsData && chatsData !== '{}' && chatsData !== 'null') {
                            const processChats = JSON.parse(chatsData);
                            
                            // Add process source info to each chat (skip metadata fields)
                            Object.keys(processChats).forEach(chatId => {
                                // Skip metadata fields - only add sourceProcessId to actual chat objects
                                if (chatId.startsWith('_contacts') || chatId === '_contactsData' || chatId === '_contactsStateHash' ||
                                    chatId === '_BUILD_VERSION' || chatId === '_MASTER_VERSION' ||
                                    chatId === '_USER_PROCESS_VERSION' || chatId === '_FRONTEND_VERSION') {
                                    return; // Skip metadata fields
                                }
                                processChats[chatId].sourceProcessId = processId;
                            });
                            
                            console.log('✅ Found', Object.keys(processChats).length, 'chats in process:', processId);
                            return { processId, chats: processChats };
                        }
                    }
                    
                    return { processId, chats: {} };
                });
                
                // Execute all queries in parallel and handle both successes and failures
                const results = await Promise.allSettled(processPromises);
                
                // Process results from all processes
                let successCount = 0;
                let errorCount = 0;
                
                results.forEach((result, index) => {
                    const processId = allProcessIds[index];
                    
                    if (result.status === 'fulfilled') {
                        const { chats } = result.value;
                        // Merge chats from this process (skip contacts data)
                        Object.keys(chats).forEach(chatId => {
                            // Skip contacts data fields - only merge actual chat objects
                            if (chatId.startsWith('_contacts') || chatId === '_contactsData' || chatId === '_contactsStateHash') {
                                return; // Skip contacts fields
                            }
                            allChats[chatId] = chats[chatId];
                        });
                        successCount++;
                    } else {
                        console.warn('⚠️ Failed to query process', processId, ':', result.reason);
                        errorCount++;
                    }
                });
                
                console.log(`📊 Parallel loading complete: ${successCount} successful, ${errorCount} failed`);
                console.log('📊 Total chats loaded from all processes:', Object.keys(allChats).length);
                return JSON.stringify(allChats);
                
            } catch (error) {
                console.error('❌ Failed to get chats from all processes:', error);
                return '{}';
            }
        }
        
        async function getChatsRegistryData() {
            try {
                if (!userProcessId) {
                    console.error('❌ No user process ID available');
                    return '{}';
                }
                
                const result = await dryrun({
                    process: userProcessId,
                    data: '',
                    tags: [
                        { name: 'Action', value: 'Info' }
                    ]
                });
                
                // The Info handler should return the chat registry JSON in the response
                if (result && result.Messages && result.Messages.length > 0) {
                    const responseMessage = result.Messages[0];
                    
                    // Look for data in Tags with name "Data" or use Data field
                    const dataTag = responseMessage.Tags?.find(tag => tag.name === 'Data');
                    return dataTag?.value || responseMessage.Data || '{}';
                }
                return '{}';
            } catch (error) {
                console.error('Failed to fetch chat registry data:', error);
                return '{}';
            }
        }
        
        
        // Wallet Selection System
        document.getElementById('connectWallet').addEventListener('click', () => {
            // Debug: Log available wallet objects
            console.log('Available wallet objects:', {
                'window.arweaveWallet': !!window.arweaveWallet,
                'WanderConnect (ES module)': !!WanderConnect
            });
            showWalletSelectionModal();
        });
        
        function showWalletSelectionModal() {
            const modal = document.createElement('div');
            modal.className = 'wallet-selection-modal';
            modal.id = 'walletSelectionModal';
            
            // Detect available wallets
            const hasWanderExtension = !!window.arweaveWallet; // Wander browser extension
            
            // Wander Connect is available via ES module import
            const hasWanderConnectSDK = !!WanderConnect;
            
            modal.innerHTML = `
                <div class="wallet-selection-content">
                    <div class="wallet-selection-header">
                        <h2 class="wallet-selection-title">Choose Your Wallet</h2>
                        <p class="wallet-selection-subtitle">Select your preferred Wander wallet to connect</p>
                    </div>
                    
                    <div class="wallet-options">
                        <div class="wallet-option ${hasWanderConnectSDK ? '' : 'disabled'}" data-wallet="wander-connect">
                            <div class="wallet-icon">🔗</div>
                            <div class="wallet-info">
                                <h3 class="wallet-name">Wander Connect</h3>
                                <p class="wallet-description">Sign in with Google, Discord, or GitHub - no extension needed</p>
                                ${hasWanderConnectSDK ? 
                                    '<span class="wallet-status available">Available</span>' : 
                                    '<span class="wallet-status unavailable">SDK Loading...</span>'
                                }
                            </div>
                        </div>
                        
                        <div class="wallet-option ${hasWanderExtension ? '' : 'disabled'}" data-wallet="wander-extension">
                            <div class="wallet-icon">🌍</div>
                            <div class="wallet-info">
                                <h3 class="wallet-name">Wander Extension</h3>
                                <p class="wallet-description">Connect with your installed Wander browser extension</p>
                                ${hasWanderExtension ? 
                                    '<span class="wallet-status available">Available</span>' : 
                                    '<a href="https://wander.app" target="_blank" class="wallet-install-link">Install Wander Extension</a>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add click handlers
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeWalletSelectionModal();
                }
            });
            
            const walletOptions = modal.querySelectorAll('.wallet-option:not(.disabled)');
            walletOptions.forEach(option => {
                option.addEventListener('click', async () => {
                    const selectedWallet = option.getAttribute('data-wallet');
                    closeWalletSelectionModal();
                    await connectWallet(selectedWallet);
                });
            });
            
            document.body.appendChild(modal);
        }
        
        function closeWalletSelectionModal() {
            const modal = document.getElementById('walletSelectionModal');
            if (modal) {
                modal.remove();
            }
        }
        
        
        
        async function connectWallet(type) {
            try {
                setStatus('walletStatus', 'Connecting...');
                walletType = type;
                
                if (type === 'wander-connect') {
                    // Connect using Wander Connect (social auth)
                    if (typeof WanderConnect !== 'function') {
                        setStatus('walletStatus', 'Wander Connect SDK not available. Please ensure it\'s properly imported.');
                        console.error('Wander Connect SDK not found. Import failed.');
                        return;
                    }
                    
                    try {
                        // Initialize Wander Connect (singleton pattern)
                        if (!wanderConnect) {
                            wanderConnect = new WanderConnect({ clientId: "FREE_TRIAL" });
                        }
                        
                        // Open Wander Connect UI for authentication
                        setStatus('walletStatus', 'Opening Wander Connect...');
                        await wanderConnect.open();
                        
                        // Wait for arweaveWalletLoaded event
                        setStatus('walletStatus', 'Waiting for wallet connection...');
                        
                        // Set up one-time event listener for this connection attempt
                        const handleWalletLoaded = async (e) => {
                            try {
                                const { permissions = [] } = e.detail || {};
                                
                                if (permissions.length === 0) {
                                    // Connect wallet and request permissions
                                    await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ENCRYPT', 'DECRYPT', 'ACCESS_PUBLIC_KEY']);
                                }
                                
                                // Get user address
                                userAddress = await window.arweaveWallet.getActiveAddress();
                                wallet = window.arweaveWallet;
                                walletType = 'wander-connect';
                                
                                // Clean up event listener
                                window.removeEventListener('arweaveWalletLoaded', handleWalletLoaded);
                                
                                // Continue with connection flow
                                if (userAddress) {
                                    localStorage.setItem('walletType', walletType);
                                    setStatus('walletStatus', `Connected as ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
                                    closeWalletSelectionModal();

                                    // Setup wallet for encryption
                                    await setupCurrentWallet();

                                    // Login to master process to get user's dedicated process
                                    try {
                                        await loginToMasterProcess();
                                        
                                        // Initialize user session
                                        showMainInterface();
                                        
                                        // Load and display user's chats after showing the interface
                                        await loadUserChats();
                                        
                                    } catch (loginError) {
                                        console.error('❌ Master process login failed:', loginError);
                                        setStatus('walletStatus', 'Failed to connect to HyperGram: ' + loginError.message);
                                        return;
                                    }
                                }
                                
                            } catch (error) {
                                console.error('Wander Connect wallet loading error:', error);
                                setStatus('walletStatus', 'Wander Connect authentication failed: ' + error.message);
                                window.removeEventListener('arweaveWalletLoaded', handleWalletLoaded);
                            }
                        };
                        
                        window.addEventListener('arweaveWalletLoaded', handleWalletLoaded);
                        
                        // If wallet is already loaded, trigger immediately
                        if (window.arweaveWallet) {
                            handleWalletLoaded({ detail: {} });
                        }
                        
                        return; // Exit here as the event listener handles the rest
                        
                    } catch (connectError) {
                        console.error('Wander Connect error:', connectError);
                        setStatus('walletStatus', 'Wander Connect initialization failed: ' + connectError.message);
                        return;
                    }
                    
                } else if (type === 'wander-extension') {
                    // Connect using Wander Extension
                    if (!window.arweaveWallet) {
                        setStatus('walletStatus', 'Wander Extension not available');
                        return;
                    }
                    
                    await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ENCRYPT', 'DECRYPT', 'ACCESS_PUBLIC_KEY']);
                    userAddress = await window.arweaveWallet.getActiveAddress();
                    wallet = window.arweaveWallet;
                }
                
                if (userAddress) {
                    // Store wallet type preference
                    localStorage.setItem('selectedWalletType', type);

                    // Setup wallet for encryption
                    await setupCurrentWallet();

                    // Login to master process to get user's dedicated process
                    try {
                        await loginToMasterProcess();
                        
                        // Initialize user session
                        showMainInterface();
                        
                        // Load and display user's chats after showing the interface
                        await loadUserChats();
                        
                    } catch (loginError) {
                        console.error('❌ Master process login failed:', loginError);
                        setStatus('walletStatus', 'Failed to connect to HyperGram: ' + loginError.message);
                        return;
                    }
                } else {
                    setStatus('walletStatus', 'Failed to get wallet address');
                }
            } catch (error) {
                console.error('Wallet connection failed:', error);
                setStatus('walletStatus', 'Connection failed: ' + error.message);
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
                    const publicKeyData = data.data.transactions.edges[0]?.node.owner.key;
                    
                    if (!publicKeyData) {
                        throw new Error(`No public key found for address: ${address}`);
                    }
                    
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
                // Show user-friendly status during decryption with high z-index overlay
                showWalletApprovalOverlay('Please approve in wallet to decrypt messages...');
                
                try {
                    // Determine which encrypted AES key to use
                    const encryptedAESKey = userAddress === encryptedPackage.senderAddress 
                        ? encryptedPackage.aesKeyForSender 
                        : encryptedPackage.aesKeyForRecipient;

                    // Convert base64 to Uint8Array for wallet decryption
                    const encryptedAESKeyArray = this.base64ToUint8Array(encryptedAESKey);

                    // Use window.arweaveWallet for both wallet types (WanderConnect injects this interface)
                    let decryptedAESKeyArray;
                    if (walletType === 'wander-connect' || walletType === 'wander-extension') {
                        // Both Wander types use window.arweaveWallet interface
                        decryptedAESKeyArray = await window.arweaveWallet.decrypt(encryptedAESKeyArray, {
                            name: 'RSA-OAEP',
                            hash: 'SHA-256'
                        });
                    } else {
                        // Fallback for other wallet types
                        decryptedAESKeyArray = await window.arweaveWallet.decrypt(encryptedAESKeyArray, {
                            name: 'RSA-OAEP',
                            hash: 'SHA-256'
                        });
                    }

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
                    // Reset status on success
                    hideWalletApprovalOverlay();
                    showWalletApprovalOverlay('Messages decrypted successfully', '#4caf50');
                    setTimeout(() => hideWalletApprovalOverlay(), 2000);
                    
                    return JSON.parse(decryptedMessagesJSON);
                } catch (error) {
                    console.error('Chat decryption failed:', error);
                    // Reset status on error
                    hideWalletApprovalOverlay();
                    showWalletApprovalOverlay('Decryption failed', '#f44336');
                    setTimeout(() => hideWalletApprovalOverlay(), 3000);
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

            base64ToUint8Array(base64) {
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return bytes;
            }

            base64ToArrayBuffer(base64) {
                return this.base64ToUint8Array(base64).buffer;
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
        
        // Auto-reconnect on page load if user was previously connected
        window.addEventListener('load', async () => {
            // Initialize theme system first
            themeManager.initialize();

            // Initialize toast system
            toastManager.initialize();

            // Clear any stuck send locks from previous sessions
            clearStuckSendLocks();

            // Load cached public keys first
            await loadAllCachedPublicKeys();
            const savedWalletType = localStorage.getItem('selectedWalletType');
            if (savedWalletType) {
                try {
                    // Try to reconnect with the saved wallet type
                    if (savedWalletType === 'wander-extension' && window.arweaveWallet) {
                        const address = await window.arweaveWallet.getActiveAddress();
                        if (address) {
                            userAddress = address;
                            walletType = savedWalletType;
                            wallet = window.arweaveWallet;

                            // Setup wallet for encryption
                            await setupCurrentWallet();

                            // Login to master process on auto-reconnect
                            if (!isLoggingIn) {
                                try {
                                    await loginToMasterProcess();
                                    showMainInterface();
                                    await loadUserChats();
                                } catch (loginError) {
                                    console.log('Auto-reconnect master login failed:', loginError);
                                    // User needs to manually reconnect
                                }
                            } else {
                                console.log('⏳ Login already in progress, skipping auto-reconnect');
                            }
                        }
                    } else if (savedWalletType === 'wander-connect' && WanderConnect) {
                        // Try to reconnect with Wander Connect
                        try {
                            if (!wanderConnect) {
                                wanderConnect = new WanderConnect({ clientId: "FREE_TRIAL" });
                            }
                            
                            // Check if arweaveWallet is already available (user previously connected)
                            if (window.arweaveWallet) {
                                userAddress = await window.arweaveWallet.getActiveAddress();
                                if (userAddress) {
                                    walletType = savedWalletType;
                                    wallet = window.arweaveWallet;

                                    // Setup wallet for encryption
                                    await setupCurrentWallet();

                                    // Login to master process on auto-reconnect
                                    if (!isLoggingIn) {
                                        try {
                                            await loginToMasterProcess();
                                            showMainInterface();
                                            await loadUserChats();
                                        } catch (loginError) {
                                            console.log('Wander Connect auto-reconnect master login failed:', loginError);
                                            // User needs to manually reconnect
                                        }
                                    } else {
                                        console.log('⏳ Login already in progress, skipping Wander Connect auto-reconnect');
                                    }
                                }
                            }
                        } catch (error) {
                            console.log('Wander Connect auto-reconnect failed:', error);
                        }
                    } else if (false) { // Disable this old branch
                        const address = await window.arweaveWallet.getActiveAddress();
                        if (address) {
                            userAddress = address;
                            walletType = savedWalletType;
                            wallet = window.arweaveWallet;
                            showMainInterface();
                            await loadUserChats();
                        }
                    }
                } catch (error) {
                    console.log('Auto-reconnect failed:', error);
                    // User needs to manually reconnect
                }
            }
        });
        
        // Disconnect wallet function
        function disconnectWallet() {
            // Disconnect from the appropriate wallet
            if (walletType === 'wander-connect' && wanderConnect) {
                try {
                    wanderConnect.destroy();
                    wanderConnect = null; // Clear the instance
                } catch (error) {
                    console.log('Error disconnecting Wander Connect:', error);
                }
            }
            
            // Clear stored preferences
            localStorage.removeItem('selectedWalletType');
            
            // Reset variables
            wallet = null;
            userAddress = null;
            walletType = null;
            currentChat = null;
            wanderConnect = null;
            
            // Clear caches
            allChatsCache = {};
            displayMessagesCache = {};
            ownMessagesCache = {};
            
            // Clear displayed chat area
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            // Reset chat title
            const chatTitle = document.getElementById('chatTitle');
            if (chatTitle) {
                chatTitle.textContent = 'Select a chat to start messaging';
            }
            
            // Hide main interface and show login screen
            document.getElementById('sidebar').classList.remove('flex');
            document.getElementById('chatArea').classList.remove('flex');
            document.getElementById('loginScreen').classList.remove('hidden');
            
            // Clear wallet status
            setStatus('walletStatus', '');
        }
        
        // Make disconnectWallet globally accessible for onclick handlers
        window.disconnectWallet = disconnectWallet;
        
        function setStatus(elementId, text) {
            const element = document.getElementById(elementId);
            if (element) element.textContent = text;
        }
        
        // Helper function to get recipient address from chat
        // Get recipient address from already captured state (no extra server calls)
        async function getRecipientAddressFromState(chatState, chatId) {
            try {
                // First try to extract from state if it has messages with participant info
                if (chatState && chatState.messages && chatState.messages.length > 0) {
                    // Look through messages to find a different sender
                    for (const msg of chatState.messages) {
                        if (typeof msg === 'string') {
                            // This is an encrypted message, can't extract sender
                            continue;
                        }
                        if (msg.sender && msg.sender !== userAddress) {
                            return msg.sender;
                        }
                    }
                }
                
                // Fallback to server call if we can't extract from state
                return await getRecipientAddress(chatId);
            } catch (error) {
                console.error('Failed to get recipient from state:', error);
                return await getRecipientAddress(chatId);
            }
        }

        async function getRecipientAddress(chatId) {
            try {
                // Use cached chat data instead of making API call
                const chat = allChatsCache[chatId];
                
                if (chat && chat.participants) {
                    // Parse participants string and find the other user
                    const participants = chat.participants.split(',').map(p => p.trim());
                    const recipient = participants.find(p => p !== userAddress);
                    return recipient;
                }
                
                // Fallback: if not in cache, try display cache
                if (!chat && displayMessagesCache[chatId] && displayMessagesCache[chatId].length > 0) {
                    // Find a message from someone else
                    for (const msg of displayMessagesCache[chatId]) {
                        if (msg.sender && msg.sender !== userAddress) {
                            return msg.sender;
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
            
            // Ensure theme selector is set up when sidebar becomes visible
            themeManager.setupThemeSelector();
            
            // Show user address with wallet type indicator and disconnect button
            const walletTypeLabel = walletType === 'wander-connect' ? 'Wander Connect' : 'Wander Extension';
            const walletIcon = walletType === 'wander-connect' ? '🔗' : '🌍';
            const userAddressElement = document.getElementById('userAddress');
            const walletIconElement = userAddressElement.querySelector('.wallet-icon');
            const walletAddressElement = userAddressElement.querySelector('.wallet-address');
            const disconnectBtn = userAddressElement.querySelector('.disconnect-wallet-btn');

            walletIconElement.textContent = walletIcon;
            walletAddressElement.textContent = `${userAddress.slice(0, 20)}... (${walletTypeLabel})`;
            disconnectBtn.style.display = 'inline';
        }
        
        // Chat state management for async loading
        const chatLoadingState = {
            processStates: new Map(), // processId -> {status: 'loading'|'success'|'error', chats: [], retryCount: 0, lastAttempt: null}
            totalProcesses: 0,
            loadedProcesses: 0,
            isInitialized: false
        };

        // Enhanced state management functions
        function getProcessState(processId) {
            return chatLoadingState.processStates.get(processId) || {
                status: 'loading',
                chats: [],
                retryCount: 0,
                lastAttempt: null
            };
        }

        function updateProcessState(processId, updates) {
            const currentState = getProcessState(processId);
            const newState = {
                ...currentState,
                ...updates,
                lastAttempt: Date.now()
            };
            chatLoadingState.processStates.set(processId, newState);
            return newState;
        }

        function getLoadingStats() {
            const states = Array.from(chatLoadingState.processStates.values());
            return {
                total: chatLoadingState.totalProcesses,
                loading: states.filter(s => s.status === 'loading').length,
                success: states.filter(s => s.status === 'success').length,
                error: states.filter(s => s.status === 'error').length,
                totalChats: states.reduce((sum, s) => sum + s.chats.length, 0)
            };
        }

        function resetChatLoadingState() {
            chatLoadingState.processStates.clear();
            chatLoadingState.totalProcesses = 0;
            chatLoadingState.loadedProcesses = 0;
            chatLoadingState.isInitialized = false;
        }

        async function loadUserChats() {
            try {
                if (!allUserProcesses || (allUserProcesses.owned.length === 0 && allUserProcesses.recipient.length === 0)) {
                    console.error('❌ No processes available');
                    document.getElementById('chatsList').innerHTML = '<p class="chat-list-empty">No processes available</p>';
                    return;
                }
                
                // Initialize placeholders immediately
                initializeChatPlaceholders();
                
                // Start async loading for all processes
                await loadChatsAsync();
                
            } catch (error) {
                console.error('Failed to load user chats:', error);
                document.getElementById('chatsList').innerHTML = '<p class="chat-list-empty">Failed to load chats. Click "New Chat" to start messaging!</p>';
            }
        }

        function initializeChatPlaceholders() {
            if (chatLoadingState.isInitialized) {
                console.log('🔄 Chat loading already initialized, resetting...');
                resetChatLoadingState();
            }
            
            const allProcessIds = [...allUserProcesses.owned, ...allUserProcesses.recipient];
            chatLoadingState.totalProcesses = allProcessIds.length;
            chatLoadingState.loadedProcesses = 0;
            chatLoadingState.isInitialized = true;
            
            console.log('🔄 Initializing placeholders for', allProcessIds.length, 'processes');
            
            // Create placeholder HTML
            const placeholders = allProcessIds.map(processId => {
                updateProcessState(processId, {
                    status: 'loading',
                    chats: [],
                    retryCount: 0
                });
                
                return createChatPlaceholder(processId);
            }).join('');
            
            const chatsList = document.getElementById('chatsList');
            chatsList.innerHTML = `
                <div class="chat-loading-header">
                    <div class="chat-loading-progress">Loading chat... (0/${allProcessIds.length})</div>
                </div>
                ${placeholders}
            `;
            
            // Log initial state
            console.log('📊 Initial loading state:', getLoadingStats());
        }

        function createChatPlaceholder(processId, status = 'loading', errorMessage = null) {
            const state = getProcessState(processId);
            const shortId = processId.slice(0, 8) + '...';
            
            switch (status) {
                case 'loading':
                    return `
                        <div class="chat-item loading" data-process-id="${processId}">
                            <div class="chat-item-container">
                                <div class="chat-item-spinner"></div>
                                <div class="chat-item-content">
                                    <div class="chat-item-name">Loading chat...</div>
                                    <div class="chat-item-process-id">Process: ${shortId}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                case 'error':
                    return `
                        <div class="chat-item error" data-process-id="${processId}">
                            <div class="chat-item-container">
                                <span class="chat-item-error-icon">⚠️</span>
                                <div class="chat-item-content">
                                    <div class="chat-item-name">Failed to load</div>
                                    <div class="chat-item-process-id">Process: ${shortId}</div>
                                    <div class="chat-item-status">${errorMessage || 'Connection failed'}</div>
                                    <button class="chat-item-retry-btn" onclick="retrySingleProcess('${processId}')">
                                        Retry${state?.retryCount > 0 ? ` (attempt ${state.retryCount + 1})` : ''}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                default:
                    return '';
            }
        }

        async function loadChatsAsync() {
            const allProcessIds = [...allUserProcesses.owned, ...allUserProcesses.recipient];
            
            console.log('🚀 Starting truly async chat loading for', allProcessIds.length, 'processes');
            
            // Fire off individual async operations that update UI immediately when each completes
            allProcessIds.forEach(processId => {
                loadSingleProcessChats(processId)
                    .then(result => {
                        // Each process updates UI as soon as it completes
                        console.log(`✅ Process ${processId} completed, updating UI immediately`);
                        onProcessSuccess(processId, result);
                    })
                    .catch(error => {
                        console.log(`❌ Process ${processId} failed, updating UI immediately`);
                        onProcessError(processId, error.message);
                    });
            });
            
            console.log('🎯 All process requests launched - chats will appear as they load');
        }

        async function loadSingleProcessChats(processId) {
            console.log('📡 Loading chats from process:', processId);
            
            const result = await dryrun({
                process: processId,
                data: '',
                tags: [{ name: 'Action', value: 'Info' }]
            });
            
            if (result && result.Messages && result.Messages.length > 0) {
                const responseMessage = result.Messages[0];
                const dataTag = responseMessage.Tags?.find(tag => tag.name === 'Data');
                const chatsData = dataTag?.value || responseMessage.Data;
                
                if (chatsData && chatsData !== '{}' && chatsData !== 'null') {
                    const processResponse = JSON.parse(chatsData);

                    // Handle contacts data if present (only from user's own process)
                    if (processId === userProcessId && processResponse._contactsData !== undefined) {
                        handleContactsData(processResponse._contactsData, processResponse._contactsStateHash);
                    }

                    // Create clean chats object by removing contacts fields and version fields
                    const processChats = { ...processResponse };
                    delete processChats._contactsData;
                    delete processChats._contactsStateHash;
                    delete processChats._BUILD_VERSION;
                    delete processChats._MASTER_VERSION;
                    delete processChats._USER_PROCESS_VERSION;
                    delete processChats._FRONTEND_VERSION;

                    // Add process source info and filter for user membership
                    const userChats = [];
                    const originalChats = [];

                    Object.keys(processChats).forEach(chatId => {
                        const chat = processChats[chatId];
                        chat.sourceProcessId = processId;
                        
                        // Check if user is a member
                        let isUserMember = false;
                        if (chat.members && Array.isArray(chat.members)) {
                            isUserMember = chat.members.some(member => member.address === userAddress);
                        } else if (chat.participants && chat.participants.includes(userAddress)) {
                            isUserMember = true;
                        }
                        
                        if (isUserMember) {
                            // Store original chat data for cache
                            originalChats.push({
                                chatId: chatId,
                                chat: chat
                            });
                            
                            // Generate chat name
                            let chatName = 'Unknown Chat';
                            if (chat.nickname && chat.nickname.trim()) {
                                chatName = chat.nickname;
                            } else if (chat.participants) {
                                const participants = chat.participants.split(',').map(p => p.trim());
                                const otherParticipants = participants.filter(p => p !== userAddress);
                                chatName = otherParticipants.length > 0 ? 
                                    `Chat with ${otherParticipants[0].substring(0, 8)}...` : 
                                    'Unknown Chat';
                            }
                            
                            // Calculate total message count
                            const totalMessageCount = (chat.user1_messageCount || 0) + (chat.user2_messageCount || 0);
                            
                            // Create simplified display object
                            userChats.push({
                                id: chatId,
                                name: chatName,
                                lastMessage: totalMessageCount > 0 ? `${totalMessageCount} message${totalMessageCount !== 1 ? 's' : ''}` : 'No messages yet',
                                processId: chat.process_id,
                                sourceProcessId: processId,
                                members: chat.members || [],
                                chatType: chat.chat_type || 'direct',
                                messageCount: totalMessageCount
                            });
                        }
                    });
                    
                    return { status: 'success', chats: userChats, originalChats: originalChats };
                }
            }
            
            return { status: 'success', chats: [] };
        }

        function onProcessSuccess(processId, result) {
            console.log('✅ Process', processId, 'loaded', result.chats.length, 'chats');
            
            // Update state using enhanced state management
            updateProcessState(processId, {
                status: 'success',
                chats: result.chats,
                retryCount: 0
            });
            
            chatLoadingState.loadedProcesses++;
            
            // Update cache with the ORIGINAL chat data, not the simplified display objects
            if (result.originalChats) {
                result.originalChats.forEach(originalChat => {
                    allChatsCache[originalChat.chatId] = {
                        ...originalChat.chat,
                        sourceProcessId: processId
                    };
                });
            }
            
            // Replace placeholder with actual chat items or remove if no chats
            updateProcessInDOM(processId, result.chats);
            updateLoadingProgress();
            
            // Log updated stats
            const stats = getLoadingStats();
            console.log('📊 Loading progress:', `${stats.success}/${stats.total} successful, ${stats.totalChats} total chats`);
        }

        function onProcessError(processId, error) {
            console.warn('⚠️ Process', processId, 'failed:', error);
            
            // Update state using enhanced state management
            const currentState = getProcessState(processId);
            updateProcessState(processId, {
                status: 'error',
                chats: [],
                retryCount: currentState.retryCount
            });
            
            chatLoadingState.loadedProcesses++;
            
            // Replace placeholder with error state
            const placeholder = document.querySelector(`[data-process-id="${processId}"]`);
            if (placeholder) {
                placeholder.outerHTML = createChatPlaceholder(processId, 'error', error);
            }
            
            updateLoadingProgress();
            
            // Log updated stats
            const stats = getLoadingStats();
            console.log('📊 Loading progress:', `${stats.success}/${stats.total} successful, ${stats.error} failed`);
        }

        function updateProcessInDOM(processId, chats) {
            const placeholder = document.querySelector(`[data-process-id="${processId}"]`);
            if (!placeholder) return;
            
            if (chats.length === 0) {
                // Remove placeholder if no chats found
                placeholder.remove();
            } else {
                // Replace placeholder with actual chat items
                const chatHTML = chats.map(chat => `
                    <div class="chat-item" data-chat-id="${chat.id}">
                        <div class="chat-item-container">
                            <div class="chat-item-avatar">
                                ${chat.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="chat-item-content">
                                <div class="chat-item-name">
                                    ${chat.name}
                                </div>
                                <div class="chat-item-preview">
                                    ${chat.lastMessage}
                                </div>
                                <div class="chat-item-meta">
                                    <span class="chat-item-badge">
                                        ${chat.chatType || 'direct'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                placeholder.outerHTML = chatHTML;
                
                // Re-attach event listeners to new chat items
                attachChatEventListeners();
                
                // Update unread counts after rendering chat items
                updateAllChatUnreadCounts();
            }
        }

        function updateLoadingProgress() {
            const progressElement = document.querySelector('.chat-loading-progress');
            if (progressElement) {
                const stats = getLoadingStats();
                const loaded = chatLoadingState.loadedProcesses;
                const total = chatLoadingState.totalProcesses;
                
                if (loaded >= total) {
                    // All done, remove progress header
                    const header = document.querySelector('.chat-loading-header');
                    if (header) header.remove();
                    
                    // Check if we have any chats at all
                    const hasChats = document.querySelectorAll('.chat-item:not(.loading):not(.error)').length > 0;
                    if (!hasChats) {
                        const chatsList = document.getElementById('chatsList');
                        const hasErrors = document.querySelectorAll('.chat-item.error').length > 0;
                        if (hasErrors) {
                            chatsList.insertAdjacentHTML('beforeend', 
                                `<p class="chat-list-empty">
                                    ${stats.error} of ${stats.total} processes failed to load. Use retry buttons to try again.
                                </p>`
                            );
                        } else {
                            chatsList.insertAdjacentHTML('beforeend', 
                                '<p class="chat-list-empty">No chats yet. Click "New Chat" to start messaging!</p>'
                            );
                        }
                    }
                    
                    console.log('🎉 Async chat loading completed:', stats);
                } else {
                    progressElement.textContent = `Loading chats... (${loaded}/${total})`;
                    if (stats.success > 0) {
                        progressElement.textContent += ` • ${stats.totalChats} chats found`;
                    }
                }
            }
        }

        function attachChatEventListeners() {
            const chatItems = document.querySelectorAll('.chat-item:not(.loading):not(.error)');
            chatItems.forEach(item => {
                // Remove existing listeners by cloning
                const newItem = item.cloneNode(true);
                item.replaceWith(newItem);
                
                // Add click handler
                newItem.addEventListener('click', () => {
                    const chatId = newItem.dataset.chatId;
                    if (chatId) {
                        selectChat(chatId);
                    }
                });
            });
        }

        // Global retry function for failed processes
        window.retrySingleProcess = async function(processId) {
            console.log('🔄 Retrying process:', processId);
            
            const state = getProcessState(processId);
            
            // Update state with incremented retry count
            const newRetryCount = state.retryCount + 1;
            updateProcessState(processId, {
                status: 'loading',
                retryCount: newRetryCount
            });
            
            // Update DOM to show loading state
            const errorElement = document.querySelector(`[data-process-id="${processId}"]`);
            if (errorElement) {
                errorElement.outerHTML = createChatPlaceholder(processId, 'loading');
            }
            
            console.log(`🔄 Retry attempt ${newRetryCount} for process:`, processId);
            
            // Exponential backoff delay
            const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000);
            console.log(`⏱️ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            try {
                const result = await loadSingleProcessChats(processId);
                onProcessSuccess(processId, result);
            } catch (error) {
                onProcessError(processId, error.message);
            }
        };
        
        function renderChatsList(chats) {
            const chatsList = document.getElementById('chatsList');
            
            if (!chatsList) {
                console.error('chatsList element not found!');
                return;
            }
            
            if (!chats || chats.length === 0) {
                chatsList.innerHTML = '<p class="chat-list-empty">No chats available</p>';
                return;
            }
            
            const chatHTML = chats.map(chat => `
                <div class="chat-item" data-chat-id="${chat.id}">
                    <div class="chat-item-container">
                        <div class="chat-item-avatar">
                            ${chat.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="chat-item-content">
                            <div class="chat-item-name">
                                ${chat.name}
                            </div>
                            <div class="chat-item-preview">
                                ${chat.lastMessage}
                            </div>
                            <div class="chat-item-meta">
                                <span class="chat-item-badge">
                                    ${chat.chatType || 'direct'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            chatsList.innerHTML = chatHTML;
            
            
            // Add click handlers and hover effects
            const chatItems = document.querySelectorAll('.chat-item');
            
            chatItems.forEach(item => {
                item.addEventListener('click', () => {
                    selectChat(item.dataset.chatId);
                });
                
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
            
            // Update unread counts after rendering all chat items
            updateAllChatUnreadCounts();
        }
        
        async function selectChat(chatId) {
            currentChat = chatId;
            
            
            markChatAsRead(chatId);
            
            updateAllChatUnreadCounts();
            
            try {
                const chat = allChatsCache[chatId];
                
                if (chat) {
                    let recipientAddress = 'Unknown';
                    if (chat.participants) {
                        const participants = chat.participants.split(',').map(p => p.trim());
                        const recipient = participants.find(p => p !== userAddress);
                        if (recipient) {
                            recipientAddress = recipient;
                        }
                    }
                    
                    const chatName = chat.nickname || 'New Chat';
                    document.getElementById('chatTitle').innerHTML = `
                        <div class="chat-name">${chatName}</div>
                        <div class="chat-address">${recipientAddress.substring(0, 12)}...</div>
                    `;
                } else {
                    setStatus('chatTitle', `Chat ${chatId}`);
                }
            } catch (error) {
                console.error('Failed to get chat details:', error);
                setStatus('chatTitle', `Chat ${chatId}`);
            }
            
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendBtn').disabled = false;
            
            document.getElementById('refreshBtn').style.display = 'block';
            document.getElementById('updateStatus').style.display = 'block';
            document.getElementById('updateStatus').textContent = 'Updated';
            
            startAutoRefresh();
            
            await loadChatMessages(chatId);
        }
        
        
        let autoRefreshTimer = null;
        let autoRefreshCountdown = 20;
        let isWindowFocused = true;
        let isAutoRefreshEnabled = false;

        // Chat-specific send locks to prevent race conditions
        const chatSendingLocks = new Map(); // chatId -> {timestamp: number, timeoutId: number}

        // Chat-specific refresh locks to prevent concurrent refreshes per chat
        const chatRefreshLocks = new Map(); // chatId -> {isRefreshing: boolean, timestamp: number, timeoutId: number}

        // Track reaction state hash per chat to detect changes
        const chatReactionStateHashes = new Map(); // chatId -> lastKnownReactionStateHash

        // Global lock to prevent overlapping process queries
        let isQueryingProcesses = false;

        // Helper functions for chat send locks
        function setChatSending(chatId, isSending) {
            if (isSending) {
                // Clear any existing timeout for this chat
                if (chatSendingLocks.has(chatId)) {
                    clearTimeout(chatSendingLocks.get(chatId).timeoutId);
                }

                // Set up automatic timeout after 30 seconds (safety mechanism)
                const timeoutId = setTimeout(() => {
                    console.warn(`⚠️ Chat ${chatId} send lock timed out after 30 seconds - force clearing`);
                    chatSendingLocks.delete(chatId);
                }, 30000);

                chatSendingLocks.set(chatId, {
                    timestamp: Date.now(),
                    timeoutId: timeoutId
                });
                console.log(`🔒 Chat ${chatId} locked for sending (with 30s timeout)`);
            } else {
                const lockData = chatSendingLocks.get(chatId);
                if (lockData) {
                    clearTimeout(lockData.timeoutId);
                    const duration = Date.now() - lockData.timestamp;
                    console.log(`🔓 Chat ${chatId} unlocked after sending (${duration}ms)`);
                }
                chatSendingLocks.delete(chatId);
            }
        }

        function isChatSending(chatId) {
            return chatSendingLocks.has(chatId);
        }

        // Helper functions for chat refresh locks
        function setChatRefreshing(chatId, isRefreshing) {
            if (isRefreshing) {
                // Clear any existing timeout for this chat
                if (chatRefreshLocks.has(chatId)) {
                    clearTimeout(chatRefreshLocks.get(chatId).timeoutId);
                }

                // Set up automatic timeout after 30 seconds (safety mechanism)
                const timeoutId = setTimeout(() => {
                    console.warn(`⚠️ Chat ${chatId} refresh lock timed out after 30 seconds - force clearing`);
                    chatRefreshLocks.delete(chatId);
                }, 30000);

                chatRefreshLocks.set(chatId, {
                    isRefreshing: true,
                    timestamp: Date.now(),
                    timeoutId: timeoutId
                });
                console.log(`🔒 Chat ${chatId} locked for refreshing (with 30s timeout)`);

                // Update status if this is the current chat
                if (chatId === currentChat) {
                    updateAutoRefreshStatus();
                }
            } else {
                const lockData = chatRefreshLocks.get(chatId);
                if (lockData) {
                    clearTimeout(lockData.timeoutId);
                    const duration = Date.now() - lockData.timestamp;
                    console.log(`🔓 Chat ${chatId} unlocked after refreshing (${duration}ms)`);
                }
                chatRefreshLocks.delete(chatId);

                // Update status if this is the current chat
                if (chatId === currentChat) {
                    updateAutoRefreshStatus();
                }
            }
        }

        function isChatRefreshing(chatId) {
            return chatRefreshLocks.has(chatId) && chatRefreshLocks.get(chatId).isRefreshing;
        }

        // Cleanup function for stuck locks (safety mechanism)
        function clearStuckSendLocks() {
            if (chatSendingLocks.size > 0) {
                console.log(`🧹 Clearing ${chatSendingLocks.size} potentially stuck send locks`);
                // Clear all timeouts first
                for (const lockData of chatSendingLocks.values()) {
                    clearTimeout(lockData.timeoutId);
                }
                chatSendingLocks.clear();
            }
        }

        // Enhanced diagnostic function for debugging
        function logSendLockStatus() {
            if (chatSendingLocks.size > 0) {
                console.log('📊 Active send locks:', Array.from(chatSendingLocks.entries()).map(([chatId, data]) => ({
                    chatId,
                    duration: Date.now() - data.timestamp
                })));
            } else {
                console.log('📊 No active send locks');
            }
        }
        
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            try {
                // Check if current chat is already refreshing
                if (currentChat && isChatRefreshing(currentChat)) {
                    console.log('⏳ Manual refresh skipped - current chat is already refreshing:', currentChat);
                    setStatus('updateStatus', 'Already refreshing...');
                    return;
                }

                setStatus('updateStatus', 'Checking...');
                document.getElementById('refreshBtn').disabled = true;

                try {
                    // Check if already querying processes
                    if (isQueryingProcesses) {
                        console.log('⏳ Manual refresh skipped - processes already being queried');
                        setStatus('updateStatus', 'Already checking...');
                    } else {
                        isQueryingProcesses = true;
                        // Set chat refresh lock for manual refresh to pause timer
                        if (currentChat) {
                            setChatRefreshing(currentChat, true);
                        }
                        try {
                            const chatsRegistryText = await getAllChatsFromAllProcesses();
                            if (chatsRegistryText && chatsRegistryText !== '{}' && chatsRegistryText !== 'null' && chatsRegistryText.trim() !== '') {
                                allChatsCache = JSON.parse(chatsRegistryText);
                                allChatsCacheTimestamp = Date.now();

                                detectAndAddNewChats();

                                updateAllChatUnreadCounts();
                            }
                        } finally {
                            isQueryingProcesses = false;
                            // Clear chat refresh lock for manual refresh
                            if (currentChat) {
                                setChatRefreshing(currentChat, false);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to refresh global cache:', error);
                    isQueryingProcesses = false;
                    // Clear chat refresh lock on manual refresh error
                    if (currentChat) {
                        setChatRefreshing(currentChat, false);
                    }
                }

                if (currentChat) {
                    const chat = allChatsCache[currentChat];
                    if (chat) {
                        setStatus('updateStatus', 'Loading...');
                        await loadChatMessages(currentChat);
                        setStatus('updateStatus', 'Updated');
                    }

                    resetAutoRefreshCountdown();
                } else {
                    setStatus('updateStatus', 'Updated');
                }

            } catch (error) {
                console.error('Refresh failed:', error);
                setStatus('updateStatus', 'Error');

                // Ensure refresh lock is cleared on manual refresh error
                if (currentChat) {
                    setChatRefreshing(currentChat, false);
                }
            } finally {
                document.getElementById('refreshBtn').disabled = false;
            }
        });
        
        document.getElementById('refreshBtn').addEventListener('mouseenter', function() {
            this.style.color = 'var(--primary)';
            this.style.transform = 'scale(1.1)';
        });
        
        document.getElementById('refreshBtn').addEventListener('mouseleave', function() {
            this.style.color = 'var(--text-secondary)';
            this.style.transform = 'scale(1)';
        });
        
        document.addEventListener('visibilitychange', function() {
            isWindowFocused = document.visibilityState === 'visible';
            updateAutoRefreshStatus();
        });
        
        function startAutoRefresh() {
            if (autoRefreshTimer) return;

            isAutoRefreshEnabled = true;
            // Only reset countdown if not currently refreshing
            if (!currentChat || !isChatRefreshing(currentChat)) {
                autoRefreshCountdown = 20;
            }
            
            autoRefreshTimer = setInterval(() => {
                const messageInput = document.getElementById('messageInput');
                const isTyping = messageInput && document.activeElement === messageInput;
                
                if (isWindowFocused && !isTyping && currentChat) {
                    // Only decrement countdown if NOT currently refreshing
                    if (!isChatRefreshing(currentChat)) {
                        autoRefreshCountdown--;
                    }
                    updateAutoRefreshStatus();

                    if (autoRefreshCountdown <= 0 && (!currentChat || !isChatRefreshing(currentChat))) {
                        performAutoRefresh();
                    }
                }
            }, 1000);
        }
        
        function stopAutoRefresh() {
            if (autoRefreshTimer) {
                clearInterval(autoRefreshTimer);
                autoRefreshTimer = null;
            }
            isAutoRefreshEnabled = false;
            updateAutoRefreshStatus();
        }
        
        function resetAutoRefreshCountdown() {
            // Only reset countdown if not currently refreshing
            if (!currentChat || !isChatRefreshing(currentChat)) {
                autoRefreshCountdown = 20;
                updateAutoRefreshStatus();
            }
        }
        
        async function performAutoRefresh() {
            // Check if current chat is already refreshing (only pause auto-refresh for current chat)
            if (currentChat && isChatRefreshing(currentChat)) {
                console.log('⏳ Auto-refresh skipped - current chat is already refreshing:', currentChat);
                autoRefreshCountdown = 20; // Reset countdown
                updateAutoRefreshStatus();
                return;
            }

            try {
                // Check if already querying processes for auto-refresh
                if (isQueryingProcesses) {
                    console.log('⏳ Auto-refresh skipped - processes already being queried');
                    return;
                }

                try {
                    isQueryingProcesses = true;
                    const chatsRegistryText = await getAllChatsFromAllProcesses();
                    if (chatsRegistryText && chatsRegistryText !== '{}' && chatsRegistryText !== 'null' && chatsRegistryText.trim() !== '') {
                        allChatsCache = JSON.parse(chatsRegistryText);
                        allChatsCacheTimestamp = Date.now();

                        detectAndAddNewChats();

                        updateAllChatUnreadCounts();
                    }
                } catch (error) {
                    console.error('Failed to refresh global cache during auto-refresh:', error);
                } finally {
                    isQueryingProcesses = false;
                }

                if (currentChat) {
                    const chat = allChatsCache[currentChat];
                    if (chat) {
                        // Check if chat is currently sending a message
                        if (isChatSending(currentChat)) {
                            console.log('⏳ Auto-refresh skipped - chat is currently sending message:', currentChat);
                            setStatus('updateStatus', 'Sending message...');
                        } else {
                            // Set refresh lock only for auto-refresh server operations
                            setChatRefreshing(currentChat, true);

                            console.log('🔄 Auto-refresh checking for message updates...');
                            setStatus('updateStatus', 'Decrypting your messages...');
                            await loadChatMessages(currentChat);
                            setStatus('updateStatus', 'Updated');

                            // Clear refresh lock when auto-refresh completes
                            setChatRefreshing(currentChat, false);
                        }
                    }
                } else {
                    setStatus('updateStatus', 'Updated');
                }
            } catch (error) {
                console.error('Auto-refresh failed:', error);
                setStatus('updateStatus', 'Auto-refresh error');

                // Clear refresh lock on auto-refresh error
                if (currentChat) {
                    setChatRefreshing(currentChat, false);
                }
            }

            // Reset countdown only after refresh completes (success or error)
            autoRefreshCountdown = 20;
            updateAutoRefreshStatus();
        }
        
        function updateAutoRefreshStatus() {
            const statusElement = document.getElementById('updateStatus');
            if (!statusElement || !isAutoRefreshEnabled) return;
            
            if (!isWindowFocused) {
                statusElement.textContent = 'Paused (tab hidden)';
                statusElement.style.color = 'var(--text-secondary)';
            } else if (currentChat && isChatSending(currentChat)) {
                statusElement.textContent = 'Sending message...';
                statusElement.style.color = 'var(--warning)';
            } else if (currentChat && isChatRefreshing(currentChat)) {
                statusElement.textContent = 'Refreshing...';
                statusElement.style.color = 'var(--primary)';
            } else if (autoRefreshCountdown > 0) {
                statusElement.textContent = `Auto-refresh in ${autoRefreshCountdown}s`;
                statusElement.style.color = 'var(--text-secondary)';
            } else {
                statusElement.textContent = 'Refreshing...';
                statusElement.style.color = 'var(--primary)';
            }
        }
        
        async function loadChatMessages(chatId) {
            try {
                console.log('🔄 Loading chat messages with dual message object system');

                const chat = allChatsCache[chatId];
                if (!chat) {
                    console.log('❌ Chat not found in cache');
                    await renderMessages([]);
                    return;
                }

                console.log('📦 Loading with dual message format (race condition free)');
                await loadDualMessageChat(chatId, chat);

                resetAutoRefreshCountdown();

            } catch (error) {
                console.error('Failed to load chat messages:', error);
                await renderMessages([]);
            }
        }

        // Handle reaction state validation and merging with messages
        async function handleReactionSync(chatId, chat, allMessages) {
            try {
                const reactionsKey = `reactions_${chatId}`;
                const stateHashKey = `reactionsStateHash_${chatId}`;

                // Get server reaction data
                const serverReactions = chat.reactions || [];
                const serverStateHash = chat.reactionsStateHash || '';

                // Get cached reaction data
                const cachedReactionsStr = localStorage.getItem(reactionsKey);
                const cachedStateHash = localStorage.getItem(stateHashKey);

                let finalReactions = [];

                if (cachedStateHash && cachedStateHash.startsWith('local_')) {
                    // We have local changes - merge server + local reactions
                    console.log('🔄 Merging server reactions with local cache');

                    finalReactions = [...serverReactions];

                    if (cachedReactionsStr) {
                        const cachedReactions = JSON.parse(cachedReactionsStr);

                        // Add local reactions that aren't on server yet
                        cachedReactions.forEach(localReaction => {
                            const localUser = localReaction.user || localReaction.reactorAddress;
                            const existsOnServer = serverReactions.some(serverReaction => {
                                const serverUser = serverReaction.user || serverReaction.reactorAddress;
                                return serverReaction.messageId === localReaction.messageId &&
                                       serverUser === localUser &&
                                       serverReaction.emoji === localReaction.emoji;
                            });

                            if (!existsOnServer) {
                                console.log('📤 Local reaction not yet on server:', localReaction);
                                finalReactions.push(localReaction);
                            }
                        });
                    }

                    // Update cache with server state hash (since we've merged)
                    localStorage.setItem(stateHashKey, serverStateHash);
                    localStorage.setItem(reactionsKey, JSON.stringify(finalReactions));

                } else if (cachedStateHash === serverStateHash && cachedReactionsStr) {
                    // State hash matches - use cached reactions
                    console.log('✅ Reaction cache is current, using cached data');
                    finalReactions = JSON.parse(cachedReactionsStr);

                } else {
                    // No cache or cache is stale - use server reactions and update cache
                    console.log('🔄 Updating reaction cache from server');
                    finalReactions = serverReactions;
                    localStorage.setItem(reactionsKey, JSON.stringify(finalReactions));
                    localStorage.setItem(stateHashKey, serverStateHash);
                }

                // Merge reactions into messages
                mergeReactionsWithMessages(allMessages, finalReactions);

                console.log(`📊 Reaction sync complete: ${finalReactions.length} reactions merged`);

            } catch (error) {
                console.error('❌ Failed to sync reactions:', error);
            }
        }

        // Merge reaction data with message objects
        function mergeReactionsWithMessages(messages, reactions) {
            messages.forEach(message => {
                // Find reactions for this message
                const messageReactions = reactions.filter(r => r.messageId === message.id);
                message.reactions = messageReactions;
            });
        }

        async function loadDualMessageChat(chatId, chat) {
            try {
                const isCurrentlySending = isChatSending(chatId);

                if (isCurrentlySending) {
                    console.log('⏳ Chat is sending - loading cached messages only (no server refresh):', chatId);
                } else {
                    console.log('🎯 Loading dual message chat:', chatId);
                }
                console.log('User1:', chat.user1_address, '- Messages:', chat.user1_messageCount || 0);
                console.log('User2:', chat.user2_address, '- Messages:', chat.user2_messageCount || 0);
                
                let ownMessages = [];
                let recipientMessages = [];
                
                chat.user1_messages = chat.user1_messages || [];
                chat.user2_messages = chat.user2_messages || [];
                
                const isUser1 = (userAddress === chat.user1_address);
                const isUser2 = (userAddress === chat.user2_address);
                
                if (!isUser1 && !isUser2) {
                    console.error('❌ Current user not found in chat participants');
                    await renderMessages([]);
                    return;
                }
                
                console.log(`👤 Current user is: ${isUser1 ? 'User1' : 'User2'}`);
                
                const ownMessagesKey = `ownMessages_${chatId}`;
                const ownStateHashKey = `ownStateHash_${chatId}`;
                const storedOwnMessages = localStorage.getItem(ownMessagesKey);
                const storedStateHash = localStorage.getItem(ownStateHashKey);
                
                const currentStateHash = isUser1 ? chat.user1_stateHash : chat.user2_stateHash;
                
                if (storedOwnMessages && storedStateHash) {
                    try {
                        ownMessages = JSON.parse(storedOwnMessages);
                        // Mark cached messages as sent since they're already stored
                        ownMessages = ownMessages.map(msg => ({
                            ...msg,
                            deliveryStatus: 'sent'
                        }));

                        // Preserve existing pending messages during cache load
                        const existingPendingMessages = ownMessagesCache[chatId]?.filter(msg =>
                            msg.deliveryStatus === 'sending' &&
                            !ownMessages.find(stored => stored.id === msg.id)
                        ) || [];

                        // Merge localStorage data with pending messages
                        ownMessagesCache[chatId] = [...ownMessages, ...existingPendingMessages];

                        if (existingPendingMessages.length > 0) {
                            console.log(`🔀 Preserved ${existingPendingMessages.length} pending messages during cache load for chat ${chatId}`);
                        }
                        console.log(`✅ Loaded ${ownMessages.length} own messages from localStorage (no signature needed)`);
                        
                        // Check if state hash matches (perfect sync check) - but skip during send to prevent race conditions
                        if (!isCurrentlySending && storedStateHash !== currentStateHash) {
                            console.log(`🔄 State hash mismatch. Stored: ${storedStateHash}, Server: ${currentStateHash}. Refreshing...`);
                            throw new Error('State hash mismatch - need to refresh from server');
                        } else if (isCurrentlySending) {
                            console.log(`⏳ Skipping state hash check during send - using cached messages`);
                        }
                    } catch (parseError) {
                        console.error('❌ Failed to parse stored own messages or need refresh:', parseError);
                        
                        // Keep existing messages as fallback
                        const fallbackMessages = ownMessages || [];

                        // Only decrypt from server if not currently sending (prevent race conditions)
                        if (!isCurrentlySending) {
                            console.log('🔐 Decrypting your messages from server');
                            const ownMessageObject = isUser1 ? chat.user1_messages : chat.user2_messages;
                        if (ownMessageObject && ownMessageObject.length > 0) {
                            try {
                                ownMessages = await decryptMessageObject(ownMessageObject[0], 'own');
                                
                                // Mark decrypted messages as sent since they're from server
                                ownMessages = ownMessages.map(msg => ({
                                    ...msg,
                                    deliveryStatus: 'sent'
                                }));
                                
                                // Store permanently in localStorage with state hash
                                localStorage.setItem(ownMessagesKey, JSON.stringify(ownMessages));
                                localStorage.setItem(ownStateHashKey, currentStateHash);

                                // Preserve existing pending messages during cache update
                                const existingPendingMessages = ownMessagesCache[chatId]?.filter(msg =>
                                    msg.deliveryStatus === 'sending' &&
                                    !ownMessages.find(stored => stored.id === msg.id)
                                ) || [];
                                ownMessagesCache[chatId] = [...ownMessages, ...existingPendingMessages];
                                
                            } catch (decryptError) {
                                console.error('❌ Failed to decrypt from server, using cached messages:', decryptError);
                                ownMessages = fallbackMessages;
                            }
                        } else {
                            ownMessages = fallbackMessages;
                        }
                        } else {
                            // Currently sending - use fallback messages, don't decrypt from server
                            console.log('⏳ Using fallback messages during send - skipping server decryption');
                            ownMessages = fallbackMessages;
                        }
                    }
                } else {
                    // Need to decrypt our own messages from server (first time) - but skip during send
                    if (!isCurrentlySending) {
                        console.log('🔐 Decrypting your messages from server (first time setup)');

                        const ownMessageObject = isUser1 ? chat.user1_messages : chat.user2_messages;
                    if (ownMessageObject && ownMessageObject.length > 0) {
                        ownMessages = await decryptMessageObject(ownMessageObject[0], 'own');
                        
                        // Mark decrypted messages as sent since they're from server
                        ownMessages = ownMessages.map(msg => ({
                            ...msg,
                            deliveryStatus: 'sent'
                        }));
                        
                        // Store permanently in localStorage with state hash
                        localStorage.setItem(ownMessagesKey, JSON.stringify(ownMessages));
                        localStorage.setItem(ownStateHashKey, currentStateHash);

                        // Preserve existing pending messages during cache update
                        const existingPendingMessages = ownMessagesCache[chatId]?.filter(msg =>
                            msg.deliveryStatus === 'sending' &&
                            !ownMessages.find(stored => stored.id === msg.id)
                        ) || [];
                        ownMessagesCache[chatId] = [...ownMessages, ...existingPendingMessages];

                    }
                    } else {
                        // Currently sending - no messages for first time setup, will use empty array
                        console.log('⏳ First time setup skipped during send - using empty messages');
                        ownMessages = [];
                    }
                }
                
                // STEP 2: Load recipient messages (smart caching with state hash)
                const recipientMessagesKey = `recipientMessages_${chatId}`;
                const recipientStateHashKey = `recipientStateHash_${chatId}`;
                const storedRecipientMessages = localStorage.getItem(recipientMessagesKey);
                const storedRecipientStateHash = localStorage.getItem(recipientStateHashKey);
                
                // Get current recipient state hash from server
                const currentRecipientStateHash = isUser1 ? chat.user2_stateHash : chat.user1_stateHash;
                
                if (storedRecipientMessages && storedRecipientStateHash && currentRecipientStateHash) {
                    try {
                        recipientMessages = JSON.parse(storedRecipientMessages);
                        
                        console.log('📋 Recipient messages from cache analysis:');
                        console.log('  - Cached recipient messages count:', recipientMessages?.length || 0);
                        console.log('  - Stored state hash:', storedRecipientStateHash);
                        console.log('  - Current state hash:', currentRecipientStateHash);
                        console.log('  - State hash match:', storedRecipientStateHash === currentRecipientStateHash);
                        
                        // Mark cached messages as sent since they're already stored
                        recipientMessages = recipientMessages.map(msg => ({
                            ...msg,
                            deliveryStatus: 'sent'
                        }));
                        
                        // Check if recipient state hash matches
                        if (storedRecipientStateHash !== currentRecipientStateHash) {
                            console.log(`🔄 Recipient state hash mismatch. Stored: ${storedRecipientStateHash}, Server: ${currentRecipientStateHash}. Refreshing...`);
                            throw new Error('Recipient state hash mismatch - need to refresh');
                        }
                        
                        // If we have 0 recipient messages but server shows messages exist, force refresh
                        const serverRecipientMessageCount = isUser1 ? chat.user2_messageCount : chat.user1_messageCount;
                        if (recipientMessages.length === 0 && serverRecipientMessageCount > 0) {
                            console.log(`🔄 Empty cache but server shows ${serverRecipientMessageCount} recipient messages. Forcing refresh...`);
                            throw new Error('Empty cache with server messages - need to refresh');
                        }
                    } catch (parseError) {
                        console.warn('❌', parseError);
                        
                        // Decrypt from server
                        console.log('🔐 Decrypting conversation messages from server (requires signature)');
                        const recipientMessageObject = isUser1 ? chat.user2_messages : chat.user1_messages;
                        
                        console.log('🔍 Cached refresh - Recipient message object analysis:');
                        console.log('  - Is User1:', isUser1);
                        console.log('  - Looking at:', isUser1 ? 'chat.user2_messages' : 'chat.user1_messages');
                        console.log('  - Object exists:', !!recipientMessageObject);
                        console.log('  - Object length:', recipientMessageObject?.length || 0);
                        
                        if (recipientMessageObject && recipientMessageObject.length > 0) {
                            try {
                                console.log('🔐 Attempting to decrypt conversation messages (cached refresh)...');
                                showWalletApprovalOverlay('Please authorize to decrypt recipient messages...');
                                
                                // Check if we have the recipient's public key
                                const recipientAddress = isUser1 ? chat.user2_address : chat.user1_address;
                                const hasPublicKey = !!hybridCrypto.publicKeys[recipientAddress];
                                console.log(`🔑 Public key available for ${recipientAddress}:`, hasPublicKey);
                                
                                if (!hasPublicKey) {
                                    console.log('⏳ Ensuring recipient public key (cached refresh)...');
                                    await ensureRecipientPublicKey(recipientAddress);
                                }
                                
                                recipientMessages = await decryptMessageObject(recipientMessageObject[0], 'recipient');
                                console.log(`✅ Successfully decrypted ${recipientMessages?.length || 0} conversation messages (cached refresh)`);
                                
                                // Mark decrypted messages as sent since they're from server
                                recipientMessages = recipientMessages.map(msg => ({
                                    ...msg,
                                    deliveryStatus: 'sent'
                                }));
                                
                                // Cache the decrypted recipient messages with state hash
                                localStorage.setItem(recipientMessagesKey, JSON.stringify(recipientMessages));
                                localStorage.setItem(recipientStateHashKey, currentRecipientStateHash);
                                
                            } catch (decryptError) {
                                console.error('❌ Failed to decrypt recipient messages (cached refresh):', decryptError);
                                console.error('   Error details:', decryptError.message);
                                console.error('   Recipient address:', isUser1 ? chat.user2_address : chat.user1_address);
                                recipientMessages = [];
                            }
                        } else {
                            console.log('📭 No recipient messages to decrypt (cached refresh)');
                            recipientMessages = [];
                        }
                    }
                } else {
                    // First time or no cached data - decrypt from server
                    console.log('🔐 Decrypting conversation messages from server (first time or no cache)');
                    const recipientMessageObject = isUser1 ? chat.user2_messages : chat.user1_messages;
                    
                    console.log('🔍 Recipient message object analysis:');
                    console.log('  - Is User1:', isUser1);
                    console.log('  - Looking at:', isUser1 ? 'chat.user2_messages' : 'chat.user1_messages');
                    console.log('  - Object exists:', !!recipientMessageObject);
                    console.log('  - Object length:', recipientMessageObject?.length || 0);
                    console.log('  - First object preview:', recipientMessageObject?.[0] ? Object.keys(recipientMessageObject[0]) : 'none');
                    
                    if (recipientMessageObject && recipientMessageObject.length > 0) {
                        try {
                            console.log('🔐 Attempting to decrypt conversation messages...');
                            showWalletApprovalOverlay('Please authorize to decrypt conversation...');
                            
                            // Check if we have the recipient's public key
                            const recipientAddress = isUser1 ? chat.user2_address : chat.user1_address;
                            const hasPublicKey = !!hybridCrypto.publicKeys[recipientAddress];
                            console.log(`🔑 Public key available for ${recipientAddress}:`, hasPublicKey);
                            
                            if (!hasPublicKey) {
                                console.log('⏳ Ensuring recipient public key...');
                                await ensureRecipientPublicKey(recipientAddress);
                            }
                            
                            recipientMessages = await decryptMessageObject(recipientMessageObject[0], 'recipient');
                            console.log(`✅ Successfully decrypted ${recipientMessages?.length || 0} conversation messages`);
                            
                            // Mark decrypted messages as sent since they're from server
                            recipientMessages = recipientMessages.map(msg => ({
                                ...msg,
                                deliveryStatus: 'sent'
                            }));
                            
                            // Cache the decrypted recipient messages with state hash
                            if (currentRecipientStateHash) {
                                localStorage.setItem(recipientMessagesKey, JSON.stringify(recipientMessages));
                                localStorage.setItem(recipientStateHashKey, currentRecipientStateHash);
                            }
                            
                        } catch (decryptError) {
                            console.error('❌ Failed to decrypt recipient messages:', decryptError);
                            console.error('   Error details:', decryptError.message);
                            console.error('   Recipient address:', isUser1 ? chat.user2_address : chat.user1_address);
                            recipientMessages = [];
                        }
                    } else {
                        console.log('📭 No recipient messages to decrypt');
                        recipientMessages = [];
                    }
                }
                
                // STEP 3: Merge messages chronologically and render
                let allMessages = mergeMessagesChronologically(ownMessages, recipientMessages);
                console.log(`🔀 Merged ${allMessages.length} total messages chronologically`);

                // STEP 4: Include pending messages from ownMessagesCache if chat is currently sending
                // Also check for orphaned pending messages even if send lock is cleared (edge case)
                if (ownMessagesCache[chatId]) {
                    // Find messages with 'sending' status that aren't already in allMessages
                    const pendingMessages = ownMessagesCache[chatId].filter(msg =>
                        msg.deliveryStatus === 'sending' &&
                        !allMessages.find(existing => existing.id === msg.id) &&
                        msg.id && msg.content // Validate message structure
                    );

                    if (pendingMessages.length > 0) {
                        if (isCurrentlySending) {
                            console.log(`⏳ Including ${pendingMessages.length} pending messages from ownMessagesCache (chat is sending)`);
                        } else {
                            console.log(`🔍 Found ${pendingMessages.length} orphaned pending messages, including them for consistency`);
                        }

                        // Add pending messages to the end (most recent)
                        allMessages = [...allMessages, ...pendingMessages];
                        console.log(`🔀 Updated merged messages: ${allMessages.length} total (including pending)`);
                    }
                }

                // STEP: Handle reaction state validation and merging
                await handleReactionSync(chatId, chat, allMessages);

                // Update display cache (merged messages for rendering)
                displayMessagesCache[chatId] = allMessages;

                // Render the merged messages
                await renderMessages(allMessages);
                
            } catch (error) {
                console.error('❌ Failed to load dual message chat:', error);
                await renderMessages([]);
            }
        }

        // Decrypt a single message object (either own or recipient)
        async function decryptMessageObject(messageObjectInput, type) {
            try {
                // Handle both object and string inputs
                const encryptedPackage = typeof messageObjectInput === 'string' 
                    ? JSON.parse(messageObjectInput) 
                    : messageObjectInput;
                    
                if (!encryptedPackage.encryptedMessages || encryptedPackage.encryptedMessages === '') {
                    return []; // Empty message object
                }
                
                console.log(`🔓 Decrypting ${type} message object...`);
                const decryptedMessages = await hybridCrypto.decryptChatMessages(encryptedPackage, userAddress);
                return decryptedMessages || [];
            } catch (error) {
                console.error(`❌ Failed to decrypt ${type} messages:`, error);
                return [];
            }
        }

        // Merge own and recipient messages chronologically by timestamp
        function mergeMessagesChronologically(ownMessages, recipientMessages) {
            try {
                const allMessages = [...(ownMessages || []), ...(recipientMessages || [])];
                
                // Sort by timestamp
                allMessages.sort((a, b) => {
                    const timestampA = a.timestamp || 0;
                    const timestampB = b.timestamp || 0;
                    return timestampA - timestampB;
                });
                
                console.log(`🔀 Merged messages: ${ownMessages?.length || 0} own + ${recipientMessages?.length || 0} recipient = ${allMessages.length} total`);
                
                return allMessages;
            } catch (error) {
                console.error('❌ Failed to merge messages:', error);
                return [...(ownMessages || []), ...(recipientMessages || [])];
            }
        }
        
        // Smart DOM diffing for messages to prevent "blinking"
        function smartUpdateMessages(messagesContainer, newMessages, currentChatId) {
            const existingElements = messagesContainer.querySelectorAll('[data-message-id]');
            const existingIds = new Set();

            // Map existing messages by ID
            existingElements.forEach(element => {
                const messageId = element.getAttribute('data-message-id');
                if (messageId) existingIds.add(messageId);
            });

            // Check if we have new messages to add
            let hasNewMessages = false;
            newMessages.forEach(msg => {
                if (!existingIds.has(msg.id)) {
                    hasNewMessages = true;
                }
            });

            // Check for reaction state changes
            const currentChat = allChatsCache[currentChatId];
            const currentReactionStateHash = currentChat?.reactionsStateHash || '';
            const lastKnownStateHash = chatReactionStateHashes.get(currentChatId) || '';
            const hasReactionChanges = currentReactionStateHash !== lastKnownStateHash;

            if (hasReactionChanges) {
                console.log('🎭 Reaction state changed, forcing rebuild:', {
                    current: currentReactionStateHash,
                    last: lastKnownStateHash
                });
                // Update stored state hash
                chatReactionStateHashes.set(currentChatId, currentReactionStateHash);
                return false; // Force rebuild due to reaction changes
            }

            // If no new messages and same count, skip rebuild to prevent blinking
            if (!hasNewMessages && existingElements.length === newMessages.length) {
                console.log('📊 No message changes detected, skipping rebuild to prevent blinking');
                return true; // Indicates we skipped rebuild
            }

            // Only rebuild if there are actual changes
            console.log(`🔄 Messages changed: ${newMessages.length} total, ${hasNewMessages ? 'has new' : 'no new'} messages`);
            // Update stored state hash for future comparisons
            chatReactionStateHashes.set(currentChatId, currentReactionStateHash);
            return false; // Indicates we should rebuild
        }

        async function renderMessages(messages) {
            const messagesContainer = document.getElementById('messages');
            const currentChatId = currentChat;
            
            let decryptedMessages = [];
            
            // Check format type and handle accordingly
            if (messages && messages.length === 1 && typeof messages[0] === 'string') {
                
                try {
                    const packageData = JSON.parse(messages[0]);
                    
                    // NEW: Dual message format (already decrypted and merged)
                    if (packageData.encryptedMessages === 'dual_message_format') {
                        console.log('📦 Using pre-decrypted dual message format');
                        decryptedMessages = displayMessagesCache[currentChatId] || [];

                        // Mark loaded messages as sent, but preserve existing delivery status for pending messages
                        decryptedMessages = decryptedMessages.map(msg => ({
                            ...msg,
                            deliveryStatus: msg.deliveryStatus === 'sending' ? 'sending' : 'sent',
                            decrypted: (msg.sender !== userAddress) ? 'yes' : (msg.decrypted || 'no')
                        }));
                        
                    }
                    // LEGACY: Single encrypted package format
                    else if (packageData.encryptedMessages && packageData.encryptedMessages !== '') {
                        console.log('📜 Decrypting your messages');
                        
                        // Show user-friendly message for wallet popup
                        showWalletApprovalOverlay('Please authorize to decrypt your messages...');
                        
                        // Decrypt entire chat with wallet popup
                        decryptedMessages = await hybridCrypto.decryptChatMessages(packageData, userAddress);
                        
                        // Mark all loaded messages as successfully sent
                        decryptedMessages = decryptedMessages.map(msg => ({
                            ...msg,
                            deliveryStatus: 'sent',
                            decrypted: (msg.sender !== userAddress) ? 'yes' : (msg.decrypted || 'no')
                        }));
                        
                        // Update display cache
                        displayMessagesCache[currentChatId] = decryptedMessages;
                        
                    }
                    
                } catch (decryptError) {
                    console.error('Failed to decrypt chat messages:', decryptError);
                    decryptedMessages = [{
                        id: 'error',
                        content: '🔐 Encrypted chat - decryption failed',
                        sender: 'system',
                        timestamp: Date.now() / 1000
                    }];
                }
            } else if (displayMessagesCache[currentChatId] && displayMessagesCache[currentChatId].length > 0) {
                decryptedMessages = displayMessagesCache[currentChatId];
            } else {
                decryptedMessages = messages || [];
            }
            
            // Smart update check to prevent unnecessary rebuilds
            const shouldSkipRebuild = smartUpdateMessages(messagesContainer, decryptedMessages, currentChatId);
            if (shouldSkipRebuild) {
                // Preserve scroll position since we're not rebuilding
                return;
            }

            // Store current scroll position to preserve it
            const scrollPosition = messagesContainer.scrollTop;
            const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 1;

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
                        statusIcon = `<span onclick="resendMessage('${msg.id || index}')" class="message-resend">Resend</span>`;
                        statusColor = '#2196f3';
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
                <div class="message ${isSentByUser ? 'sent' : 'other'}" data-message-id="${msg.id || index}">
                    <div class="message-content ${isSentByUser ? 'sent' : 'received'}">
                        <div class="message-sender">
                            ${msg.sender.slice(0, 8)}...
                        </div>
                        <div>${msg.content}</div>
                        <div class="message-meta">
                            <span>${new Date(msg.timestamp * 1000).toLocaleTimeString()}</span>
                            ${statusIcon ? `<span class="message-status" style="color: ${statusColor};">${statusIcon}</span>` : ''}
                        </div>
                        <div class="message-reactions" id="reactions-${msg.id || index}">
                            ${renderMessageReactions(msg.reactions || [], msg.id || index, isSentByUser)}
                        </div>
                        ${!isSentByUser ? `<button class="message-react-btn" onclick="openEmojiPicker('${msg.id || index}')">
                            😊
                        </button>` : ''}
                    </div>
                </div>
                `;
            }).join('');

            // Restore scroll position intelligently
            if (isScrolledToBottom) {
                // User was at bottom, keep them at bottom (new message behavior)
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                // User was reading older messages, preserve their position
                messagesContainer.scrollTop = scrollPosition;
            }
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
                        statusElement.innerHTML = '<span onclick="resendMessage(\'' + messageId + '\')" class="message-resend">Resend</span>';
                        statusElement.style.color = '#2196f3'; // Blue color like a link
                    } else if (status === 'failed') {
                        statusElement.innerHTML = '&#9888;'; // Warning triangle - failed
                        statusElement.style.color = '#f44336';
                    }
                }
            }

            // Update message status in cache and sync to localStorage for failed messages
            if (status === 'failed') {
                // Find the message in cache and update its status
                for (const [chatId, messages] of Object.entries(ownMessagesCache)) {
                    const messageIndex = messages.findIndex(msg => msg.id === messageId);
                    if (messageIndex !== -1) {
                        ownMessagesCache[chatId][messageIndex].deliveryStatus = 'failed';

                        // Sync to localStorage immediately
                        const ownMessagesKey = `ownMessages_${chatId}`;
                        localStorage.setItem(ownMessagesKey, JSON.stringify(ownMessagesCache[chatId]));
                        console.log(`❌ Updated message ${messageId} status to 'failed' in cache for chat ${chatId}`);
                        break;
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
                <div class="message ${isSentByUser ? 'sent' : ''}" data-message-id="${message.id}">
                    <div class="message-content ${isSentByUser ? 'sent' : 'received'}">
                        <div class="message-sender">
                            ${message.sender.slice(0, 8)}...
                        </div>
                        <div>${message.content}</div>
                        <div class="message-meta">
                            <span>${new Date(message.timestamp * 1000).toLocaleTimeString()}</span>
                            ${isSentByUser ? `<span class="message-status">${statusIcon}</span>` : ''}
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
            console.log('New Chat button clicked!');
            showCreateChatModal();
        });

        // Check for existing chat with recipient (deduplication)
        function checkForExistingChat(recipientAddress) {
            if (!allChatsCache || !allUserProcesses.owned) {
                return null;
            }

            // ONLY check chats where WE are the owner (from our owned processes)
            // This allows creating a new chat we own even if we're a recipient in another chat
            for (const processId of allUserProcesses.owned) {
                for (const chatId in allChatsCache) {
                    const chat = allChatsCache[chatId];

                    // Skip if this chat doesn't belong to our owned process
                    if (chat.sourceProcessId !== processId) {
                        continue;
                    }

                    // Check if this chat includes both our address and the recipient
                    const participants = chat.participants || [];
                    const hasCurrentUser = participants.includes(userAddress);
                    const hasRecipient = participants.includes(recipientAddress);

                    // Only prevent creation if we already OWN a chat with this recipient
                    // (since this chat comes from our owned process, we are the owner)
                    if (hasCurrentUser && hasRecipient && participants.length === 2) {
                        return {
                            chatId: chatId,
                            nickname: chat.nickname || 'Existing Chat',
                            participants: participants,
                            ownedByUser: true
                        };
                    }
                }
            }

            return null;
        }

        // Create chat form submission (single event listener)
        document.getElementById('createChatForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const modal = document.getElementById('createChatModal');
            const nickname = document.getElementById('chatNickname').value.trim();
            const recipient = document.getElementById('recipientAddress').value.trim();
            const submitButton = modal.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            if (!recipient) {
                showToast('Please enter a recipient address', 'warning');
                return;
            }

            if (recipient === userAddress) {
                showToast('Cannot create chat with yourself', 'error');
                return;
            }

            // Check for existing chat with this recipient (deduplication)
            const existingChat = checkForExistingChat(recipient);
            if (existingChat) {
                showToast(`You already have a chat with this recipient: "${existingChat.nickname}"`, 'warning');
                return;
            }

            try {
                // Set loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Creating Chat...';
                submitButton.style.cursor = 'not-allowed';
                submitButton.style.opacity = '0.6';

                // Create chat with nickname
                await createNewChat(recipient, nickname || 'New Chat');
                closeCreateChatModal();

            } catch (error) {
                console.error('Failed to create chat:', error);
                showToast('Failed to create chat. Please try again.', 'error');
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                submitButton.style.cursor = 'pointer';
                submitButton.style.opacity = '1';
            }
        });

        // Create chat modal input focus styles (single setup)
        document.querySelectorAll('#createChatModal input').forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--primary)';
                input.style.background = 'var(--bg-primary)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--border-medium)';
                input.style.background = 'var(--bg-secondary)';
            });
        });

        // ===== CONTACTS EVENT LISTENERS =====

        // Contact picker button
        const contactPickerBtn = document.getElementById('contactPickerBtn');
        if (contactPickerBtn) {
            contactPickerBtn.addEventListener('click', () => {
                openContactPickerModal();
            });
        }

        // Contacts modal close buttons
        const closeContactsModalBtn = document.getElementById('closeContactsModal');
        if (closeContactsModalBtn) {
            closeContactsModalBtn.addEventListener('click', closeContactsModal);
        }

        // Add contact modal close button and form
        const addContactBtn = document.getElementById('addContactBtn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', openAddContactModal);
        }

        const addContactForm = document.getElementById('addContactForm');
        if (addContactForm) {
            addContactForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitButton = e.target.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;

                try {
                    submitButton.textContent = 'Adding...';
                    submitButton.disabled = true;

                    const contactData = {
                        name: document.getElementById('contactName').value.trim(),
                        address: document.getElementById('contactAddress').value.trim(),
                        email: document.getElementById('contactEmail').value.trim(),
                        phone: document.getElementById('contactPhone').value.trim(),
                        twitter: document.getElementById('contactTwitter').value.trim(),
                        linkedin: document.getElementById('contactLinkedIn').value.trim(),
                        company: document.getElementById('contactCompany').value.trim(),
                        website: document.getElementById('contactWebsite').value.trim(),
                        notes: document.getElementById('contactNotes').value.trim(),
                        tags: document.getElementById('contactTags').value.trim()
                    };

                    await addContact(contactData);

                    closeAddContactModal();
                    renderContactsList('contactsList'); // Refresh the contacts list

                    showToast('Contact added successfully!', 'success');
                } catch (error) {
                    console.error('❌ Failed to add contact:', error);
                    showToast('Failed to add contact: ' + error.message, 'error');
                } finally {
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                }
            });
        }

        // Contacts search functionality
        const contactsSearch = document.getElementById('contactsSearch');
        if (contactsSearch) {
            contactsSearch.addEventListener('input', (e) => {
                renderContactsList('contactsList', e.target.value);
            });
        }

        const contactSelectorSearch = document.getElementById('contactSelectorSearch');
        if (contactSelectorSearch) {
            contactSelectorSearch.addEventListener('input', (e) => {
                renderContactPickerList(e.target.value);
            });
        }

        // Modal overlay click handlers to close modals
        document.getElementById('contactsModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeContactsModal();
        });

        document.getElementById('addContactModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeAddContactModal();
        });

        document.getElementById('contactSelectorModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeContactPickerModal();
        });

        // ===== END CONTACTS EVENT LISTENERS =====
        
        // Show create chat modal
        function showCreateChatModal() {
            console.log('Showing new chat modal...');
            const modal = document.getElementById('createChatModal');
            modal.classList.add('open');
            


            // Focus first input
            setTimeout(() => {
                document.getElementById('chatNickname').focus();
            }, 100);
        }
        
        // Close create chat modal
        window.closeCreateChatModal = function() {
            const modal = document.getElementById('createChatModal');
            if (modal) {
                modal.classList.remove('open');
            }
        };

        // Make contact modal functions globally accessible
        window.openContactsModal = openContactsModal;
        window.closeContactsModal = closeContactsModal;
        window.openAddContactModal = openAddContactModal;
        window.closeAddContactModal = closeAddContactModal;
        window.openContactPickerModal = openContactPickerModal;
        window.closeContactPickerModal = closeContactPickerModal;
        window.selectContactForChat = selectContactForChat;
        
        async function createNewChat(otherUser, chatNickname = 'New Chat') {
            try {
                if (!userProcessId) {
                    throw new Error('No user process ID available');
                }
                
                // Create proper AO message structure
                const participants = `${userAddress},${otherUser}`;
                
                const messageId = await message({
                    process: userProcessId,
                    tags: [
                        { name: "Action", value: "create-chat" },
                        { name: "Participants", value: participants },
                        { name: "Nickname", value: chatNickname }
                    ],
                    signer: createDataItemSigner(wallet),
                    data: ""
                });

                // Get the result using the message ID
                const { Messages, Spawns, Output, Error } = await result({
                    message: messageId,
                    process: userProcessId
                });
                
                // Check if we got a response from the CreateChat handler
                if (Messages && Messages.length > 0) {
                    const responseMessage = Messages[0];
                    
                    // Look for data in Tags with name "data"
                    const dataTag = responseMessage.Tags?.find(tag => tag.name === 'data');
                    const responseData = dataTag?.value || responseMessage.Data;
                    
                    try {
                        const response = JSON.parse(responseData);
                        if (response.status === 'success') {
                            // Wait a moment for the backend to process, then refresh
                            setTimeout(async () => {
                                await loadUserChats(); // Refresh chat list
                                showToast('Chat created successfully! Chat ID: ' + response.chatId, 'success');
                            }, 1000);
                        } else {
                            showToast('Failed to create chat: ' + (response.message || 'Unknown error'), 'error');
                        }
                    } catch (parseError) {
                        console.error('Failed to parse response:', parseError);
                        console.log('Raw response data:', responseData);
                        showToast('Chat creation request sent! Check your chat list.', 'success');
                    }
                } else if (Error) {
                    console.error('AO Error:', Error);
                    showToast('Failed to create chat: ' + Error, 'error');
                } else {
                    console.log('No response message received');
                    showToast('Chat creation request sent! Check your chat list.', 'success');
                }
            } catch (error) {
                console.error('Failed to create chat:', error);
                showToast('Failed to create chat: ' + error.message, 'error');
            }
        }
        
        // Send message with debouncing
        let sendInProgress = false;
        let lastSendTime = 0;
        const SEND_DEBOUNCE_MS = 300;
        
        const debouncedSendMessage = async () => {
            const now = Date.now();
            if (sendInProgress || (now - lastSendTime) < SEND_DEBOUNCE_MS) {
                console.log('🚫 Send blocked - too fast or already in progress');
                return;
            }
            
            lastSendTime = now;
            sendInProgress = true;
            
            // Disable UI
            const sendBtn = document.getElementById('sendBtn');
            const messageInput = document.getElementById('messageInput');
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
            messageInput.disabled = true;
            
            try {
                await sendMessage();
            } finally {
                // Re-enable UI
                sendInProgress = false;
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
                messageInput.disabled = false;
            }
        };
        
        document.getElementById('sendBtn').addEventListener('click', debouncedSendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') debouncedSendMessage();
        });
        
        // Separate caches for different purposes
        let displayMessagesCache = {}; // For rendering merged messages from both users
        let ownMessagesCache = {}; // Only current user's messages for encryption/sending
        
        // Global cache for full chats registry data (eliminates redundant API calls)
        let allChatsCache = {};
        let allChatsCacheTimestamp = 0;
        
        // Store unread message counts per chat
        let chatUnreadCounts = {};
        
        // Function to update unread counts for all chats in cache
        function updateAllChatUnreadCounts() {
            try {
                // Get last seen counts and state hashes from localStorage
                const lastSeenCounts = JSON.parse(localStorage.getItem('lastSeenMessageCounts') || '{}');
                const lastSeenStateHashes = JSON.parse(localStorage.getItem('lastSeenStateHashes') || '{}');
                
                Object.keys(allChatsCache).forEach(chatId => {
                    // Skip metadata fields - only process actual chat objects
                    if (chatId.startsWith('_contacts') || chatId === '_contactsData' || chatId === '_contactsStateHash' ||
                        chatId === '_BUILD_VERSION' || chatId === '_MASTER_VERSION' ||
                        chatId === '_USER_PROCESS_VERSION' || chatId === '_FRONTEND_VERSION') {
                        return; // Skip metadata fields
                    }

                    const chat = allChatsCache[chatId];
                    // Calculate total message count from dual message format
                    const totalMessageCount = (chat.user1_messageCount || 0) + (chat.user2_messageCount || 0);

                    if (chat && totalMessageCount >= 0) {
                        // Update the chat object's lastMessage display text
                        chat.lastMessage = totalMessageCount > 0 ?
                            `${totalMessageCount} message${totalMessageCount !== 1 ? 's' : ''}` :
                            'No messages yet';
                        
                        // Update the sidebar display immediately
                        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
                        if (chatElement) {
                            const previewElement = chatElement.querySelector('.chat-item-preview');
                            if (previewElement) {
                                previewElement.textContent = chat.lastMessage;
                            }
                        }
                        // Skip unread count calculation for currently active chat
                        if (chatId === currentChat) {
                            chatUnreadCounts[chatId] = 0;
                            updateChatListUnreadUI(chatId, 0);
                            return;
                        }
                        
                        const lastSeenCount = lastSeenCounts[chatId] || 0;
                        const lastSeenUser1Hash = lastSeenStateHashes[`${chatId}_user1`] || '';
                        const lastSeenUser2Hash = lastSeenStateHashes[`${chatId}_user2`] || '';
                        const currentCount = totalMessageCount;
                        // Keep state hashes separate for pure comparison
                        const currentUser1Hash = chat.user1_stateHash || '';
                        const currentUser2Hash = chat.user2_stateHash || '';
                        
                        // Only show unread if BOTH conditions are true:
                        // 1. Message count increased 
                        // 2. Either user's state hash changed (indicating new messages)
                        let unreadCount = 0;
                        const user1HashChanged = currentUser1Hash !== lastSeenUser1Hash;
                        const user2HashChanged = currentUser2Hash !== lastSeenUser2Hash;
                        
                        if (currentCount > lastSeenCount && (user1HashChanged || user2HashChanged)) {
                            unreadCount = Math.max(0, currentCount - lastSeenCount);
                        }
                        
                        chatUnreadCounts[chatId] = unreadCount;
                        
                        // Update chat list UI if it exists
                        updateChatListUnreadUI(chatId, unreadCount);
                    }
                });
            } catch (error) {
                console.error('Failed to update unread counts:', error);
            }
        }
        
        // Function to mark chat as read (when user opens chat)
        function markChatAsRead(chatId) {
            try {
                const chat = allChatsCache[chatId];
                const totalMessageCount = (chat.user1_messageCount || 0) + (chat.user2_messageCount || 0);
                
                if (chat && totalMessageCount >= 0) {
                    // Update localStorage with current message count
                    const lastSeenCounts = JSON.parse(localStorage.getItem('lastSeenMessageCounts') || '{}');
                    lastSeenCounts[chatId] = totalMessageCount;
                    localStorage.setItem('lastSeenMessageCounts', JSON.stringify(lastSeenCounts));
                    
                    // Update localStorage with separate state hashes for pure comparison
                    const lastSeenStateHashes = JSON.parse(localStorage.getItem('lastSeenStateHashes') || '{}');
                    lastSeenStateHashes[`${chatId}_user1`] = chat.user1_stateHash || '';
                    lastSeenStateHashes[`${chatId}_user2`] = chat.user2_stateHash || '';
                    localStorage.setItem('lastSeenStateHashes', JSON.stringify(lastSeenStateHashes));
                    
                    // Clear unread count
                    chatUnreadCounts[chatId] = 0;
                    
                    // Update UI
                    updateChatListUnreadUI(chatId, 0);
                }
            } catch (error) {
                console.error('Failed to mark chat as read:', error);
            }
        }
        
        // Function to detect and add newly created chats to the UI
        function detectAndAddNewChats() {
            try {
                // Get currently displayed chat IDs
                const currentChatElements = document.querySelectorAll('[data-chat-id]');
                const displayedChatIds = new Set();
                currentChatElements.forEach(element => {
                    const chatId = element.getAttribute('data-chat-id');
                    if (chatId) displayedChatIds.add(chatId);
                });
                
                // Check for new chats in cache that aren't displayed
                const newChatsFound = [];
                Object.keys(allChatsCache).forEach(chatId => {
                    // Skip contacts data fields - only check actual chat objects
                    if (chatId.startsWith('_contacts') || chatId === '_contactsData' || chatId === '_contactsStateHash') {
                        return; // Skip contacts fields
                    }

                    const chat = allChatsCache[chatId];

                    // Check if user is a member and chat is not already displayed
                    let isUserMember = false;
                    if (chat.members && Array.isArray(chat.members)) {
                        isUserMember = chat.members.some(member => member.address === userAddress);
                    } else if (chat.participants && chat.participants.includes(userAddress)) {
                        // Fallback for backward compatibility
                        isUserMember = true;
                    }
                    
                    if (isUserMember && !displayedChatIds.has(chatId)) {
                        newChatsFound.push(chatId);
                    }
                });
                
                // If new chats found, reload the entire chat list
                if (newChatsFound.length > 0) {
                    console.log(`Found ${newChatsFound.length} new chats:`, newChatsFound);
                    loadUserChats(); // Rebuild the entire chat list
                }
                
                return newChatsFound.length > 0;
            } catch (error) {
                console.error('Failed to detect new chats:', error);
                return false;
            }
        }
        
        // Function to update chat list UI with unread count
        function updateChatListUnreadUI(chatId, unreadCount) {
            const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (chatElement) {
                let badge = chatElement.querySelector('.unread-badge');
                
                if (unreadCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'unread-badge';
                        badge.style.cssText = `
                            position: absolute;
                            top: 8px;
                            right: 8px;
                            background: #ff4444;
                            color: white;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            font-size: 0.7rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                        `;
                        chatElement.style.position = 'relative';
                        chatElement.appendChild(badge);
                    }
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
                    badge.style.display = 'flex';
                } else if (badge) {
                    badge.style.display = 'none';
                }
            }
        }
        
        // Message tracking for status updates
        let messageStates = {};
        
        // Message deduplication tracking
        const pendingMessages = new Set();
        
        // Chat states for race condition detection and manual resends
        
        // Get chat state from cache (efficient - no API call)
        function getCachedChatState(chatId) {
            try {
                const chat = allChatsCache[chatId];
                if (chat) {
                    return {
                        stateHash: chat.stateHash || null,
                        messageCount: chat.messageCount || 0,
                        lastUpdated: chat.lastUpdated || 0,
                        exists: true,
                        messages: chat.messages || []
                    };
                }
                return { stateHash: null, messageCount: 0, lastUpdated: 0, exists: false, messages: [] };
            } catch (error) {
                console.error('Failed to get cached chat state:', error);
                return { stateHash: null, messageCount: 0, lastUpdated: 0, exists: false, messages: [] };
            }
        }
        

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message && currentChat) {
                // Set chat-specific send lock to prevent race conditions
                setChatSending(currentChat, true);

                updateAutoRefreshStatus();
                // Generate stable deduplication key based on content hash (no timestamp)
                const encoder = new TextEncoder();
                const data = encoder.encode(message + currentChat + userAddress);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
                const messageKey = `${currentChat}_${contentHash}`;
                
                // Check for duplicate/pending message
                if (pendingMessages.has(messageKey)) {
                    console.log('🚫 Duplicate message detected (same content), ignoring send request');
                    return;
                }
                
                // Add to pending set
                pendingMessages.add(messageKey);
                
                // Generate unique message ID
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Store origin chat for proper cache management during completion
                const originChatId = currentChat;

                // Create message object for instant display
                const newMessage = {
                    id: messageId,
                    content: message,
                    sender: userAddress,
                    timestamp: Math.floor(Date.now() / 1000),
                    deliveryStatus: 'sending',
                    decrypted: 'no',
                    originChatId: originChatId // Track which chat this message belongs to
                };
                
                // Clear input immediately
                input.value = '';
                
                // Add to own messages cache (for encryption/sending)
                if (!ownMessagesCache[currentChat]) {
                    ownMessagesCache[currentChat] = [];
                }
                
                // Check for duplicate message IDs before adding
                const existingMessage = ownMessagesCache[currentChat].find(msg => msg.id === messageId);
                if (existingMessage) {
                    console.warn('🚨 DUPLICATE MESSAGE ID in own cache:', messageId);
                    console.warn('Existing:', existingMessage);
                    console.warn('New:', newMessage);
                    return; // Don't add duplicate
                }
                
                ownMessagesCache[currentChat].push(newMessage);
                
                // Display message instantly
                addMessageToDisplay(newMessage);
                
                try {
                    // Get recipient address
                    const recipientAddress = await getRecipientAddress(currentChat);
                    if (!recipientAddress) {
                        showToast('Cannot determine recipient address', 'error');
                        updateMessageStatus(messageId, 'failed');
                        // Remove from pending set on failure
                        pendingMessages.delete(messageKey);
                        return;
                    }
                    
                    // Proactively ensure we have recipient's public key
                    console.log('🔑 Ensuring recipient public key before encryption...');
                    try {
                        await ensureRecipientPublicKey(recipientAddress);
                        console.log('✅ Recipient public key confirmed, proceeding with encryption');
                    } catch (keyError) {
                        console.error('❌ Failed to get recipient public key:', keyError);
                        
                        // Show user-friendly error message
                        if (keyError.message.includes('needs to send their first message')) {
                            showToast(keyError.message, 'error');
                        } else if (keyError.message.includes('declined to request')) {
                            showToast('Cannot send encrypted message without recipient verification.', 'warning');
                        } else {
                            showToast('Cannot establish secure connection with recipient: ' + keyError.message, 'error');
                        }
                        
                        updateMessageStatus(messageId, 'failed');
                        // Remove from pending set on failure
                        pendingMessages.delete(messageKey);
                        return;
                    }
                    
                    // Encrypt current user's messages (only own messages, not merged)
                    let currentMessages = ownMessagesCache[currentChat] || [];
                    
                    // Check for duplicate IDs in the array being sent
                    const messageIds = currentMessages.map(m => m.id);
                    const uniqueIds = new Set(messageIds);
                    if (messageIds.length !== uniqueIds.size) {
                        console.error('🚨 DUPLICATE MESSAGE IDs detected in encryption array!');
                        console.error('All IDs:', messageIds);
                        console.error('Unique IDs:', Array.from(uniqueIds));
                        // Remove duplicates by ID
                        const seenIds = new Set();
                        currentMessages = currentMessages.filter(msg => {
                            if (seenIds.has(msg.id)) {
                                console.warn('Removing duplicate message:', msg.id);
                                return false;
                            }
                            seenIds.add(msg.id);
                            return true;
                        });
                        console.log(`Removed ${messageIds.length - currentMessages.length} duplicate messages`);
                    }
                    
                    const encryptedChatPackage = await hybridCrypto.encryptChatMessages(
                        currentMessages, 
                        userAddress, 
                        recipientAddress
                    );
                    
                    // Send immediately - no race detection needed
                    await sendChatUpdateToBackend(
                        messageId,
                        currentChat, 
                        encryptedChatPackage,
                        recipientAddress
                    );
                    
                    // Mark as sent in DOM
                    updateMessageStatus(messageId, 'sent');

                    // Update message status in origin chat's cache
                    if (ownMessagesCache[originChatId]) {
                        const messageIndex = ownMessagesCache[originChatId].findIndex(msg => msg.id === messageId);
                        if (messageIndex !== -1) {
                            ownMessagesCache[originChatId][messageIndex].deliveryStatus = 'sent';
                            console.log(`✅ Updated message ${messageId} status to 'sent' in cache for chat ${originChatId}`);
                        }
                    }

                    // Update cache immediately to prevent unnecessary re-decryption
                    // Use originChatId to ensure we update the correct chat's cache
                    const ownMessagesKey = `ownMessages_${originChatId}`;
                    const ownStateHashKey = `ownStateHash_${originChatId}`;
                    localStorage.setItem(ownMessagesKey, JSON.stringify(ownMessagesCache[originChatId] || []));
                    localStorage.setItem(ownStateHashKey, encryptedChatPackage.stateHash);
                    
                    // Mark chat as read with updated state to prevent showing notification for own sent message
                    // We can't use markChatAsRead() here because allChatsCache hasn't been updated yet
                    // So we manually update the last seen state with the new message count and hash
                    try {
                        const chat = allChatsCache[originChatId];
                        if (chat) {
                            // Calculate new total message count (old count + 1 for the message we just sent)
                            const oldTotalCount = (chat.user1_messageCount || 0) + (chat.user2_messageCount || 0);
                            const newTotalCount = oldTotalCount + 1;

                            // Update last seen count for origin chat
                            const lastSeenCounts = JSON.parse(localStorage.getItem('lastSeenMessageCounts') || '{}');
                            lastSeenCounts[originChatId] = newTotalCount;
                            localStorage.setItem('lastSeenMessageCounts', JSON.stringify(lastSeenCounts));

                            // Update last seen state hash with separate hashes for pure comparison
                            const lastSeenStateHashes = JSON.parse(localStorage.getItem('lastSeenStateHashes') || '{}');
                            const isUser1 = (userAddress === chat.user1_address);

                            // Update only our own state hash, keep other user's hash unchanged
                            if (isUser1) {
                                lastSeenStateHashes[`${originChatId}_user1`] = encryptedChatPackage.stateHash;
                                lastSeenStateHashes[`${originChatId}_user2`] = chat.user2_stateHash || '';
                            } else {
                                lastSeenStateHashes[`${originChatId}_user1`] = chat.user1_stateHash || '';
                                lastSeenStateHashes[`${originChatId}_user2`] = encryptedChatPackage.stateHash;
                            }
                            localStorage.setItem('lastSeenStateHashes', JSON.stringify(lastSeenStateHashes));
                            
                            console.log(`✅ Marked chat as read after sending: count=${newTotalCount}, user${isUser1 ? '1' : '2'}Hash=${encryptedChatPackage.stateHash}`);
                            
                            // Update allChatsCache to reflect the new message count in sidebar
                            if (isUser1) {
                                chat.user1_messageCount = (chat.user1_messageCount || 0) + 1;
                                chat.user1_stateHash = encryptedChatPackage.stateHash;
                            } else {
                                chat.user2_messageCount = (chat.user2_messageCount || 0) + 1;
                                chat.user2_stateHash = encryptedChatPackage.stateHash;
                            }
                            
                            // Update the displayed lastMessage in the sidebar
                            const updatedTotalCount = (chat.user1_messageCount || 0) + (chat.user2_messageCount || 0);
                            chat.lastMessage = updatedTotalCount > 0 ? `${updatedTotalCount} message${updatedTotalCount !== 1 ? 's' : ''}` : 'No messages yet';
                            
                            // Update the sidebar display for origin chat
                            const chatElement = document.querySelector(`[data-chat-id="${originChatId}"]`);
                            if (chatElement) {
                                const previewElement = chatElement.querySelector('.chat-item-preview');
                                if (previewElement) {
                                    previewElement.textContent = chat.lastMessage;
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Failed to mark chat as read after sending:', error);
                    }
                    
                    // Remove from pending set on success
                    pendingMessages.delete(messageKey);
                    
                } catch (error) {
                    console.error('Failed to send message:', error);
                    
                    // Show user-friendly error message  
                    showToast('Failed to send message: ' + error.message, 'error');
                    updateMessageStatus(messageId, 'failed');
                    
                    // Remove from pending set on failure
                    pendingMessages.delete(messageKey);
                } finally {
                    // Clear chat-specific send lock
                    setChatSending(currentChat, false);

                    resetAutoRefreshCountdown();
                }
            }
        }
        
        // Request public key via signature (for new wallets)
        async function requestPublicKeyViaSignature(recipientAddress) {
            try {
                // Show user-friendly modal explaining what's happening
                const userConfirmed = await showPublicKeyRequestModal(recipientAddress);
                if (!userConfirmed) {
                    throw new Error('User declined to request public key signature');
                }
                
                // For now, we need the recipient to be the current user or have access to their wallet
                // In a real implementation, this would involve asking the recipient to sign
                if (recipientAddress === userAddress) {
                    // Current user - we can ask them to sign directly
                    const message = `HyperGram public key extraction for ${recipientAddress}`;
                    
                    showWalletApprovalOverlay('Please sign message to enable encryption...');
                    
                    try {
                        const signatureData = await window.arweaveWallet.signMessage(new TextEncoder().encode(message));
                        hideWalletApprovalOverlay();
                        
                        // Extract public key from signature
                        const publicKey = await extractPublicKeyFromSignatureData(signatureData, recipientAddress);
                        
                        // Cache it permanently
                        hybridCrypto.publicKeys[recipientAddress] = publicKey;
                        await savePublicKeyToCache(recipientAddress, publicKey);
                        
                        showWalletApprovalOverlay('Encryption enabled successfully!', '#4caf50');
                        setTimeout(() => hideWalletApprovalOverlay(), 2000);
                        
                        return publicKey;
                        
                    } catch (signError) {
                        hideWalletApprovalOverlay();
                        throw new Error(`Signature failed: ${signError.message}`);
                    }
                } else {
                    // For other users, we'll need a different approach
                    // For now, show a helpful message and fall back to existing error handling
                    throw new Error(`This wallet (${recipientAddress.slice(0,8)}...) needs to send their first message to enable encrypted messaging. Please ask them to send you a message first.`);
                }
                
            } catch (error) {
                console.error('Failed to request public key via signature:', error);
                throw error;
            }
        }
        
        // Extract public key from Arweave signature data
        async function extractPublicKeyFromSignatureData(signatureData, address) {
            try {
                // Arweave signatures contain the public key information
                // For now, we'll use a simpler approach - generate from address
                // In a full implementation, you'd extract from the actual signature
                
                // Note: This is a simplified implementation
                // Real implementation would involve parsing the signature structure
                console.log('Extracting public key from signature data for:', address);
                
                // For now, fall back to trying to get it from the wallet directly
                if (window.arweaveWallet && address === userAddress) {
                    try {
                        const publicKey = await window.arweaveWallet.getActivePublicKey();
                        if (publicKey) {
                            return await hybridCrypto.importArweavePublicKey(publicKey);
                        }
                    } catch (e) {
                        console.log('Could not get public key directly from wallet');
                    }
                }
                
                throw new Error('Could not extract public key from signature data');
                
            } catch (error) {
                console.error('Failed to extract public key from signature:', error);
                throw error;
            }
        }
        
        // Show modal requesting public key signature
        async function showPublicKeyRequestModal(recipientAddress) {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.style.cssText = 'background: rgba(0,0,0,0.7); z-index: 10001; font-family: "Inter", sans-serif;';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">🔐 Enable Encrypted Messaging</h3>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem; line-height: 1.6;">
                            <p style="margin-bottom: 1rem;">
                                To send encrypted messages to <strong>${recipientAddress.slice(0,8)}...${recipientAddress.slice(-4)}</strong>, 
                                we need to verify their wallet.
                            </p>
                            <p style="margin-bottom: 1rem;">
                                This is a <strong>one-time setup</strong> that enables secure messaging between you.
                            </p>
                            ${recipientAddress === userAddress ? 
                                '<p style="color: #0088cc; font-weight: 500;">You\'ll be asked to sign a simple message to enable encryption.</p>' :
                                '<p style="color: #ff9800; font-weight: 500;">The recipient needs to sign a message to enable encryption with their wallet.</p>'
                            }
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" data-action="cancel">Cancel</button>
                            <button type="button" class="btn-primary" data-action="proceed">
                                ${recipientAddress === userAddress ? 'Sign Message' : 'Ask Recipient'}
                            </button>
                        </div>
                    </div>
                `;
                
                modal.addEventListener('click', (e) => {
                    const action = e.target.getAttribute('data-action');
                    if (action === 'proceed') {
                        modal.remove();
                        resolve(true);
                    } else if (action === 'cancel' || e.target === modal) {
                        modal.remove();
                        resolve(false);
                    }
                });
                
                document.body.appendChild(modal);
            });
        }
        
        // Persistent public key caching functions
        async function savePublicKeyToCache(address, publicKey) {
            try {
                // Export public key to JWK format for storage
                const jwkKey = await crypto.subtle.exportKey('jwk', publicKey);
                
                // Get existing cache
                const cached = JSON.parse(localStorage.getItem('publicKeyCache') || '{}');
                
                // Add new key
                cached[address] = {
                    jwk: jwkKey,
                    timestamp: Date.now(),
                    source: 'signature' // Track how we got this key
                };
                
                // Save back to localStorage
                localStorage.setItem('publicKeyCache', JSON.stringify(cached));
                
                console.log('💾 Saved public key to cache for:', address);
                
            } catch (error) {
                console.error('Failed to save public key to cache:', error);
                // Don't throw - caching failure shouldn't break functionality
            }
        }
        
        async function loadPublicKeyFromCache(address) {
            try {
                const cached = JSON.parse(localStorage.getItem('publicKeyCache') || '{}');
                const keyData = cached[address];
                
                if (!keyData || !keyData.jwk) {
                    return null;
                }
                
                // Check if cache entry is too old (30 days)
                const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
                if (Date.now() - keyData.timestamp > MAX_CACHE_AGE) {
                    console.log('🗑️ Cache entry expired for:', address);
                    delete cached[address];
                    localStorage.setItem('publicKeyCache', JSON.stringify(cached));
                    return null;
                }
                
                // Import key back from JWK
                const publicKey = await crypto.subtle.importKey(
                    'jwk',
                    keyData.jwk,
                    {
                        name: 'RSA-OAEP',
                        hash: 'SHA-256'
                    },
                    true,
                    ['encrypt']
                );
                
                console.log('📦 Loaded public key from cache for:', address, `(${keyData.source})`);
                return publicKey;
                
            } catch (error) {
                console.error('Failed to load public key from cache:', error);
                return null;
            }
        }
        
        async function loadAllCachedPublicKeys() {
            try {
                const cached = JSON.parse(localStorage.getItem('publicKeyCache') || '{}');
                let loadedCount = 0;
                
                for (const address of Object.keys(cached)) {
                    const publicKey = await loadPublicKeyFromCache(address);
                    if (publicKey) {
                        hybridCrypto.publicKeys[address] = publicKey;
                        loadedCount++;
                    }
                }
                
                if (loadedCount > 0) {
                    console.log(`📚 Loaded ${loadedCount} cached public keys on startup`);
                }
                
            } catch (error) {
                console.error('Failed to load cached public keys:', error);
            }
        }
        
        // Smart public key acquisition with fallback chain
        async function ensureRecipientPublicKey(recipientAddress) {
            try {
                console.log('🔑 Ensuring public key for:', recipientAddress);
                
                // 1. Check memory cache first (instant)
                if (hybridCrypto.publicKeys[recipientAddress]) {
                    console.log('✅ Public key found in memory cache for:', recipientAddress);
                    return hybridCrypto.publicKeys[recipientAddress];
                }
                
                // 2. Check persistent cache (localStorage)
                const cachedKey = await loadPublicKeyFromCache(recipientAddress);
                if (cachedKey) {
                    hybridCrypto.publicKeys[recipientAddress] = cachedKey;
                    console.log('✅ Public key loaded from persistent cache for:', recipientAddress);
                    return cachedKey;
                }
                
                // 3. Try GraphQL (silent, fast for existing wallets)
                console.log('🔍 Trying GraphQL extraction for:', recipientAddress);
                try {
                    await extractAndCachePublicKey(recipientAddress);
                    if (hybridCrypto.publicKeys[recipientAddress]) {
                        // Cache the GraphQL result persistently too
                        await savePublicKeyToCache(recipientAddress, hybridCrypto.publicKeys[recipientAddress]);
                        console.log('✅ Public key extracted via GraphQL and cached for:', recipientAddress);
                        return hybridCrypto.publicKeys[recipientAddress];
                    }
                } catch (graphqlError) {
                    console.log('⚠️ GraphQL failed for:', recipientAddress, graphqlError.message);
                }
                
                // 4. Fall back to signature flow (for new wallets)
                console.log('📝 Requesting signature for public key from:', recipientAddress);
                const publicKey = await requestPublicKeyViaSignature(recipientAddress);
                
                if (publicKey) {
                    console.log('✅ Public key obtained via signature for:', recipientAddress);
                    return publicKey;
                }
                
                throw new Error(`Could not obtain public key for ${recipientAddress} via any method`);
                
            } catch (error) {
                console.error('❌ Failed to ensure recipient public key:', error);
                throw new Error(`Unable to get public key for ${recipientAddress}: ${error.message}`);
            }
        }

        // Extract and cache public key from GraphQL after successful message
        async function extractAndCachePublicKey(address) {
            // Skip if already cached
            if (hybridCrypto.publicKeys[address]) {
                console.log('Public key already cached for:', address);
                return;
            }
            
            console.log('Attempting to extract and cache public key for:', address);
            
            try {
                // Query GraphQL for the latest transaction from this address
                const query = `
                query {
                    transactions(owners: ["${address}"], first: 1) {
                        edges {
                            node {
                                id
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
                const publicKeyData = data.data.transactions.edges[0]?.node.owner.key;
                
                if (publicKeyData) {
                    // Convert Arweave public key to WebCrypto format and cache it
                    const publicKey = await hybridCrypto.importArweavePublicKey(publicKeyData);
                    hybridCrypto.publicKeys[address] = publicKey;
                    console.log('✅ Public key extracted and cached for:', address);
                } else {
                    console.log('⏳ Public key not yet available in GraphQL for:', address, '(indexing in progress)');
                }
                
            } catch (error) {
                console.warn('Failed to extract public key for:', address, error);
            }
        }
        
        // Send chat update to backend
        async function sendChatUpdateToBackend(msgId, chatId, encryptedChatPackage, recipientAddress) {
            console.log('🚀 sendChatUpdateToBackend called');
            console.log('📋 Simple parameters:');
            console.log('  - msgId:', msgId);
            console.log('  - chatId:', chatId);
            console.log('  - messageCount:', encryptedChatPackage.messageCount);
            console.log('  - userAddress:', userAddress);
            console.log('  - userProcessId:', userProcessId);
            
            // Determine correct target process for the chat
            const currentChatData = allChatsCache[chatId];
            let targetProcessId = userProcessId; // Default to user's own process
            
            if (currentChatData && currentChatData.sourceProcessId) {
                targetProcessId = currentChatData.sourceProcessId;
                console.log('🎯 Routing message to chat owner process:', targetProcessId);
            } else {
                console.log('⚠️ No sourceProcessId found, using user process:', targetProcessId);
            }
            
            console.log('📍 Target process determined:', targetProcessId);
            
            // Validate all values are strings
            console.log('📋 Tag validation:');
            console.log('  - chatId type:', typeof chatId, 'value:', chatId);
            console.log('  - userAddress type:', typeof userAddress, 'value:', userAddress);
            console.log('  - messageCount type:', typeof encryptedChatPackage.messageCount);
            
            try {
                // Move large data to message body to avoid tag size limit (4096 bytes)
                const messageData = {
                    encryptedMessages: encryptedChatPackage.encryptedMessages,
                    iv: encryptedChatPackage.iv,
                    aesKeyForSender: encryptedChatPackage.aesKeyForSender,
                    aesKeyForRecipient: encryptedChatPackage.aesKeyForRecipient,
                    senderAddress: encryptedChatPackage.senderAddress,
                    recipientAddress: encryptedChatPackage.recipientAddress
                };

                const messagePayload = {
                    process: targetProcessId,
                    tags: [
                        { name: "Action", value: "update-chat-messages" },
                        { name: "Chat-Id", value: chatId },
                        { name: "Encrypted", value: "true" },
                        { name: "State-Hash", value: encryptedChatPackage.stateHash || "" },
                        { name: "Message-Count", value: (encryptedChatPackage.messageCount || 0).toString() },
                        { name: "Last-Message-Id", value: msgId },
                        { name: "Last-Updated", value: encryptedChatPackage.lastUpdated.toString() }
                    ],
                    signer: createDataItemSigner(wallet),
                    data: JSON.stringify(messageData)
                };
                
                
                const aoMessageId = await message(messagePayload);
                
                console.log('✅ Message sent successfully, ID:', aoMessageId);
                
                // Extract and cache sender's public key from successful message
                await extractAndCachePublicKey(userAddress);

                // Get the result using the message ID
                const { Messages, Spawns, Output, Error } = await result({
                    message: aoMessageId,
                    process: targetProcessId
                });
                
                // Handle the response (similar to chat creation)
                if (Messages && Messages.length > 0) {
                    console.log('Chat update sent successfully');
                    return { success: true, messages: Messages };
                } else if (Error) {
                    console.error('AO Error:', Error);
                    throw new Error(`Failed to send chat update: ${Error}`);
                } else {
                    console.log('Chat update sent, no explicit response');
                    return { success: true, messages: [] };
                }
                
            } catch (error) {
                console.error('❌ Failed to send message:', error);
                throw error;
            }
        }

        

        // Show conflict notification to user
        function showConflictNotification(chatId) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = `
                <div class="notification-content">
                    ⚠️ <strong>Message Conflict</strong>
                    <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                        ✕
                    </button>
                </div>
                <div class="notification-details">
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
        
        // Wallet Approval Overlay Functions
        function showWalletApprovalOverlay(message, color = '#0088cc') {
            // Remove existing overlay if any
            hideWalletApprovalOverlay();
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'walletApprovalOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                color: ${color};
                padding: 1rem 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10003;
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                text-align: center;
                border: 2px solid ${color};
                animation: overlayPulse 2s infinite;
                min-width: 300px;
                max-width: 500px;
            `;
            
            overlay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%; animation: overlayDot 1.5s infinite;"></div>
                    <span>${message}</span>
                    <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%; animation: overlayDot 1.5s infinite 0.5s;"></div>
                </div>
            `;
            
            // Add CSS animations if not already added
            if (!document.getElementById('walletOverlayStyles')) {
                const style = document.createElement('style');
                style.id = 'walletOverlayStyles';
                style.textContent = `
                    @keyframes overlayPulse {
                        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.02); }
                    }
                    @keyframes overlayDot {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(overlay);
        }
        
        function hideWalletApprovalOverlay() {
            const overlay = document.getElementById('walletApprovalOverlay');
            if (overlay) {
                overlay.remove();
            }
        }

        // Reaction System Functions

        let currentReactionMessageId = null;

        // Render reactions for a message
        function renderMessageReactions(reactions, messageId, isSentByUser = false) {
            if (!reactions || reactions.length === 0) {
                return '';
            }

            // Group reactions by emoji
            const reactionMap = {};
            reactions.forEach(reaction => {
                // Handle both server format (reactorAddress) and local format (user)
                const reactorAddress = reaction.user || reaction.reactorAddress;

                if (!reactorAddress) {
                    console.warn('⚠️ Skipping reaction with no user address:', reaction);
                    return;
                }

                if (!reactionMap[reaction.emoji]) {
                    reactionMap[reaction.emoji] = {
                        count: 0,
                        users: [],
                        hasMyReaction: false
                    };
                }
                reactionMap[reaction.emoji].count++;
                reactionMap[reaction.emoji].users.push(reactorAddress);
                if (reactorAddress === userAddress) {
                    reactionMap[reaction.emoji].hasMyReaction = true;
                }
            });

            // Generate HTML for each unique reaction
            return Object.entries(reactionMap).map(([emoji, data]) => {
                let clickHandler = '';
                let clickableClass = '';

                if (isSentByUser) {
                    // On sent messages, only allow clicking user's own reactions
                    if (data.hasMyReaction) {
                        clickHandler = `onclick="openEmojiPicker('${messageId}')"`;
                        clickableClass = ' clickable';
                    } else {
                        // No click handler for other users' reactions on sent messages
                        clickableClass = ' non-clickable';
                    }
                } else {
                    // On received messages, allow clicking any reaction
                    clickHandler = data.hasMyReaction
                        ? `onclick="openEmojiPicker('${messageId}')"`
                        : `onclick="toggleReaction('${emoji}', '${messageId}')"`;
                    clickableClass = ' clickable';
                }

                return `
                    <span class="reaction-chip ${data.hasMyReaction ? 'my-reaction' : ''}${clickableClass}"
                          ${clickHandler}
                          title="${data.users.map(u => u.slice(0, 8) + '...').join(', ')}">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${data.count}</span>
                    </span>
                `;
            }).join('');
        }

        // Open emoji picker modal
        function openEmojiPicker(messageId) {
            currentReactionMessageId = messageId;
            const modal = document.getElementById('emojiPickerModal');
            const emojiGrid = document.getElementById('emojiGrid');

            // Clear existing content
            emojiGrid.innerHTML = '';

            // Populate with quick reactions by default
            populateEmojiGrid('quick');

            // Set up tab event listeners
            setupEmojiTabs();

            // Show modal
            modal.classList.add('open');
        }

        // Setup emoji tab functionality
        function setupEmojiTabs() {
            const tabs = document.querySelectorAll('.emoji-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));

                    // Add active class to clicked tab
                    tab.classList.add('active');

                    // Populate grid with selected category
                    const category = tab.dataset.category;
                    populateEmojiGrid(category);
                });
            });
        }

        // Populate emoji grid with category
        function populateEmojiGrid(category) {
            const emojiGrid = document.getElementById('emojiGrid');
            const emojis = EmojiUtils.getByCategory(category);

            emojiGrid.innerHTML = emojis.map(emoji => `
                <button class="emoji-item" onclick="selectEmoji('${emoji.emoji}')" title="${emoji.name}">
                    ${emoji.emoji}
                </button>
            `).join('');
        }

        // Select emoji and send reaction
        function selectEmoji(emoji) {
            // Close modal
            document.getElementById('emojiPickerModal').classList.remove('open');

            // Send reaction
            sendReaction(currentReactionMessageId, emoji);
        }

        // Send reaction to backend (optimistic update)
        async function sendReaction(messageId, emoji) {
            try {
                if (!currentChat) {
                    showToast('No active chat', 'error');
                    return;
                }

                // STEP 1: Instantly show reaction and cache it (optimistic update)
                console.log('⚡ Optimistically adding reaction:', { messageId, emoji });
                addReactionToMessage(messageId, emoji);
                cacheReactionLocally(currentChat, messageId, emoji);

                // STEP 2: Fire-and-forget server request (no await)
                const currentChatData = allChatsCache[currentChat];
                let targetProcessId = userProcessId; // Default to user's own process

                if (currentChatData && currentChatData.sourceProcessId) {
                    targetProcessId = currentChatData.sourceProcessId;
                    console.log('🎯 Routing reaction to chat owner process:', targetProcessId);
                } else {
                    console.log('⚠️ No sourceProcessId found, using user process:', targetProcessId);
                }

                // Send to server but don't wait for response
                message({
                    process: targetProcessId,
                    tags: [
                        { name: 'Action', value: 'add-reaction' },
                        { name: 'Chat-Id', value: currentChat },
                        { name: 'Message-Id', value: messageId },
                        { name: 'Emoji', value: emoji }
                    ],
                    signer: createDataItemSigner(wallet),
                    data: ''
                }).then(response => {
                    console.log('🔄 Reaction sent to server:', { messageId, emoji, response });
                }).catch(error => {
                    console.warn('⚠️ Reaction send failed, will retry on next refresh:', error);
                });

                console.log('✅ Reaction displayed instantly, server sync in background');

            } catch (error) {
                console.error('Failed to send reaction:', error);
                showToast('Failed to send reaction', 'error');
            }
        }

        // Cache reaction locally for instant persistence and state validation
        function cacheReactionLocally(chatId, messageId, emoji) {
            try {
                const reactionsKey = `reactions_${chatId}`;
                const stateHashKey = `reactionsStateHash_${chatId}`;

                // Get existing cached reactions
                let cachedReactions = [];
                const storedReactions = localStorage.getItem(reactionsKey);
                if (storedReactions) {
                    cachedReactions = JSON.parse(storedReactions);
                }

                // Validate userAddress before creating reaction
                if (!userAddress) {
                    console.error('❌ CRITICAL: userAddress is undefined when caching reaction!', { chatId, messageId, emoji });
                    throw new Error('userAddress is required for reaction caching');
                }

                // Create new reaction object (matching server format)
                const newReaction = {
                    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                    messageId: messageId,
                    emoji: emoji,
                    reactorAddress: userAddress,
                    timestamp: Date.now() / 1000
                };


                // Remove any existing reaction from this user on this message
                cachedReactions = cachedReactions.filter(r =>
                    !(r.messageId === messageId && (r.user === userAddress || r.reactorAddress === userAddress))
                );

                // Add new reaction
                cachedReactions.push(newReaction);

                // Update localStorage
                localStorage.setItem(reactionsKey, JSON.stringify(cachedReactions));

                // Update state hash to indicate local changes
                const localStateHash = `local_${Date.now()}_${cachedReactions.length}`;
                localStorage.setItem(stateHashKey, localStateHash);

                console.log('💾 Cached reaction locally:', { chatId, messageId, emoji, totalReactions: cachedReactions.length });

            } catch (error) {
                console.error('Failed to cache reaction locally:', error);
            }
        }

        // Add reaction to message with animation
        function addReactionToMessage(messageId, emoji) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!messageElement) {
                console.error('❌ Message element not found:', messageId);
                return;
            }

            const reactionsContainer = messageElement.querySelector(`#reactions-${messageId}`);
            if (!reactionsContainer) {
                console.error('❌ Reactions container not found for message:', messageId);
                return;
            }

            // Check if user already has a reaction on this message
            const existingUserReaction = reactionsContainer.querySelector('.my-reaction');

            if (existingUserReaction) {
                // Replace existing reaction
                const emojiSpan = existingUserReaction.querySelector('.reaction-emoji');
                const countSpan = existingUserReaction.querySelector('.reaction-count');

                // Update emoji and reset count to 1 (since it's just the user's reaction)
                emojiSpan.textContent = emoji;
                countSpan.textContent = '1';
                existingUserReaction.title = userAddress.slice(0, 8) + '...';

                // Add animation class
                existingUserReaction.classList.add('reaction-added');
                setTimeout(() => existingUserReaction.classList.remove('reaction-added'), 300);
            } else {
                // Add new reaction
                const reactionHtml = `
                    <span class="reaction-chip my-reaction reaction-added"
                          onclick="openEmojiPicker('${messageId}')"
                          title="${userAddress.slice(0, 8)}...">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">1</span>
                    </span>
                `;

                reactionsContainer.insertAdjacentHTML('beforeend', reactionHtml);

                // Remove animation class after animation completes
                setTimeout(() => {
                    const newReaction = reactionsContainer.querySelector('.reaction-added');
                    if (newReaction) {
                        newReaction.classList.remove('reaction-added');
                    }
                }, 300);
            }
        }

        // Toggle existing reaction (add/remove)
        async function toggleReaction(emoji, messageId) {
            // For now, just send the reaction (removal can be added later)
            await sendReaction(messageId, emoji);
        }

        // Close emoji picker modal
        document.getElementById('closeEmojiPicker')?.addEventListener('click', () => {
            document.getElementById('emojiPickerModal').classList.remove('open');
        });

        // Close modal when clicking outside
        document.getElementById('emojiPickerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'emojiPickerModal') {
                document.getElementById('emojiPickerModal').classList.remove('open');
            }
        });

        // Make functions globally available
        window.openEmojiPicker = openEmojiPicker;
        window.selectEmoji = selectEmoji;
        window.toggleReaction = toggleReaction;
        