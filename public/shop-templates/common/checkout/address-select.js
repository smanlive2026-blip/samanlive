// LOCATION: common/checkout/address-select.js
class AddressSelect {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
    this.selected = null;
    this.api = `/api/user/addresses`; // existing user address API
  }

  async init(){
    await this.loadAddresses();
    document.getElementById('addrContinue')?.addEventListener('click', ()=> this.continueToPayment());
  }

  async loadAddresses(){
    const list = document.getElementById('addressList');
    try{
      const res = await fetch(`${this.api}?t=${Date.now()}`, { credentials:'include', cache:'no-store' });
      const data = await res.json();
      const addresses = data.addresses || data.data || [];

      if(addresses.length===0){
        // Show dummy address from location.js if available
        const loc = localStorage.getItem('userLocation');
        let locAddr = null;
        try{ locAddr = JSON.parse(loc); }catch(e){}

        list.innerHTML = `
          <div class="addr-card selected" data-id="current_location">
            <b>Current Location 📍</b>
            <p>${locAddr?.address || 'No saved address, add new'}</p>
          </div>
        `;
        this.selected = { _id:'current_location', fullAddress: locAddr?.address || 'Current Location' };
        this.enableContinue();
        this.bindSelect();
        return;
      }

      list.innerHTML = addresses.map(a=>`
        <div class="addr-card" data-id="${a._id}">
          <b>${a.name || a.fullName} • ${a.phone || ''}</b>
          <p>${a.house || ''}, ${a.area || ''}, ${a.city || ''} - ${a.pincode || ''}</p>
          <span style="font-size:10px;background:#f1f5f9;padding:2px 6px;border-radius:6px;font-weight:800">${a.type || 'HOME'}</span>
        </div>
      `).join('');
      this.bindSelect();

    }catch(e){
      console.error(e);
      document.getElementById('addressList').innerHTML = `<p style="text-align:center;color:#94a3b8;padding:20px">Failed to load addresses</p>`;
    }
  }

  bindSelect(){
    document.querySelectorAll('.addr-card').forEach(card=>{
      card.addEventListener('click', ()=>{
        document.querySelectorAll('.addr-card').forEach(c=> c.classList.remove('selected'));
        card.classList.add('selected');
        this.selected = { _id: card.dataset.id, fullAddress: card.innerText };
        this.enableContinue();
      });
    });
  }

  enableContinue(){
    const btn = document.getElementById('addrContinue');
    if(btn) btn.disabled =!this.selected;
  }

  continueToPayment(){
    if(!this.selected) return;
    // Save selected address id to pass to checkout
    localStorage.setItem('selectedAddressId', this.selected._id);
    localStorage.setItem('selectedAddressText', this.selected.fullAddress);
    window.location.href = `./payment-select.html?shopId=${this.shopId}&addressId=${this.selected._id}`;
  }

  openAddModal(){ document.getElementById('addAddrModal').style.display='grid'; }
  closeAddModal(){ document.getElementById('addAddrModal').style.display='none'; }

  async saveAddress(){
    const payload = {
      name: document.getElementById('addrName').value,
      phone: document.getElementById('addrPhone').value,
      house: document.getElementById('addrHouse').value,
      area: document.getElementById('addrArea').value,
      city: document.getElementById('addrCity').value,
      pincode: document.getElementById('addrPincode').value,
      type: 'HOME'
    };
    if(!payload.name ||!payload.phone ||!payload.house) return alert('Fill required fields');

    try{
      const res = await fetch(this.api, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.success){
        this.closeAddModal();
        this.loadAddresses();
      } else alert(data.message || 'Save failed');
    }catch(e){ console.error(e); alert('Error saving'); }
  }
}

window.AddressSelect = new AddressSelect();
document.addEventListener('DOMContentLoaded', ()=> window.AddressSelect.init());