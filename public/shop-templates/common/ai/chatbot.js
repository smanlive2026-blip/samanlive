// LOCATION: common/ai/chatbot.js - WORLD CLASS AI CHATBOT - API ONLY
class AIChatbot {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.box = document.getElementById('chatBox');
    this.input = document.getElementById('chatInput');
    this.api = '/api/common/ai/chat';
  }
  async sendMsg(){
    const text = this.input.value.trim();
    if(!text) return;
    this.addMsg(text, 'user');
    this.input.value = '';
    this.addMsg('Typing...', 'ai', true);
    try{
      const res = await fetch(this.api, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ shopId: this.shopId, message: text })
      });
      const data = await res.json();
      this.removeTyping();
      this.addMsg(data.reply || 'Sorry, samajh nahi aaya. Dobara bolo?', 'ai');
    }catch(e){
      this.removeTyping();
      this.addMsg('Network error. Fir se try karo.', 'ai');
    }
  }
  addMsg(t, who, isTyping=false){
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    if(isTyping) div.id='typing';
    div.innerText = t;
    this.box.appendChild(div);
    this.box.scrollTop = this.box.scrollHeight;
  }
  removeTyping(){ document.getElementById('typing')?.remove(); }
}
const bot = new AIChatbot();
window.sendMsg = () => bot.sendMsg();