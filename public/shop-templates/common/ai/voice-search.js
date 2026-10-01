// LOCATION: common/ai/voice-search.js - WEB SPEECH API - WORLD CLASS
function startVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ alert('Voice not supported in this browser'); return; }
  const rec = new SpeechRecognition();
  rec.lang = 'hi-IN';
  rec.interimResults = false;
  document.getElementById('result').innerText = 'Sun raha hu... bolo';
  rec.start();
  rec.onresult = async (e)=>{
    const text = e.results[0][0].transcript;
    document.getElementById('result').innerText = `You said: "${text}"`;
    // Search products
    const shopId = new URLSearchParams(location.search).get('shopId');
    try{
      const res = await fetch(`/api/common/ai/voice-search/${shopId}?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const box = document.getElementById('products');
      if(data.products?.length){
        box.innerHTML = data.products.map(p=>`<div style="background:#fff;color:#000;padding:10px;border-radius:10px;margin:6px">${p.name} - ₹${p.price}</div>`).join('');
      }else{
        box.innerHTML = '<p>No products found</p>';
      }
    }catch(err){ console.log(err); }
  };
  rec.onerror = ()=>{ document.getElementById('result').innerText = 'Mic error - try again'; };
}