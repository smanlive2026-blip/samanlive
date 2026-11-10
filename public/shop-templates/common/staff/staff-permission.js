// LOCATION: public/shop-templates/common/staff/staff-permission.js - V25 - UNIFIED - FULL CODE
// WORLD CLASS STAFF PERMISSION JS - FULL
// RULE: Permission = Server se hi aayega, Server pe hi save hoga. Is file me koi bhi browser storage use NAHI hoga.
// RULE 2: shopId SIRF URL se aayega. URL me nahi hai toh galat shop ki permission kabhi nahi kholega.
// RULE 3: Permission pehle Server pe save hogi, phir UI me dikhegi. Server pe fail hui toh purani permission hi rahegi.
// FLOW: Load Staff -> GET /api/common/staff/:shopId -> Select Staff -> Show Permissions -> Save -> PUT /api/common/staff/:shopId/:staffId/permissions -> Socket emit -> dobara Server se Load
// FIX V25: Pehle is file me staff + permission browser storage se aate the, aur save bhi browser storage me hota tha. Ab FULL Server only hai.
class StaffPermission {
  constructor(){
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.staff = [];
    this.permissions = [
      { id:'orders', name:'Orders', desc:'View & manage orders', icon:'📦', category:'sales' },
      { id:'inventory', name:'Inventory', desc:'Manage stock & products', icon:'📦', category:'sales' },
      { id:'billing', name:'Billing', desc:'Create bills & payments', icon:'💵', category:'sales' },
      { id:'delivery', name:'Delivery', desc:'Deliver orders & update status', icon:'🛵', category:'sales' },
      { id:'customers', name:'Customers', desc:'View customers', icon:'👥', category:'management' },
      { id:'marketing', name:'Marketing', desc:'Coupons, offers, loyalty', icon:'📢', category:'marketing' },
      { id:'finance', name:'Finance', desc:'View revenue & expenses', icon:'💰', category:'management' },
      { id:'staff', name:'Staff', desc:'Manage staff members', icon:'👔', category:'management' },
      { id:'settings', name:'Settings', desc:'Shop settings & configuration', icon:'⚙️', category:'management' },
      { id:'analytics', name:'Analytics', desc:'View analytics & reports', icon:'📊', category:'analytics' },
      { id:'support', name:'Support', desc:'Customer support & chat', icon:'💬', category:'support' }
    ];
    this.roleTemplates = {
      manager:{ name:'Manager', perms:['orders','inventory','billing','delivery','customers','marketing','finance','staff','settings','analytics','support'], desc:'Full access to everything' },
      cashier:{ name:'Cashier', perms:['orders','billing','customers'], desc:'Billing and orders only' },
      delivery:{ name:'Delivery Boy', perms:['delivery','orders'], desc:'Delivery and orders only' },
      helper:{ name:'Helper', perms:['orders'], desc:'Orders viewing only' },
      marketing:{ name:'Marketing', perms:['marketing','customers','analytics'], desc:'Marketing and customers' }
    };
  }

  getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    return window.USER_TOKEN || '';
  }
  getUserId(){
    try{ if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || ''; }catch(e){}
    if(window.currentUser && window.currentUser._id) return window.currentUser._id;
    return '';
  }
  getHeaders(){
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken(), 'x-buyer-id': this.getUserId() };
  }

  async init(){
    await this.loadStaff();
    this.renderPermissions();
    this.bindEvents();
  }

  async loadStaff(){
    try{
      if(!this.shopId){
        if(window.Toast) Toast.show('Shop not found - URL me ?shopId=XXX hona chahiye', 'error');
        this.staff = [];
        return;
      }

      let staff = null;
      // 1. ApiCore se - HAMESHA Server se
      if(window.ApiCore){
        try{
          const data = await window.ApiCore.get(`/api/common/staff/${this.shopId}`);
          staff = data.staff || data || null;
        }catch(e){ staff = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi mangenge
      if(!staff){
        try{
          const res = await fetch(`/api/common/staff/${this.shopId}`, { headers: this.getHeaders() }).then(r=>r.json()).catch(()=>null);
          if(res) staff = res.staff || res;
        }catch(e){}
      }
      // 3. NO Browser storage fallback - Server se nahi mila toh khaali hi rahega, purana galat staff KABHI nahi dikhega
      this.staff = Array.isArray(staff) ? staff : [];

      const staffSelect = document.getElementById('permissionStaffSelect');
      if(staffSelect){
        staffSelect.innerHTML = `<option value="">Select staff member</option>` + this.staff.map(s=> `<option value="${s._id}">${s.name} • ${s.role}</option>`).join('');

        const urlStaffId = new URLSearchParams(location.search).get('staffId');
        if(urlStaffId) staffSelect.value = urlStaffId;
      }

      if(staffSelect && staffSelect.value){
        this.loadStaffPermissions(staffSelect.value);
      }

    }catch(e){ this.staff = []; }
  }

  renderPermissions(){
    const container = document.getElementById('permissionsGrid');
    if(!container) return;

    const categories = { sales:'💼 Sales', management:'👔 Management', marketing:'📢 Marketing', analytics:'📊 Analytics', support:'💬 Support' };

    container.innerHTML = Object.entries(categories).map(([cat, catName])=>{
      const catPerms = this.permissions.filter(p=> p.category===cat);

      return `
        <div class="perm-category">
          <b>${catName}</b>
          <div class="perm-list">
            ${catPerms.map(perm=>`
              <div class="perm-item" data-perm="${perm.id}">
                <input type="checkbox" id="perm_${perm.id}" value="${perm.id}">
                <label for="perm_${perm.id}">
                  <span class="perm-icon">${perm.icon}</span>
                  <div>
                    <b>${perm.name}</b>
                    <span>${perm.desc}</span>
                  </div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  loadStaffPermissions(staffId){
    const staff = this.staff.find(s=> s._id===staffId);
    if(!staff){
      if(window.Toast) Toast.show('Staff not found on Server', 'error');
      return;
    }

    // Uncheck all
    document.querySelectorAll('.perm-item input').forEach(cb=> cb.checked=false);

    // Check staff permissions - sirf Server se aayi hui permission
    (staff.permissions||[]).forEach(perm=>{
      const checkbox = document.getElementById(`perm_${perm}`);
      if(checkbox) checkbox.checked = true;
    });

    // Update role template selection
    document.querySelectorAll('.role-template').forEach(template=>{
      template.classList.remove('selected');
      if(template.dataset.role===staff.role){
        template.classList.add('selected');
      }
    });

    const staffNameEl = document.getElementById('selectedStaffName');
    if(staffNameEl) staffNameEl.innerText = `${staff.name} • ${staff.role}`;
  }

  applyRoleTemplate(role){
    const template = this.roleTemplates[role];
    if(!template) return;

    document.querySelectorAll('.perm-item input').forEach(cb=> cb.checked=false);

    template.perms.forEach(perm=>{
      const checkbox = document.getElementById(`perm_${perm}`);
      if(checkbox) checkbox.checked = true;
    });

    document.querySelectorAll('.role-template').forEach(t=> t.classList.remove('selected'));
    document.querySelector(`[data-role="${role}"]`)?.classList.add('selected');

    if(window.Toast) Toast.show(`Applied ${template.name} template: ${template.desc}`, 'info');
  }

  getSelectedPermissions(){
    const perms = [];
    document.querySelectorAll('.perm-item input:checked').forEach(cb=> perms.push(cb.value));
    return perms;
  }

  async savePermissions(){
    if(!this.shopId){
      if(window.Toast) Toast.show('Shop not found - URL me ?shopId=XXX hona chahiye', 'error');
      return;
    }
    const staffSelect = document.getElementById('permissionStaffSelect');
    const staffId = staffSelect?.value;

    if(!staffId){
      if(window.Toast) Toast.show('Select staff member first', 'warning');
      return;
    }

    const permissions = this.getSelectedPermissions();
    const prevStaff = this.staff.find(s=> s._id===staffId);
    const prevPermissions = prevStaff ? [...(prevStaff.permissions || [])] : [];

    if(permissions.length===0){
      if(!confirm('No permissions selected. Staff will have no access. Continue?')) return;
    }

    const btn = document.getElementById('savePermissionsBtn');
    if(btn){ btn.innerText='Saving...'; btn.disabled=true; }

    try{
      let saved = false;
      // 1. ApiCore se - HAMESHA Server pe
      if(window.ApiCore){
        try{ await window.ApiCore.put(`/api/common/staff/${this.shopId}/${staffId}/permissions`, { permissions, shopId: this.shopId }); saved = true; }catch(e){ saved = false; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server pe hi save hoga
      if(!saved){
        const res = await fetch(`/api/common/staff/${this.shopId}/${staffId}/permissions`, { method:'PUT', headers: this.getHeaders(), body: JSON.stringify({ permissions, shopId: this.shopId }) }).then(r=>r.json()).catch(()=>null);
        if(res && (res.success || res.staff || res.permissions || !res.error)) saved = true;
      }
      // 3. Server pe save nahi hua toh dhokha nahi denge - purani permission hi rahegi, browser storage me save karke "saved" nahi bolenge
      if(!saved){
        if(window.Toast) Toast.show('❌ Server me save nahi hua - Permission change nahi hui', 'error');
        // UI ko purani permission pe wapas le jao
        if(prevStaff) this.loadStaffPermissions(staffId);
        return;
      }

      // Save ke baad turant Server se dobara mang ke verify karo - tabhi this.staff update hoga
      await this.loadStaff();
      if(staffSelect) staffSelect.value = staffId;
      this.loadStaffPermissions(staffId);

      if(window.Toast) Toast.show(`Permissions saved for ${this.staff.find(s=> s._id===staffId)?.name||'staff'} ✅`, 'success');

      if(window.SocketCore){
        try{ window.SocketCore.emit('staff-permissions-updated', { shopId: this.shopId, staffId, permissions }); }catch(e){}
      }

    }catch(e){
      if(window.Toast) Toast.show('Failed to save permissions - Server error', 'error');
      // Fail hua toh UI ko purani permission pe wapas le jao
      if(prevStaff){
        const idx = this.staff.findIndex(s=> s._id===staffId);
        if(idx >= 0) this.staff[idx].permissions = prevPermissions;
        this.loadStaffPermissions(staffId);
      }
    }finally{
      if(btn){ btn.innerText='Save Permissions 🔐'; btn.disabled=false; }
    }
  }

  bindEvents(){
    document.getElementById('permissionStaffSelect')?.addEventListener('change', (e)=>{
      if(e.target.value){
        this.loadStaffPermissions(e.target.value);
      }
    });

    document.querySelectorAll('.role-template').forEach(template=>{
      template.addEventListener('click', ()=>{
        this.applyRoleTemplate(template.dataset.role);
      });
    });

    document.getElementById('savePermissionsBtn')?.addEventListener('click', ()=> this.savePermissions());
    document.getElementById('selectAllPerms')?.addEventListener('click', ()=>{
      document.querySelectorAll('.perm-item input').forEach(cb=> cb.checked=true);
    });
    document.getElementById('clearAllPerms')?.addEventListener('click', ()=>{
      document.querySelectorAll('.perm-item input').forEach(cb=> cb.checked=false);
    });
  }
}

window.StaffPermissionInstance = new StaffPermission();
document.addEventListener('DOMContentLoaded', ()=> window.StaffPermissionInstance.init());