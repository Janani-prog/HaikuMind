// Message history for context
let messageHistory = [];

// DOM Content Loaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Add Enter key support
    document.getElementById('userInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Clear chat functionality
    document.getElementById('clearChat').addEventListener('click', function() {
        const chatBody = document.getElementById('chatBody');
        chatBody.innerHTML = `
            <div class="message-container">
                <div class="bot-message">
                    Hello! I'm your friendly AI assistant. How can I help you today?
                </div>
                <p class="message-meta ms-2">Bot • Just now</p>
            </div>
        `;
        messageHistory = [];
    });
});

// Suggest a question from the quick buttons
function suggestQuestion(question) {
    document.getElementById('userInput').value = question;
    // Optional: Auto-send the suggested question
    // sendMessage();
}

// Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Add a message to the chat UI
function addMessage(content, isUser = false) {
    const chatBody = document.getElementById('chatBody');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-container';
    
    const messageContent = document.createElement('div');
    messageContent.className = isUser ? 'user-message' : 'bot-message';
    
    if (isUser) {
        messageContent.textContent = content;
    } else {
        // Parse markdown for bot responses
        messageContent.innerHTML = content;
    }
    
    const metaInfo = document.createElement('p');
    metaInfo.className = isUser ? 'message-meta text-end me-2' : 'message-meta ms-2';
    metaInfo.textContent = `${isUser ? 'You' : 'Bot'} • ${getCurrentTime()}`;
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(metaInfo);
    chatBody.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Add loading indicator dots
function addLoadingIndicator() {
    const chatBody = document.getElementById('chatBody');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message-container';
    loadingDiv.id = 'loadingIndicator';
    
    const loadingContent = document.createElement('div');
    loadingContent.className = 'bot-message';
    loadingContent.innerHTML = `
        <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    
    loadingDiv.appendChild(loadingContent);
    chatBody.appendChild(loadingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Send message to the backend
async function sendMessage() {
    const input = document.getElementById('userInput').value.trim();
    const askButton = document.getElementById('askButton');
    
    if (!input) {
        return;
    }
    
    // Add user message to chat
    addMessage(input, true);
    
    // Clear input field
    document.getElementById('userInput').value = '';
    
    // Add user message to history
    messageHistory.push({ role: 'user', content: input });
    
    // Show loading indicator
    addLoadingIndicator();
    askButton.disabled = true;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3-5-haiku:beta',
                messages: messageHistory,
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const botResponse = data.choices[0].message.content;
            
            // Add bot response to chat
            addMessage(botResponse);
            
            // Add bot response to history
            messageHistory.push({ role: 'assistant', content: botResponse });
        } else {
            addMessage("I'm sorry, I couldn't process your request at the moment. Please try again later.");
        }
    } catch (error) {
        console.error("Error:", error);
        removeLoadingIndicator();
        
        addMessage(`
            I'm sorry, there was an error processing your request:
            
            ${error.message}
            
            Please try again or check your connection.
        `);
    } finally {
        askButton.disabled = false;
        // Focus on input
        document.getElementById('userInput').focus();
    }
}