import { t } from '../translations.js';

// Messaging state
let currentConversation = null;
let currentUser = null;
let currentTeacherId = null; // Track selected teacher for consistent UI
let conversations = [];
let messages = [];
let teachers = [];
let unreadCount = 0;
let refreshInterval = null;

// Initialize messaging system
export async function initializeMessaging() {
    try {
        // Check if input area exists
        const inputContainer = document.querySelector('.messages-input-container');
        const messageInput = document.getElementById('messageInput');
        console.log('🔍 Input container found:', !!inputContainer);
        console.log('🔍 Message input found:', !!messageInput);
        
        if (inputContainer) {
            console.log('🔍 Input container display:', window.getComputedStyle(inputContainer).display);
            console.log('🔍 Input container visibility:', window.getComputedStyle(inputContainer).visibility);
        }
        
        // Get current user info
        const userResponse = await fetch('/api/auth/user', {
            credentials: 'include'
        });
        if (userResponse.ok) {
            currentUser = await userResponse.json();
            console.log('📱 Current user:', currentUser);
            console.log('📱 Current user ID:', currentUser.id);
            console.log('📱 Current user role:', currentUser.role);
        } else {
            console.error('❌ Failed to get current user:', userResponse.status);
        }
        
        // Load conversations and teachers
        await loadConversations();
        
        // For admin users, always load teachers
        if (currentUser && currentUser.role === 'admin') {
            console.log('📱 Loading teachers for admin user...');
            await loadTeachers();
        }
        
        // Update unread count
        await updateUnreadCount();
        
        // Start auto-refresh
        startAutoRefresh();
        
        // Check input area again after initialization
        const inputContainerAfter = document.querySelector('.messages-input-container');
        const messageInputAfter = document.getElementById('messageInput');
        console.log('🔍 After init - Input container found:', !!inputContainerAfter);
        console.log('🔍 After init - Message input found:', !!messageInputAfter);
        
        if (inputContainerAfter) {
            console.log('🔍 After init - Input container display:', window.getComputedStyle(inputContainerAfter).display);
            console.log('🔍 After init - Input container visibility:', window.getComputedStyle(inputContainerAfter).visibility);
        }
        
        // Force show input area if it's hidden
        forceShowInputArea();
        
        console.log('📱 Messaging system initialized successfully');
    } catch (error) {
        console.error('Error initializing messaging:', error);
    }
}

// Force show input area if it's hidden
function forceShowInputArea() {
    const inputContainer = document.querySelector('.messages-input-container');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.querySelector('.messages-container');
    const messagesContent = document.querySelector('.messages-content');
    const messagesList = document.querySelector('.messages-list');
    
    if (inputContainer) {
        inputContainer.style.display = 'block';
        inputContainer.style.visibility = 'visible';
        inputContainer.style.opacity = '1';
        inputContainer.style.position = 'relative';
        inputContainer.style.zIndex = '10';
        console.log('🔧 Forced input container to be visible');
    }
    
    if (messageInput) {
        messageInput.style.display = 'block';
        messageInput.style.visibility = 'visible';
        messageInput.style.opacity = '1';
        console.log('🔧 Forced message input to be visible');
    }
    
    // Ensure the messages container has proper height
    if (messagesContainer) {
        messagesContainer.style.height = 'calc(100vh - 200px)';
        messagesContainer.style.minHeight = '400px';
        messagesContainer.style.maxHeight = '800px';
        console.log('🔧 Set proper height for messages container');
    }
    
    // Also ensure the messages content area has proper flex layout
    if (messagesContent) {
        messagesContent.style.display = 'flex';
        messagesContent.style.flexDirection = 'column';
        messagesContent.style.minHeight = '0';
        messagesContent.style.overflow = 'hidden';
        console.log('🔧 Ensured messages content has proper flex layout');
    }
    
    // Ensure messages list doesn't take up all space
    if (messagesList) {
        messagesList.style.maxHeight = 'none';
        messagesList.style.minHeight = '0';
        console.log('🔧 Set proper height for messages list');
    }
}

