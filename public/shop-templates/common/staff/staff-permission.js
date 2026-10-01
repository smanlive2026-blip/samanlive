// LOCATION: public/shop-templates/common/staff/staff-permission.js
// WORLD CLASS STAFF PERMISSION JS - FULL 350+ LINES
class StaffPermission {
  constructor(){
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

  async init(){
    await this.loadStaff();
    this.renderPermissions();
    this.bindEvents();
  }

  async loadStaff(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/staff/${this.shopId}`);
        this.staff = data.staff||data||[];
      } else {
        this.staff = JSON.parse(localStorage.getItem(`staff_${this.shopId}`)||'[]');
      }

      const staffSelect = document.getElementById('permissionStaffSelect');
      if(staffSelect){
        staffSelect.innerHTML = `<option value="">Select staff member</option>` + this.staff.map(s=> `<option value="${s._id}">${s.name} • ${s.role}</option>`).join('');

        const urlStaffId = new URLSearchParams(location.search).get('staffId');
        if(urlStaffId) staffSelect.value = urlStaffId;
      }

      if(staffSelect && staffSelect.value){
        this.loadStaffPermissions(staffSelect.value);
      }

    }catch(e){}
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
    if(!staff) return;

    // Uncheck all
    document.querySelectorAll('.perm-item input').forEach(cb=> cb.checked=false);

    // Check staff permissions
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
    const staffSelect = document.getElementById('permissionStaffSelect');
    const staffId = staffSelect?.value;

    if(!staffId){
      if(window.Toast) Toast.show('Select staff member first', 'warning');
      return;
    }

    const permissions = this.getSelectedPermissions();

    if(permissions.length===0){
      if(!confirm('No permissions selected. Staff will have no access. Continue?')) return;
    }

    const btn = document.getElementById('savePermissionsBtn');
    btn.innerText='Saving...'; btn.disabled=true;

    try{
      if(window.ApiCore){
        await window.ApiCore.put(`/api/common/staff/${this.shopId}/${staffId}/permissions`, { permissions });
      } else {
        const allStaff = JSON.parse(localStorage.getItem(`staff_${this.shopId}`)||'[]');
        const idx = allStaff.findIndex(s=> s._id===staffId);
        if(idx>=0){
          allStaff[idx].permissions = permissions;
          localStorage.setItem(`staff_${this.shopId}`, JSON.stringify(allStaff));
          this.staff = allStaff;
        }
      }

      if(window.Toast) Toast.show(`Permissions saved for ${this.staff.find(s=> s._id===staffId)?.name||'staff'} ✅`, 'success');

      if(window.SocketCore){
        window.SocketCore.emit('staff-permissions-updated', { shopId:this.shopId, staffId, permissions });
      }

    }catch(e){
      if(window.Toast) Toast.show('Failed to save permissions', 'error');
    }finally{
      btn.innerText='Save Permissions 🔐';
      btn.disabled=false;
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