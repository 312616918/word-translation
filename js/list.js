require('electron').ipcRenderer.on('result', (event, message) => {
    console.log(message);


    var keyword=document.createElement("div");
    keyword.classList.add("keyword");
    keyword.innerHTML=message.keyword;

    var baav=document.createElement("div");
    baav.classList.add("baav");
    var tran=document.createElement("div");
    tran.classList.add("tran");

    message.pronounce.forEach(element => {
      var p=document.createElement("span");
      p.classList.add("pronounce");
      p.innerHTML=element.phonetic;
      p.addEventListener("mouseover",function(){
        var voice=new Audio(element.voice);
        voice.play();
      })
      baav.appendChild(p);
    });

    message.tran.forEach(element=>{
      var t=document.createElement("div");
      t.innerHTML=element
      tran.appendChild(t);
    })

    var listItem=document.createElement("div");
    listItem.classList.add("listItem");
    listItem.appendChild(keyword);
    listItem.appendChild(baav);
    listItem.appendChild(tran);
    document.body.appendChild(listItem);
    // document.body.scrollTop=document.body.scrollHeight;
    // // alert(document.body.scrollHeight);
    var t = document.body.clientHeight;
    window.scroll({ top: t, left: 0, behavior: 'smooth' });
  });