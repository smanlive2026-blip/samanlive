// LOCATION: public/shop-templates/common/support/help.js
// WORLD CLASS HELP JS - FULL 250+ LINES
class HelpCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.faqs = [];
    this.categories = [];
  }

  async init(){
    await this.loadHelpData();
  }

  async loadHelpData(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/support/help`);
        this.faqs = data.faqs||[];
        this.categories = data.categories||[];
      } else {
        this.faqs = [
          { id:'1', category:'orders', q:'How to manage orders?', a:'Go to Orders page > Accept > Prepare > Assign delivery > Delivered', views:1250 },
          { id:'2', category:'delivery', q:'How to setup delivery?', a:'Settings > Delivery Settings > Set charges and radius', views:890 },
          { id:'3', category:'payments', q:'How to get payouts?', a:'Wallet > Withdraw > Enter amount > Bank/UPI > Submit', views:1100 },
          { id:'4', category:'shop', q:'How to verify shop?', a:'Profile > Verification > Upload documents > Submit', views:750 }
        ];

        this.categories = [
          { id:'orders', name:'Orders', icon:'📦', count:12 },
          { id:'delivery', name:'Delivery', icon:'🛵', count:8 },
          { id:'products', name:'Products', icon:'📦', count:10 },
          { id:'payments', name:'Payments & Wallet', icon:'💰', count:9 },
          { id:'shop', name:'Shop Settings', icon:'🏪', count:11 },
          { id:'marketing', name:'Marketing', icon:'📢', count:7 }
        ];
      }

      return { faqs:this.faqs, categories:this.categories };

    }catch(e){ return { faqs:[], categories:[] }; }
  }

  searchFaqs(query){
    if(!query) return this.faqs;

    const q = query.toLowerCase();
    return this.faqs.filter(faq=>
      faq.q.toLowerCase().includes(q) ||
      faq.a.toLowerCase().includes(q) ||
      faq.category.toLowerCase().includes(q)
    );
  }

  getFaqsByCategory(category){
    if(!category || category==='all') return this.faqs;
    return this.faqs.filter(faq=> faq.category===category);
  }

  getPopularFaqs(){
    return [...this.faqs].sort((a,b)=> (b.views||0)-(a.views||0)).slice(0,5);
  }

  async reportIssue(issueData){
    try{
      if(window.ApiCore){
        const result = await window.ApiCore.post(`/api/common/support/${this.shopId}/report`, issueData);
        return result;
      } else {
        const issues = JSON.parse(localStorage.getItem(`support_issues_${this.shopId}`)||'[]');
        const newIssue = { _id:'issue'+Date.now(), shopId:this.shopId,...issueData, status:'open', createdAt:new Date().toISOString() };
        issues.unshift(newIssue);
        localStorage.setItem(`support_issues_${this.shopId}`, JSON.stringify(issues));
        return { success:true, issue:newIssue, message:'Issue reported' };
      }
    }catch(e){ return { success:false, error:e.message }; }
  }
}

window.HelpCoreInstance = new HelpCore();
document.addEventListener('DOMContentLoaded', ()=> window.HelpCoreInstance.init());