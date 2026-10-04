class SLHistory {
  constructor(){
    this.key = 'sl_master_history_v99';
    this.maxRecords = 100;
  }
  log(pageName){
    const history = this.getAll();
    const now = new Date();
    const record = {
      id: Date.now(),
      page: pageName,
      url: pageName + '.html',
      time: now.toLocaleString('en-IN'),
      timestamp: now.getTime(),
      duration: 0, // kitni der khula
      userAgent: navigator.userAgent.slice(0,50)
    };
    // agar same page pichli baar bhi khula tha to duration update kar
    if(history.length > 0){
      const last = history[0];
      last.duration = Math.floor((record.timestamp - last.timestamp)/1000) + 's';
    }
    history.unshift(record);
    if(history.length > this.maxRecords) history.pop();
    localStorage.setItem(this.key, JSON.stringify(history));
    console.log('📝 HISTORY LOGGED:', record);
  }
  getAll(){
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }
  clear(){
    localStorage.removeItem(this.key);
    location.reload();
  }
  getAnalytics(){
    const h = this.getAll();
    const counts = {};
    h.forEach(r=> counts[r.page] = (counts[r.page]||0)+1);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]); // most visited
  }
}
window.SLHistory = new SLHistory();