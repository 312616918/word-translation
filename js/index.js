require('electron').ipcRenderer.on('result', (event, message) => {
  console.log(message);
  document.getElementById("keyword").innerHTML=message.keyword;
  document.getElementById("baav").innerHTML="";
  document.getElementById("tran").innerHTML="";
  message.pronounce.forEach(element => {
    var p=document.createElement("span");
    p.classList.add("pronounce");
    p.innerHTML=element.phonetic;
    p.addEventListener("mouseover",function(){
      var voice=new Audio(element.voice);
      voice.play();
    })
    document.getElementById("baav").appendChild(p);
  });
  message.tran.forEach(element=>{
    var t=document.createElement("div");
    t.innerHTML=element
    document.getElementById("tran").appendChild(t);
  })
});