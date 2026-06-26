// ========================================
// HELP & SUPPORT - FAQ + CONTACT LOGIC
// app.js se currentUser use karega
// ========================================

let currentUser = null;

// ========================================
// PAGE LOAD - Init
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // app.js se user check karo pehle
    if (window.currentUser) {
        currentUser = window.currentUser;
    } else {
        // Agar app.js me nahi mila to API se
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                window.currentUser = data.user;
            } else {
                localStorage.removeItem('userToken');
                window.location.href = '/';
                return;
            }
        } catch (err) {
            window.location.href = '/';
            return;
        }
    }

    // Load dynamic FAQ from server
    loadDynamicFAQ();
});

// ========================================
// LOAD DYNAMIC FAQ - API se
// ========================================
async function loadDynamicFAQ() {
    try {
        const res = await fetch('/api/help/faq');
        const data = await res.json();
        
        if (data.success && data.faqs && data.faqs.length > 0) {
            renderDynamicFAQ(data.faqs);
        }
    } catch (err) {
        console.log('Dynamic FAQ load failed, using static ones');
    }
}

function renderDynamicFAQ(faqs) {
    const faqSection = document.getElementById('faqSection');
    
    // Static FAQs ke upar dynamic add karo
    const dynamicHTML = faqs.map(faq => `
        <div class="faq-item">
            <div class="faq-question" onclick="toggleFAQ(this)">
                ${faq.question}
                <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-answer">
                ${faq.answer}
            </div>
        </div>
    `).join('');
    
    faqSection.insertAdjacentHTML('afterbegin', dynamicHTML);
}

// ========================================
// FAQ TOGGLE - Accordion
// ========================================
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');

    // Close all FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Open clicked FAQ if it wasn't active
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// ========================================
// SEARCH FAQ - Filter
// ========================================
function searchFAQ() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const faqItems = document.querySelectorAll('.faq-item');
    let visibleCount = 0;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

        if (question.includes(query) || answer.includes(query)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // No results message
    const faqSection = document.getElementById('faqSection');
    let noResultsEl = document.getElementById('noResultsMsg');
    
    if (visibleCount === 0 && query !== '') {
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.id = 'noResultsMsg';
            noResultsEl.style.cssText = 'text-align:center;padding:40px;color:#64748b;';
            noResultsEl.innerHTML = `
                <div style="font-size:48px;margin-bottom:12px;">🔍</div>
                <h3 style="color:#1e293b;margin-bottom:8px;">No results found</h3>
                <p>Try searching with different keywords or contact support</p>
            `;
            faqSection.appendChild(noResultsEl);
        }
    } else {
        if (noResultsEl) noResultsEl.remove();
    }
}

// ========================================
// CONTACT ACTIONS - Live Chat, Call, Email, WhatsApp
// ========================================
function startChat() {
    const userInfo = currentUser ? `\n\nUser: ${currentUser.name}\nPhone: ${currentUser.phone}` : '';
    alert(`💬 Live Chat\n\nConnecting you to our support team...${userInfo}\n\nFeature coming soon! We'll notify you when live chat is available.`);
    
    // Track event - future use
    trackSupportEvent('live_chat_clicked');
}

function callSupport() {
    if (confirm('📞 Call Support\n\n+91 1234567890\n\nAvailable: 9 AM - 9 PM, 7 days a week\n\nDo you want to call now?')) {
        window.location.href = 'tel:+911234567890';
        trackSupportEvent('phone_call_clicked');
    }
}

function openEmail() {
    const subject = currentUser 
        ? `Support Request from ${currentUser.name}` 
        : 'Support Request';
    
    const body = currentUser 
        ? `Hi Support Team,%0D%0A%0D%0AI need help with:%0D%0A%0D%0A%0D%0AUser Details:%0D%0AName: ${currentUser.name}%0D%0APhone: ${currentUser.phone}%0D%0AEmail: ${currentUser.email || 'N/A'}%0D%0A%0D%0AThanks!`
        : `Hi Support Team,%0D%0A%0D%0AI need help with:%0D%0A%0D%0A%0D%0AThanks!`;
    
    window.location.href = `mailto:support@samanlive.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    trackSupportEvent('email_clicked');
}

function openWhatsApp() {
    const userInfo = currentUser 
        ? `\n\nMy Details:\nName: ${currentUser.name}\nPhone: ${currentUser.phone}`
        : '';
    
    const message = `Hi, I need help with SAMANLIVE${userInfo}`;
    window.open(`https://wa.me/911234567890?text=${encodeURIComponent(message)}`, '_blank');
    trackSupportEvent('whatsapp_clicked');
}

// ========================================
// TRACK SUPPORT EVENTS - Analytics
// ========================================
function trackSupportEvent(eventType) {
    try {
        fetch('/api/analytics/support-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('userToken')
            },
            body: JSON.stringify({
                event: eventType,
                userId: currentUser?._id || 'guest',
                timestamp: new Date().toISOString()
            })
        });
    } catch (err) {
        console.log('Analytics tracking failed:', err);
    }
}

// ========================================
// KEYBOARD SHORTCUTS - UX
// ========================================
document.addEventListener('keydown', (e) => {
    // ESC to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput.value !== '') {
            searchInput.value = '';
            searchFAQ();
        }
    }
});

// ========================================
// AUTO FOCUS SEARCH - Better UX
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.innerWidth > 768) {
        setTimeout(() => searchInput.focus(), 500);
    }
});