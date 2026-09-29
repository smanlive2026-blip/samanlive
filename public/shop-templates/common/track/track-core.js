window.CommonTrack = {
  listenOrder: (orderId, callback)=>{
    if(window.io){
      const socket = io();
      socket.on(`order-status-${orderId}`, callback);
    }
  }
}