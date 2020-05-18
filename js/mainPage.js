const { ipcRenderer } = nodeRequire('electron')

ipcRenderer.on('dict-reply', (event, arg) => {
    // console.log(arg)
    // document.getElementById("history-dict-page").innerHTML=JSON.stringify(arg);

    arg.sort((a,b)=>{
        if(a.count!=b.count){
            return b.count-a.count;
        }
        return b.sum-a.sum;
    });

    var table=$(
    '<table class="table">\
        <thead>\
            <tr>\
                <th>单词</th>\
                <th>发音</th>\
                <th>释义</th>\
                <th>次数</th>\
                <th>标记</th>\
            </tr>\
        </thead>\
        <tbody>\
        </tbody>\
    </table>'
    );

    arg.forEach(e=>{
        var row=$("<tr></tr>");
        row.append($("<td></td>").text(e.keyword));
        var pron=$("<td></td>");
        e.pronounce.forEach(ep=>{
            var sp=$("<span></span>").text(ep.phonetic);
            sp.hover(function(){
                var voice=new Audio(ep.voice);
                voice.play();
            })
            pron.append(sp);
            pron.append($("<br/>"));
        })
        row.append(pron);

        var tran=$("<td></td>");
        e.tran.forEach(et=>{
            tran.append($("<p></p>").text(et));
        })
        row.append(tran);

        row.append($("<td></td>").text(e.count+"/"+e.sum));
        var img=$("<img></img>").attr({
            class:"check-img",
            src:(e.count==0?"./image/lab_g.png":"./image/lab.png"),
            "data-key":e.keyword,
            onclick:"resetKey(this)"
        });
        row.append($('<td></td>').append(img));
        table.children("tbody").append(row);
    });
    $("#history-dict-page").html("");
    $("#history-dict-page").append(table);

    
})
$(function(){
    
    $("#history-dict").click(function(){
        ipcRenderer.send('get-dict')
    })
    $("#history-dict").click();
})

function resetKey(e){
    console.log(e.dataset.key+"1")
    $(e).attr("src","./image/lab_g.png");
    ipcRenderer.send('reset-key',e.dataset.key);
}

