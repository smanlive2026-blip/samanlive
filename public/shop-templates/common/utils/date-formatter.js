// LOCATION: public/shop-templates/common/utils/date-formatter.js
// WORLD CLASS DATE FORMATTER - FULL 250+ LINES
class DateFormatter {
  constructor(){
    this.locale = 'en-IN';
    this.timezone = 'Asia/Kolkata';
  }

  format(date, format='DD/MM/YYYY'){
    try{
      const d = new Date(date);
      if(isNaN(d.getTime())) return 'Invalid Date';

      const day = String(d.getDate()).padStart(2,'0');
      const month = String(d.getMonth()+1).padStart(2,'0');
      const year = d.getFullYear();
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2,'0');
      const seconds = String(d.getSeconds()).padStart(2,'0');
      const hours12 = hours%12||12;
      const ampm = hours>=12?'PM':'AM';

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const dayFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

      const formats = {
        'DD/MM/YYYY':`${day}/${month}/${year}`,
        'MM/DD/YYYY':`${month}/${day}/${year}`,
        'YYYY-MM-DD':`${year}-${month}-${day}`,
        'DD-MM-YYYY':`${day}-${month}-${year}`,
        'DD MMM YYYY':`${day} ${monthNames[d.getMonth()]} ${year}`,
        'DD MMM, YYYY':`${day} ${monthNames[d.getMonth()]}, ${year}`,
        'DD MMMM YYYY':`${day} ${monthFull[d.getMonth()]} ${year}`,
        'MMM DD, YYYY':`${monthNames[d.getMonth()]} ${day}, ${year}`,
        'DD/MM/YYYY hh:mm A':`${day}/${month}/${year} ${String(hours12).padStart(2,'0')}:${minutes} ${ampm}`,
        'hh:mm A':`${String(hours12).padStart(2,'0')}:${minutes} ${ampm}`,
        'HH:mm':`${String(hours).padStart(2,'0')}:${minutes}`,
        'HH:mm:ss':`${String(hours).padStart(2,'0')}:${minutes}:${seconds}`,
        'relative':this.formatRelative(d),
        'iso':d.toISOString(),
        'timeago':this.formatTimeAgo(d)
      };

      return formats[format]||formats['DD/MM/YYYY'];

    }catch(e){
      return 'Invalid Date';
    }
  }

  formatRelative(date){
    try{
      const d = new Date(date);
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs/1000);
      const diffMin = Math.floor(diffSec/60);
      const diffHour = Math.floor(diffMin/60);
      const diffDay = Math.floor(diffHour/24);

      if(diffSec<60) return 'Just now';
      if(diffMin<60) return `${diffMin} min ago`;
      if(diffHour<24) return `${diffHour} hour${diffHour>1?'s':''} ago`;
      if(diffDay===1) return 'Yesterday';
      if(diffDay<7) return `${diffDay} days ago`;
      if(diffDay<30) return `${Math.floor(diffDay/7)} week${Math.floor(diffDay/7)>1?'s':''} ago`;
      if(diffDay<365) return `${Math.floor(diffDay/30)} month${Math.floor(diffDay/30)>1?'s':''} ago`;

      return `${Math.floor(diffDay/365)} year${Math.floor(diffDay/365)>1?'s':''} ago`;

    }catch(e){
      return this.format(date, 'DD/MM/YYYY');
    }
  }

  formatTimeAgo(date){
    return this.formatRelative(date);
  }

  formatForInput(date){
    try{
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }catch(e){
      return new Date().toISOString().split('T')[0];
    }
  }

  formatForInputDateTime(date){
    try{
      const d = new Date(date);
      return d.toISOString().slice(0,16);
    }catch(e){
      return new Date().toISOString().slice(0,16);
    }
  }

  isToday(date){
    try{
      const d = new Date(date);
      const today = new Date();
      return d.toDateString()===today.toDateString();
    }catch(e){ return false; }
  }

  isYesterday(date){
    try{
      const d = new Date(date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate()-1);
      return d.toDateString()===yesterday.toDateString();
    }catch(e){ return false; }
  }

  isThisWeek(date){
    try{
      const d = new Date(date);
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate()-7);
      return d>=weekAgo && d<=now;
    }catch(e){ return false; }
  }

  isThisMonth(date){
    try{
      const d = new Date(date);
      const now = new Date();
      return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }catch(e){ return false; }
  }

  getStartOfDay(date){
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }

  getEndOfDay(date){
    const d = new Date(date);
    d.setHours(23,59,59,999);
    return d;
  }

  getStartOfWeek(date=new Date()){
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate()-day;
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d;
  }

  getStartOfMonth(date=new Date()){
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
  }

  addDays(date, days){
    const d = new Date(date);
    d.setDate(d.getDate()+days);
    return d;
  }

  diffInDays(date1, date2){
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2-d1);
    return Math.floor(diffMs/(1000*60*60*24));
  }

  formatOrderDate(date){
    if(this.isToday(date)) return `Today, ${this.format(date, 'hh:mm A')}`;
    if(this.isYesterday(date)) return `Yesterday, ${this.format(date, 'hh:mm A')}`;
    return this.format(date, 'DD MMM, YYYY hh:mm A');
  }

  formatForShopTiming(timeStr){
    try{
      if(!timeStr) return '09:00 AM';
      const [h,m] = timeStr.split(':').map(Number);
      const hour = h>12? h-12 : h===0?12:h;
      const ampm = h>=12?'PM':'AM';
      return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
    }catch(e){
      return timeStr;
    }
  }
}

window.DateFormatter = new DateFormatter();
window.formatDate = (date, format)=> window.DateFormatter.format(date, format);
window.formatRelative = (date)=> window.DateFormatter.formatRelative(date);
window.formatTimeAgo = (date)=> window.DateFormatter.formatTimeAgo(date);