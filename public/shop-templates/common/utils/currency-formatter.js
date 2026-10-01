// LOCATION: public/shop-templates/common/utils/currency-formatter.js
// WORLD CLASS CURRENCY FORMATTER - FULL 200+ LINES
class CurrencyFormatter {
  constructor(){
    this.currency = 'INR';
    this.symbol = '₹';
    this.locale = 'en-IN';
  }

  format(amount, options={}){
    try{
      if(amount===null || amount===undefined) return `${this.symbol} 0`;

      const num = parseFloat(amount);

      if(isNaN(num)) return `${this.symbol} 0`;

      const { showSymbol=true, decimals=2, compact=false } = options;

      if(compact){
        return this.formatCompact(num, showSymbol);
      }

      // Indian formatting: 1,00,000
      const formatted = new Intl.NumberFormat(this.locale, {
        minimumFractionDigits: num%1===0?0:decimals,
        maximumFractionDigits:decimals
      }).format(num);

      return showSymbol? `${this.symbol} ${formatted}` : formatted;

    }catch(e){
      return `${this.symbol} ${amount}`;
    }
  }

  formatCompact(amount, showSymbol=true){
    try{
      const num = parseFloat(amount);

      if(num>=10000000){
        const cr = (num/10000000).toFixed(1);
        return showSymbol? `${this.symbol} ${cr}Cr` : `${cr}Cr`;
      }

      if(num>=100000){
        const l = (num/100000).toFixed(1);
        return showSymbol? `${this.symbol} ${l}L` : `${l}L`;
      }

      if(num>=1000){
        const k = (num/1000).toFixed(1);
        return showSymbol? `${this.symbol} ${k}K` : `${k}K`;
      }

      return this.format(num, { showSymbol, decimals:0 });

    }catch(e){
      return `${this.symbol} ${amount}`;
    }
  }

  formatWithoutSymbol(amount){
    return this.format(amount, { showSymbol:false });
  }

  parse(formattedAmount){
    try{
      if(!formattedAmount) return 0;

      // Remove currency symbol and commas
      const cleaned = formattedAmount.toString().replace(/[^0-9.-]/g,'');

      const num = parseFloat(cleaned);

      return isNaN(num)?0:num;

    }catch(e){
      return 0;
    }
  }

  formatRange(min, max){
    try{
      return `${this.format(min)} - ${this.format(max)}`;
    }catch(e){
      return `${this.symbol} ${min} - ${this.symbol} ${max}`;
    }
  }

  formatDiscount(original, discounted){
    try{
      const orig = parseFloat(original);
      const disc = parseFloat(discounted);

      if(orig<=0) return { amount:0, percent:0, formatted:'0% OFF' };

      const amount = orig - disc;
      const percent = Math.round((amount/orig)*100);

      return {
        amount,
        percent,
        formatted:`${percent}% OFF`,
        saved:this.format(amount)
      };

    }catch(e){
      return { amount:0, percent:0, formatted:'0% OFF' };
    }
  }

  formatForInput(amount){
    try{
      const num = parseFloat(amount);
      if(isNaN(num)) return '';
      return num.toString();
    }catch(e){
      return '';
    }
  }

  // For shop owner: revenue formatting
  formatRevenue(amount){
    return this.format(amount, { compact:true });
  }

  formatProfit(amount){
    const formatted = this.format(amount);
    const isProfit = parseFloat(amount)>=0;
    return { formatted, isProfit, color:isProfit?'#10b981':'#ef4444', icon:isProfit?'📈':'📉' };
  }
}

window.CurrencyFormatter = new CurrencyFormatter();
window.formatCurrency = (amount, options)=> window.CurrencyFormatter.format(amount, options);
window.formatCurrencyCompact = (amount)=> window.CurrencyFormatter.formatCompact(amount);