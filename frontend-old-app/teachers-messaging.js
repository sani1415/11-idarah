// Teachers Messaging System
// Separate module for messaging functionality in Teachers Corner

let currentUser = null;
let unreadCount = 0;
let refreshInterval = null;
let preservedInputContent = ''; // Global variable to preserve input content
let cursorPosition = 0; // Global variable to preserve cursor position

// Initialize teachers messaging
export async function initializeTeachersMessaging() {
    try {
        // Get current user info
        const userResponse = await fetch('/api/auth/user', {
            credentials: 'include'
        });
        if (userResponse.ok) {
            currentUser = await userResponse.json();
            console.log('📱 Teachers messaging - Current user:', currentUser);
        }
        
        // Load conversations and update unread count
        await loadUserConversations();
        await updateUnreadCount();
        
        // Start auto-refresh
        startAutoRefresh();
        
        console.log('📱 Teachers messaging system initialized');
    } catch (error) {
        console.error('Error initializing teachers messaging:', error);
    }
}

// Load conversations for current user (teacher)
async function loadUserConversations(preserveExpandedState = false) {
    try {
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (response.ok) {
            const conversations = await response.json();
            
            // Check if widget is currently expanded
            const messagingWidget = document.getElementById('teachersMessagingWidget');
            const isExpanded = messagingWidget && messagingWidget.classList.contains('expanded');
            
            updateTeachersMessagingWidget(conversations);
            
            // If widget was expanded and we want to preserve state, re-expand it
            if (preserveExpandedState && isExpanded) {
                setTimeout(() => {
                    const newWidget = document.getElementById('teachersMessagingWidget');
                    if (newWidget) {
                        newWidget.classList.add('expanded');
                        loadInlineMessagingInterface();
                    }
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Update the messaging widget in Teachers Corner
function updateTeachersMessagingWidget(conversations) {
    const messagingWidget = document.getElementById('teachersMessagingWidget');
    if (!messagingWidget) return;
    
    // If widget is expanded, don't update the content to preserve the expanded state
    if (messagingWidget.classList.contains('expanded')) {
        console.log('🔄 Widget is expanded, skipping content update to preserve state');
        return;
    }
    
    // Find conversation with admin
    const adminConversation = conversations.find(c => 
        (currentUser.id === c.admin_id && c.teacher_id) || 
        (currentUser.id === c.teacher_id && c.admin_id)
    );
    
    if (adminConversation) {
        const otherUser = currentUser.id === adminConversation.admin_id ? 
            adminConversation.teacher_username : adminConversation.admin_username;
        
        messagingWidget.innerHTML = `
            <div class="messaging-widget">
                <div class="widget-header">
                    <h4><i class="fas fa-comments"></i> Messages</h4>
                    ${adminConversation.unread_count > 0 ? 
                        `<span class="unread-badge">${adminConversation.unread_count}</span>` : ''}
                </div>
                <div class="widget-content">
                    <div class="conversation-info">
                        <p><strong>Admin:</strong> ${otherUser}</p>
                        <p><strong>Status:</strong> ${adminConversation.unread_count > 0 ? 'New messages' : 'All read'}</p>
                    </div>
                    <div class="widget-actions">
                        <button onclick="openTeachersMessaging()" class="btn btn-primary btn-sm">
                            <i class="fas fa-comment"></i> Open Messages
                        </button>
                        ${adminConversation.unread_count > 0 ? 
                            `<button onclick="markConversationAsRead(${adminConversation.id})" class="btn btn-secondary btn-sm">
                                <i class="fas fa-check"></i> Mark Read
                            </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        messagingWidget.innerHTML = `
            <div class="messaging-widget">
                <div class="widget-header">
                    <h4><i class="fas fa-comments"></i> Messages</h4>
                </div>
                <div class="widget-content">
                    <div class="conversation-info">
                        <p>No messages yet</p>
                        <p>Start a conversation with admin</p>
                    </div>
                    <div class="widget-actions">
                        <button onclick="openTeachersMessaging()" class="btn btn-primary btn-sm">
                            <i class="fas fa-comment-plus"></i> Start Conversation
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Open messaging section - expand the widget to show inline chat
export function openTeachersMessaging() {
    console.log('🔄 openTeachersMessaging called');
    
    const messagingWidget = document.getElementById('teachersMessagingWidget');
    console.log('🔍 messagingWidget found:', !!messagingWidget);
    
    if (!messagingWidget) {
        console.error('❌ teachersMessagingWidget not found');
        // Try to find the container and render the widget first
        const container = document.getElementById('teachersMessagingWidgetContainer');
        if (container) {
            console.log('🔄 Rendering widget first...');
            if (typeof window.renderTeachersMessagingWidget === 'function') {
                window.renderTeachersMessagingWidget();
                // Try again after a short delay
                setTimeout(() => {
                    const newWidget = document.getElementById('teachersMessagingWidget');
                    if (newWidget) {
                        newWidget.classList.add('expanded');
                        loadInlineMessagingInterface();
                    }
                }, 100);
            }
        }
        return;
    }
    
    // Toggle between compact and expanded view
    const isExpanded = messagingWidget.classList.contains('expanded');
    console.log('🔍 isExpanded:', isExpanded);
    
    if (isExpanded) {
        // Collapse back to compact view
        messagingWidget.classList.remove('expanded');
        // Reload the widget with compact view
        loadUserConversations();
        console.log('✅ Collapsed to compact view');
    } else {
        // Expand to show inline chat
        messagingWidget.classList.add('expanded');
        loadInlineMessagingInterface();
        console.log('✅ Expanded to inline chat view');
    }
}

// Load inline messaging interface
export async function loadInlineMessagingInterface(preserveInput = false) {
    try {
        // Preserve current input content if requested
        let currentInputContent = '';
        if (preserveInput) {
            // Use global preserved content or current input
            currentInputContent = preservedInputContent || '';
            console.log('💾 Preserving input content:', currentInputContent);
        } else {
            // Clear preserved content when not preserving
            preservedInputContent = '';
        }
        
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (response.ok) {
            const conversations = await response.json();
            
            // Find conversation with admin
            const adminConversation = conversations.find(c => 
                (currentUser.id === c.admin_id && c.teacher_id) || 
                (currentUser.id === c.teacher_id && c.admin_id)
            );
            
            const messagingWidget = document.getElementById('teachersMessagingWidget');
            if (!messagingWidget) return;
            
            if (adminConversation) {
                // Load messages for this conversation
                const messagesResponse = await fetch(`/api/messages/${adminConversation.id}`, {
                    credentials: 'include'
                });
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    renderInlineChatInterface(adminConversation, messages, currentInputContent);
                }
            } else {
                // Auto-start conversation with admin instead of showing start interface
                console.log('🔄 No admin conversation found, auto-starting conversation');
                await startConversationWithAdmin();
            }
        }
    } catch (error) {
        console.error('Error loading inline messaging interface:', error);
    }
}

// Render inline chat interface
function renderInlineChatInterface(conversation, messages, preservedInput = '') {
    const messagingWidget = document.getElementById('teachersMessagingWidget');
    if (!messagingWidget) return;
    
    // Check if we already have a chat interface and preserve the input content
    const existingInput = document.getElementById('inlineMessageInput');
    const currentInputValue = existingInput ? existingInput.value : preservedInput || preservedInputContent || '';
    
    // Only log when there's significant content to preserve
    if (currentInputValue && currentInputValue.length > 5) {
        console.log('🔄 Rendering chat interface with preserved content:', currentInputValue);
    }
    
    const otherUser = currentUser.id === conversation.admin_id ? 
        conversation.teacher_username : conversation.admin_username;
    
    messagingWidget.innerHTML = `
        <div class="inline-chat-container">
            <div class="inline-chat-header">
                <h4><i class="fas fa-comments"></i> Chat with ${otherUser}</h4>
                <!-- Close button removed - handled by parent container -->
            </div>
            <div class="inline-chat-messages" id="inlineChatMessages">
                ${messages.map(message => `
                    <div class="message ${message.sender_id === currentUser.id ? 'own' : 'other'}">
                        <div class="message-content">
                            <div class="message-text">${message.content}</div>
                            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="inline-chat-input">
                <textarea id="inlineMessageInput" placeholder="Type your message..." data-conversation-id="${conversation.id}">${currentInputValue}</textarea>
                <button onclick="sendInlineMessage(${conversation.id})" class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Scroll to bottom
    const messagesContainer = document.getElementById('inlineChatMessages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add proper event listeners for the textarea
    const textarea = document.getElementById('inlineMessageInput');
    if (textarea) {
        // Remove any existing event listeners and attributes
        textarea.onkeypress = null;
        textarea.onkeydown = null;
        textarea.onkeyup = null;
        textarea.oninput = null;
        
        // Clear any existing event listeners
        const newTextarea = textarea.cloneNode(true);
        textarea.parentNode.replaceChild(newTextarea, textarea);
        
        // Add proper keypress event listener to the new element
        newTextarea.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const conversationId = newTextarea.getAttribute('data-conversation-id');
                if (conversationId) {
                    sendInlineMessage(parseInt(conversationId));
                }
            }
        });
        
        // Add input event listener to preserve content and cursor position
        newTextarea.addEventListener('input', (event) => {
            preservedInputContent = event.target.value;
            cursorPosition = event.target.selectionStart;
            // Only log when content changes significantly (every 10 characters)
            if (preservedInputContent.length % 10 === 0) {
                console.log('💾 Input content preserved:', preservedInputContent);
            }
        });
        
        // Restore focus and cursor position if there was content
        if (currentInputValue) {
            setTimeout(() => {
                newTextarea.focus();
                // Set cursor to preserved position or end of text
                const position = cursorPosition > 0 ? cursorPosition : newTextarea.value.length;
                newTextarea.setSelectionRange(position, position);
            }, 50);
        }
        
        console.log('✅ Event listeners added to textarea (cleaned)');
    }
}

// Start conversation with admin automatically
async function startConversationWithAdmin() {
    try {
        console.log('🔄 Auto-starting conversation with admin');
        
        // Get admin user
        const adminResponse = await fetch('/api/users/admin', {
            credentials: 'include'
        });
        
        if (adminResponse.ok) {
            const admin = await adminResponse.json();
            
            // Start conversation
            const startResponse = await fetch('/api/messages/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    recipient_id: admin.id,
                    message: 'Hello!'
                })
            });
            
            if (startResponse.ok) {
                const result = await startResponse.json();
                console.log('✅ Conversation started with admin:', result);
                
                // Reload the interface to show the new conversation
                await loadInlineMessagingInterface();
            }
        }
    } catch (error) {
        console.error('Error starting conversation with admin:', error);
        // Fallback: show start conversation interface
        renderStartConversationInterface();
    }
}

// Render start conversation interface
function renderStartConversationInterface(preservedInput = '') {
    const messagingWidget = document.getElementById('teachersMessagingWidget');
    if (!messagingWidget) return;
    
    // Check if we already have a chat interface and preserve the input content
    const existingInput = document.getElementById('inlineMessageInput');
    const currentInputValue = existingInput ? existingInput.value : preservedInput || preservedInputContent || '';
    
    // Only log when there's significant content to preserve
    if (currentInputValue && currentInputValue.length > 5) {
        console.log('🔄 Rendering start conversation with preserved content:', currentInputValue);
    }
    
    messagingWidget.innerHTML = `
        <div class="inline-chat-container">
            <div class="inline-chat-header">
                <h4><i class="fas fa-comments"></i> Start Conversation</h4>
                <!-- Close button removed - handled by parent container -->
            </div>
            <div class="start-conversation-content">
                <p>Send a message to admin to start a conversation</p>
                <div class="inline-chat-input">
                    <textarea id="inlineMessageInput" placeholder="Type your message to admin..." data-new-message="true">${currentInputValue}</textarea>
                    <button onclick="sendNewMessage()" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add proper event listeners for the textarea
    const textarea = document.getElementById('inlineMessageInput');
    if (textarea) {
        // Remove any existing event listeners and attributes
        textarea.onkeypress = null;
        textarea.onkeydown = null;
        textarea.onkeyup = null;
        textarea.oninput = null;
        
        // Clear any existing event listeners
        const newTextarea = textarea.cloneNode(true);
        textarea.parentNode.replaceChild(newTextarea, textarea);
        
        // Add proper keypress event listener to the new element
        newTextarea.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendNewMessage();
            }
        });
        
        // Add input event listener to preserve content and cursor position
        newTextarea.addEventListener('input', (event) => {
            preservedInputContent = event.target.value;
            cursorPosition = event.target.selectionStart;
            // Only log when content changes significantly (every 10 characters)
            if (preservedInputContent.length % 10 === 0) {
                console.log('💾 New message input content preserved:', preservedInputContent);
            }
        });
        
        // Restore focus and cursor position if there was content
        if (currentInputValue) {
            setTimeout(() => {
                newTextarea.focus();
                // Set cursor to preserved position or end of text
                const position = cursorPosition > 0 ? cursorPosition : newTextarea.value.length;
                newTextarea.setSelectionRange(position, position);
            }, 50);
        }
        
        console.log('✅ Event listeners added to new message textarea (cleaned)');
    }
}

// Send message in inline chat
window.sendInlineMessage = async function(conversationId) {
    console.log('🔄 sendInlineMessage called with conversationId:', conversationId);
    
    const input = document.getElementById('inlineMessageInput');
    const content = input.value.trim();
    
    if (!content) {
        console.log('❌ No content to send');
        return;
    }
    
    // Find the receiver ID from the conversation
    let receiverId = null;
    try {
        const conversationsResponse = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (conversationsResponse.ok) {
            const conversations = await conversationsResponse.json();
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                // Determine receiver ID based on current user
                receiverId = currentUser.id === conversation.admin_id ? conversation.teacher_id : conversation.admin_id;
                console.log('👥 Receiver ID found:', receiverId);
            }
        }
    } catch (error) {
        console.error('❌ Error finding receiver ID:', error);
    }
    
    if (!receiverId) {
        console.error('❌ Could not find receiver ID for conversation:', conversationId);
        showNotification('Could not find receiver', 'error');
        return;
    }
    
    console.log('📤 Sending message:', { conversation_id: conversationId, receiver_id: receiverId, content: content });
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                receiver_id: receiverId,
                content: content
            })
        });
        
        console.log('📨 Response status:', response.status);
        console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            console.log('✅ Message sent successfully');
            input.value = '';
            
            // Instead of reloading entire interface, just reload messages
            await reloadMessagesOnly();
            showNotification('Message sent successfully', 'success');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to send message:', response.status, errorText);
            showNotification(`Failed to send message: ${response.status} ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        showNotification('Failed to send message: ' + error.message, 'error');
    }
};

// Reload only messages without affecting input area (like admin messaging)
async function reloadMessagesOnly() {
    try {
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (response.ok) {
            const conversations = await response.json();
            
            // Find conversation with admin
            const adminConversation = conversations.find(c => 
                (currentUser.id === c.admin_id && c.teacher_id) || 
                (currentUser.id === c.teacher_id && c.admin_id)
            );
            
            if (adminConversation) {
                // Load messages for this conversation
                const messagesResponse = await fetch(`/api/messages/${adminConversation.id}`, {
                    credentials: 'include'
                });
                if (messagesResponse.ok) {
                    const messages = await messagesResponse.json();
                    
                    // Update only the messages area, not the entire interface
                    const messagesContainer = document.getElementById('inlineChatMessages');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = messages.map(message => `
                            <div class="message ${message.sender_id === currentUser.id ? 'own' : 'other'}">
                                <div class="message-content">
                                    <div class="message-text">${message.content}</div>
                                    <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        `).join('');
                        
                        // Auto-scroll to bottom
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error reloading messages:', error);
    }
}

// Send new message (start conversation)
window.sendNewMessage = async function() {
    console.log('🔄 sendNewMessage called');
    
    const input = document.getElementById('inlineMessageInput');
    const content = input.value.trim();
    
    if (!content) {
        console.log('❌ No content to send');
        return;
    }
    
    console.log('📤 Sending new message:', content);
    
    try {
        // FIXED: Teachers can send messages directly without needing to fetch admin ID
        // The backend will automatically determine the receiver based on the sender's role
        // If sender is a teacher, message goes to admin
        // If sender is admin, receiver_id must be specified
        
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                content: content
                // receiver_id is optional for teachers - backend will route to admin
            })
        });
        
        console.log('📨 New message response status:', response.status);
        
        if (response.ok) {
            console.log('✅ New message sent successfully');
            input.value = '';
            
            // Instead of reloading entire interface, just reload messages
            await reloadMessagesOnly();
            showNotification('Message sent successfully', 'success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to send new message:', response.status, errorData);
            showNotification(errorData.error || `Failed to send message: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error sending new message:', error);
        showNotification('Failed to send message: ' + error.message, 'error');
    }
};

// Mark conversation as read
export async function markConversationAsRead(conversationId) {
    try {
        const response = await fetch(`/api/messages/${conversationId}`, {
            credentials: 'include'
        });
        if (response.ok) {
            // This will automatically mark messages as read
            await loadUserConversations();
            await updateUnreadCount();
            showNotification('Messages marked as read', 'success');
        }
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        showNotification('Failed to mark messages as read', 'error');
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
            
            // Update navigation badge
            const navBadge = document.getElementById('messagesNavBadge');
            if (navBadge) {
                if (unreadCount > 0) {
                    navBadge.textContent = unreadCount;
                    navBadge.style.display = 'inline';
                } else {
                    navBadge.style.display = 'none';
                }
            }
            
            // Update Teachers Corner messages card count
            if (typeof window.updateMessagesCount === 'function') {
                console.log('📱 Calling updateMessagesCount with unreadCount:', unreadCount);
                window.updateMessagesCount(unreadCount);
            } else {
                console.log('❌ window.updateMessagesCount function not found');
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
    
    // DISABLED: Heavy auto-refresh that causes UI flicker and performance issues
    // TODO: Implement real-time messaging with Server-Sent Events or WebSocket
    /*
    refreshInterval = setInterval(async () => {
        await loadUserConversations(true); // Preserve expanded state during auto-refresh
        
        // If widget is expanded, refresh the inline chat interface BUT preserve input content
        const messagingWidget = document.getElementById('teachersMessagingWidget');
        if (messagingWidget && messagingWidget.classList.contains('expanded')) {
            await loadInlineMessagingInterface(true); // Preserve input content during auto-refresh
        }
        
        await updateUnreadCount();
    }, 5000); // Refresh every 5 seconds
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
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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

// Render messaging widget HTML for Teachers Corner
export function renderMessagingWidget() {
    return `
        <div class="messaging-widget-container">
            <div class="widget-header">
                <h3><i class="fas fa-comments"></i> Quick Messaging</h3>
            </div>
            <div id="teachersMessagingWidget" class="messaging-widget-content">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading messages...</p>
                </div>
            </div>
        </div>
    `;
}

// Clean up when leaving Teachers Corner
export function cleanupTeachersMessaging() {
    stopAutoRefresh();
}

// Global input preservation mechanism
document.addEventListener('input', (event) => {
    // Only preserve content from messaging textareas
    if (event.target && event.target.id === 'inlineMessageInput') {
        preservedInputContent = event.target.value;
        // Only log when content changes significantly (every 10 characters)
        if (preservedInputContent.length % 10 === 0) {
            console.log('💾 Global input preservation:', preservedInputContent);
        }
    }
});

// Initialize when Teachers Corner loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if Teachers Corner section exists
    if (document.getElementById('teachers-corner-section')) {
        // Initialize after a short delay to ensure other modules are loaded
        setTimeout(() => {
            initializeTeachersMessaging();
        }, 1000);
    }
});

// Functions are now exported above, no need for window assignments here
