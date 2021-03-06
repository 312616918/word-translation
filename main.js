// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  screen,
  clipboard,
  ipcMain
} = require('electron')
const robot = require("robotjs");
const ioHook = require('iohook');
const http = require('http');
const cheerio = require('cheerio');
const lowdb = require("lowdb");
const FileSync = require('lowdb/adapters/FileSync');

var db;
var mainWindow;
var listWindow;
var tray;
var scaleFactor;
var pos = {
  x: 0,
  y: 0
};
var winPos = {
  x: 0,
  y: 0
};
var oldText;

initHook();
initApp();

ioHook.start();

function initApp() {
  const adapter = new FileSync('./db.json');
  db = lowdb(adapter);

  db.defaults({
    dict: []
  }).write();



  ipcMain.on('get-dict', (event, arg) => {
    // console.log( db.get("dict").value())
    event.reply('dict-reply', db.get("dict").value())
  })

  ipcMain.on('reset-key', (event, arg) => {
    db.get("dict").find({
      keyword: arg
    }).assign({
      count: 0
    }).write();
  })


  app.whenReady().then(createWindow)

  app.on('ready', () => {
    tray = new Tray('image/icon.png');
    var contextMenu = Menu.buildFromTemplate([{
        id: "enableSlip",
        label: "启用划词",
        type: "checkbox",
        checked: true,
        click: () => {
          var item = contextMenu.getMenuItemById("enableSlip");
          if (item.checked) {
            ioHook.start();
          } else {
            ioHook.stop();
          }
        }
      },
      {
        id: "sideMenu",
        label: "显示侧边栏",
        type: "checkbox",
        checked: true,
        click: () => {
          var item = contextMenu.getMenuItemById("sideMenu");
          if (item.checked) {
            listWindow.show();
          } else {
            listWindow.hide();
          }
        }
      },
      {
        role: "quit"
      }
    ])
    tray.setToolTip('This is my application.')
    tray.setContextMenu(contextMenu)
    tray.on("click", () => {
      if (homeWindow == null) {

        createHomeWin();
      }
    })
  })

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

function initHook() {
  ioHook.on('mousedown', event => {
    console.log(event);
    if (pos.x == event.x && pos.y == event.y) {
      winPos.x = event.x + 40;
      winPos.y = event.y + 30;
      handleText();
      return;
    }
    pos.x = event.x;
    pos.y = event.y;
  });
  ioHook.on('mouseup', event => {
    if (pos.x == event.x && pos.y == event.y) {
      return;
    }
    winPos.x = event.x;
    winPos.y = event.y + 30;
    handleText();

  });
}


function createWindow() {
  scaleFactor = screen.getPrimaryDisplay().scaleFactor;
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    show: false,
    opacity: 0.7,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.on("blur", function () {
    console.log("123");
    mainWindow.hide();
  })
  // mainWindow.webContents.openDevTools()

  listWindow = new BrowserWindow({
    width: 300,
    height: 600,
    x: screen.getPrimaryDisplay().workAreaSize.width - 300,
    y: (screen.getPrimaryDisplay().workAreaSize.height - 600) / 2,
    frame: false,
    opacity: 0.7,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  console.log(screen.getPrimaryDisplay().scaleFactor);
  listWindow.loadFile('list.html')
  // listWindow.webContents.openDevTools();
  createHomeWin();

}

function createHomeWin() {
  homeWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  homeWindow.on("closed",()=>{
    homeWindow=null;
  })
  homeWindow.loadFile('mainPage.html')
  // homeWindow.webContents.openDevTools();
}

function handleText() {
  robot.keyTap("c", "control");
  var text = clipboard.readText();
  text = text.trim();
  console.log(text);
  if (text.indexOf(" ") != -1 || text == "" || text == null) {
    return;
  }
  for(var i in text){
    if(text.charCodeAt(i)>=128){
      return ;
    }
  }


  if (text == oldText) {
    return;
  }
  oldText = text;

  var res = db.get("dict").find({
    keyword: text
  }).value();
  if (res == null) {
    netDict(text, displayRes);
  } else {
    displayRes(res);
  }
}

function displayRes(res) {
  mainWindow.webContents.send("result", res);
  listWindow.webContents.send("result", res);

  var target = db.get("dict").find({
    keyword: res.keyword
  }).value();
  if (target != null) {
    db.get("dict").find({
      keyword: res.keyword
    }).assign({
      sum: target.sum + 1,
      count: target.count + 1
    }).write();
  } else {
    res.sum = 1;
    res.count = 1;
    db.get("dict").push(res).write();
  }

  mainWindow.setPosition(Math.floor(winPos.x / scaleFactor), Math.floor(winPos.y / scaleFactor))
  mainWindow.show();
}


function netDict(text, handleResult) {
  var options = {
    hostname: 'www.youdao.com',
    port: 80,
    path: encodeURI("/w/" + text),
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Connection": "keep-alive"
    }
  };

  var req = http.request(options, (res) => {
    res.setEncoding('utf8');
    var rawData;
    res.on('data', (chunk) => {
      rawData += chunk;
    });
    res.on('end', () => {
      $ = cheerio.load(rawData);

      var res = {
        keyword: $(".keyword").first().text(),
        pronounce: [],
        tran: []

      };
      $(".pronounce").each(function (i) {
        res.pronounce.push({
          phonetic: $(this).text().replace(/[ \n]/g, ""),
          voice: "http://dict.youdao.com/dictvoice?audio=" + res.keyword + "&type=" + (i + 1)
        })
      });

      $("#phrsListTab .trans-container li").each(function (i, element) {
        res.tran.push($(this).text());
      });
      handleResult(res);
    });
  });

  req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });
  req.end();

}