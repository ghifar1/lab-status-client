const activeWindows = require("electron-active-window");
const events = require('events');
const ev = new events.EventEmitter();


const interval = () =>{
    let tempState = "";
    setInterval(() => {
        activeWindows().getActiveWindow().then((stat)=>{
          if(stat.windowClass !== tempState){
              tempState = stat.windowName;
              ev.emit('stateChange', stat);
          }
        });
      }, 2000);
}

const activity = ()=>{
    interval();
}


module.exports = {
    activity,
    ev
}