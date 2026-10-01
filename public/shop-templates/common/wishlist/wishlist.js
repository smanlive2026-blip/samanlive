// Add this compare logic inside wishlist.js after removeFromWishlist

  addToCompare(productId){
    try{
      let compareList = JSON.parse(localStorage.getItem(`compare_${this.shopId}`)|| localStorage.getItem('compare')||'[]');

      if(compareList.includes(productId)){
        compareList = compareList.filter(id=> id!==productId);
        if(window.Toast) Toast.show('Removed from compare', 'info');
      } else {
        if(compareList.length>=4){
          if(window.Toast) Toast.show('Max 4 products can be compared', 'warning');
          return { success:false, message:'Max 4' };
        }
        compareList.push(productId);
        if(window.Toast) Toast.show('Added to compare ⚖️', 'success');
      }

      localStorage.setItem(`compare_${this.shopId}`, JSON.stringify(compareList));
      localStorage.setItem('compare', JSON.stringify(compareList));

      this.compareList = compareList;
      this.updateCompareButton();

      return { success:true, compareList };

    }catch(e){ return { success:false, error:e.message }; }
  }