// Load conversations for current user
export async function loadConversations() {
    try {
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (response.ok) {
            conversations = await response.json();
            updateConversationsList();
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Load teachers for admin
export async function loadTeachers() {
    try {
        const response = await fetch('/api/messages/teachers', {
            credentials: 'include'
        });
        if (response.ok) {
            teachers = await response.json();
            updateTeachersList();
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

// Load messages for a conversation
export async function loadMessages(conversationId) {
    try {
        const response = await fetch(`/api/messages/${conversationId}`);
        if (response.ok) {
            messages = await response.json();
            currentConversation = conversationId;
            displayMessages();
            updateConversationsList(); // Update unread counts
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Send a message
export async function sendMessage(content, receiverId = null) {
    if (!content.trim()) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        // Determine receiver ID
        let targetReceiverId = receiverId;
        
        if (!targetReceiverId && currentConversation) {
            // Find receiver from current conversation
            const conversation = conversations.find(c => c.id === currentConversation);
            if (conversation) {
                targetReceiverId = currentUser.id === conversation.admin_id ? 
                    conversation.teacher_id : conversation.admin_id;
            }
        } else if (!targetReceiverId && currentUser && currentUser.role === 'admin') {
            // For admin users, use currentTeacherId directly
            if (currentTeacherId) {
                targetReceiverId = currentTeacherId;
            } else {
                // Fallback: find the selected teacher from the conversation header
                const conversationHeader = document.getElementById('conversationHeader');
                if (conversationHeader) {
                    const teacherName = conversationHeader.querySelector('h3')?.textContent;
                    if (teacherName && teacherName !== 'Select a conversation') {
                        const teacher = teachers.find(t => t.username === teacherName);
                        if (teacher) {
                            targetReceiverId = teacher.id;
                        }
                    }
                }
            }
        }
        
        if (!targetReceiverId) {
            showNotification('Please select a teacher to message', 'error');
            return;
        }
        
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receiver_id: targetReceiverId,
                content: content.trim()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Clear input
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = '';
                messageInput.placeholder = 'Type your message...';
            }
            
            // Update conversation ID if this was a new conversation
            if (!currentConversation && result.conversation_id) {
                currentConversation = result.conversation_id;
            }
            
            // Reload messages
            if (currentConversation) {
                await loadMessages(currentConversation);
            }
            
            // Update conversations and teachers lists
            await loadConversations();
            if (currentUser && currentUser.role === 'admin') {
                await loadTeachers();
            }
            
            console.log('✅ Message sent successfully');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

// Start conversation with a teacher (admin only)
export async function startConversation(teacherId) {
    try {
        // Set current teacher for consistent UI selection
        currentTeacherId = teacherId;
        console.log('🎯 Selected teacher:', teacherId);
        
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            showNotification('Teacher not found', 'error');
            return;
        }
        
        // Update UI to show selection
        updateTeachersList();
        
        // Check if conversation already exists
        let conversation = conversations.find(c => c.teacher_id === teacherId);
        
        if (conversation) {
            // Load existing conversation
            currentConversation = conversation.id;
            await loadMessages(conversation.id);
            updateConversationHeader(teacher);
        } else {
            // Set up for new conversation
            currentConversation = null;
            updateConversationHeader(teacher);
            
            // Clear messages container
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="empty-messages">
                        <i class="fas fa-comment-dots"></i>
                        <p>Start your conversation with ${teacher.username}</p>
                    </div>
                `;
            }
            
            // Focus on message input
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
                messageInput.placeholder = `Type a message to ${teacher.username}...`;
            }
            
            // Force show input area
            setTimeout(() => {
                forceShowInputArea();
            }, 100);
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
        showNotification('Failed to start conversation', 'error');
    }
}

// Update conversations list in sidebar
function updateConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    // Update sidebar title and loading text based on user role
    const sidebarTitle = document.getElementById('sidebarTitle');
    const loadingText = document.getElementById('loadingText');
    
    if (sidebarTitle) {
        sidebarTitle.textContent = currentUser && currentUser.role === 'admin' ? 'Teachers' : 'Conversations';
    }
    
    if (loadingText) {
        loadingText.textContent = currentUser && currentUser.role === 'admin' ? 'Loading teachers...' : 'Loading conversations...';
    }
    
    // For admin users, show teachers list instead of conversations
    if (currentUser && currentUser.role === 'admin') {
        updateTeachersList();
        return;
    }
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No conversations yet</p>
            </div>
        `;
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conversation => {
        const otherUser = currentUser.id === conversation.admin_id ? 
            conversation.teacher_username : conversation.admin_username;
        const otherClass = conversation.teacher_class || '';
        const isActive = currentConversation && (parseInt(currentConversation) === parseInt(conversation.id));
        console.log(`🔍 Conversation ${conversation.id}: isActive=${isActive}, currentConversation=${currentConversation}, conversation.id=${conversation.id}`);
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 onclick="selectConversation(${conversation.id})">
                <div class="conversation-info">
                    <div class="conversation-name">${otherUser}</div>
                    ${otherClass ? `<div class="conversation-class">${otherClass}</div>` : ''}
                </div>
                ${conversation.unread_count > 0 ? 
                    `<span class="unread-badge">${conversation.unread_count}</span>` : ''}
            </div>
        `;
    }).join('');
}

// Update teachers list for admin
function updateTeachersList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    if (teachers.length === 0) {
        conversationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No teachers available</p>
            </div>
        `;
        return;
    }
    
    conversationsList.innerHTML = teachers.map(teacher => {
        // Use teacher ID for consistent selection, regardless of conversation existence
        const isActive = currentTeacherId && (parseInt(currentTeacherId) === parseInt(teacher.id));
        
        return `
            <div class="conversation-item teacher-item ${isActive ? 'active' : ''}" 
                 onclick="startConversationWithTeacher(${teacher.id})">
                <div class="conversation-info">
                    <div class="conversation-name">${teacher.username}</div>
                    ${teacher.class_name ? `<div class="conversation-class">${teacher.class_name}</div>` : ''}
                </div>
                ${teacher.unread_count > 0 ? 
                    `<span class="unread-badge">${teacher.unread_count}</span>` : ''}
            </div>
        `;
    }).join('');
}

// Display messages in chat area
function displayMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
        console.error('❌ messagesContainer not found');
        return;
    }
    
    // Ensure input area is still visible after updating messages
    const inputContainer = document.getElementById('messageInput');
    if (inputContainer) {
        console.log('✅ Input area is visible before updating messages');
    } else {
        console.error('❌ Input area not found before updating messages');
    }
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    messagesContainer.innerHTML = messages.map(message => {
        const isOwn = message.sender_id === currentUser.id;
        const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Debug logging for message alignment
        console.log('🔍 Message alignment debug:', {
            messageId: message.id,
            messageContent: message.content.substring(0, 20) + '...',
            senderId: message.sender_id,
            currentUserId: currentUser.id,
            isOwn: isOwn,
            cssClass: isOwn ? 'own' : 'other'
        });
        
        return `
            <div class="message ${isOwn ? 'own' : 'other'}">
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Verify input area is still visible after updating messages
    setTimeout(() => {
        const inputContainerAfter = document.getElementById('messageInput');
        if (inputContainerAfter) {
            console.log('✅ Input area is still visible after updating messages');
        } else {
            console.error('❌ Input area disappeared after updating messages');
        }
    }, 100);
}

// Update conversation header
function updateConversationHeader(participant) {
    const conversationHeader = document.getElementById('conversationHeader');
    if (!conversationHeader) return;
    
    if (participant) {
        conversationHeader.innerHTML = `
            <div class="conversation-header-info">
                <h3>${participant.username}</h3>
                ${participant.class_name ? `<span class="conversation-class">${participant.class_name}</span>` : ''}
            </div>
        `;
    } else {
        conversationHeader.innerHTML = `
            <div class="conversation-header-info">
                <h3>Select a conversation</h3>
            </div>
        `;
    }
}

// Update unread count in navigation
async function updateUnreadCount() {
    try {
        const response = await fetch('/api/messages/unread-count', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            unreadCount = data.unread_count;
            
            // Update navigation badge (if it still exists)
            const navBadge = document.getElementById('messagesNavBadge');
            if (navBadge) {
                if (unreadCount > 0) {
                    navBadge.textContent = unreadCount;
                    navBadge.style.display = 'inline';
                } else {
                    navBadge.style.display = 'none';
                }
            }
            
            // Update main dashboard messaging card
            if (typeof window.updateMainMessagesCount === 'function') {
                window.updateMainMessagesCount(unreadCount);
            }
        }
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// Start auto-refresh for new messages
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // DISABLED: Heavy auto-refresh that causes input area to disappear
    // TODO: Implement real-time messaging with Server-Sent Events or WebSocket
    /*
    refreshInterval = setInterval(async () => {
        if (currentConversation) {
            await loadMessages(currentConversation);
        }
        await updateUnreadCount();
    }, 3000); // Refresh every 3 seconds
    */
    
    // AUTO-REFRESH DISABLED: Only refresh manually
    // User wants to refresh manually, not automatically poll the server
    /*
    refreshInterval = setInterval(async () => {
        await updateUnreadCount();
    }, 30000); // Refresh unread count every 30 seconds
    */
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Select conversation (called from HTML)
export function selectConversation(conversationId) {
    console.log('🔵 Selecting conversation:', conversationId, typeof conversationId);
    console.log('🔵 Current conversation before:', currentConversation, typeof currentConversation);
    
    // Ensure conversationId is a number for proper comparison
    conversationId = parseInt(conversationId);
    
    loadMessages(conversationId);
    // Force show input area when conversation is selected
    setTimeout(() => {
        forceShowInputArea();
    }, 100);
}

// Start conversation (called from HTML)
export function startConversationWithTeacher(teacherId) {
    startConversation(teacherId);
}

// Handle message input key press
export function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessageFromInput();
    }
}

// Send message from input field
export function sendMessageFromInput() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && messageInput.value.trim()) {
        sendMessage(messageInput.value.trim());
    }
}

// Clean up when messaging section is hidden
export function cleanupMessaging() {
    stopAutoRefresh();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if messaging section exists
    if (document.getElementById('messages')) {
        initializeMessaging();
    }
});

// Export functions for global access
window.selectConversation = selectConversation;
window.startConversation = startConversationWithTeacher;
window.handleMessageKeyPress = handleMessageKeyPress;
window.sendMessageFromInput = sendMessageFromInput;
