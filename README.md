---
title: "用 JavaScript 打造視訊錄影 APP"
date: 2018-02-05 10:36:30
banner: undefined
categories:
- JavaScript
tags:
- webapis
- blog
---

# [JS] 用 JavaScript 打造視訊錄影 APP

@(Javascript)[webapis, blog]

##### keywords: `mediaRecorder`, `mediaStream`, `mediaDevices`, `Blob`

最近剛好有需要透過瀏覽器來做錄影的操作，於是便和 [Andyyou](https://andyyou.github.io/) 和 [Calvert](https://blog.chyang.me/) 一塊研究開始試著實作，這個範例將示範如何透過瀏覽器內建的 **MediaStream API** 來打造影音錄影的功能。

做出來的效果類似這樣：

![Imgur](https://i.imgur.com/ekZhNna.gif)

## 閱讀建議

在閱讀這篇文章前，建議已經知道如何透過 JavaScript [`querySelector()`](https://developer.mozilla.org/zh-TW/docs/Web/API/Element/querySelector) 來選取 DOM 元素；對於 JavaScript 的 [addEventListener](https://developer.mozilla.org/zh-TW/docs/Web/API/EventTarget/addEventListener) 和 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) 有最基本的觀念即可（知道 `.then()` 的使用）。

由於需要透過瀏覽器取得系統的攝影機，在 Chrome 的瀏覽器操作下，這個 API 只能在安全的來源（ [secure origins only](https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins)）下才能使用，也就是只能在網址來自 **HTTPS** 或 **localhost** 下才能使用，因此建議直接 clone 專案下來執行（貼到 codepen 或 JSFiddle 可能無法正常執行）。

將程式碼拉下來執行後，可先簡單閱讀程式碼 `main.js` ，接著選擇依照本文內容逐步了解各 API 用法，或針對不懂的部分進行搜尋。最後重構成自己理解的版本。

## 環境建置

由於需要透過瀏覽器取得系統的攝影機，在 Chrome 的瀏覽器操作下，這個 API 只能在安全的來源（ [secure origins only](https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins)）下才能使用，也就是只能在網址來自 **HTTPS** 或 **localhost** 下才能使用，因此我們先透過 gulp 建立一個 local server 。

因此你可以先把這個專案下載或 clone 下來，接著執行：

```bash
$ npm install
$ npm start
```

應該就可以把這個專案 run 起來了，預設當 `./src` 資料夾內的檔案有變動的時候會自動更新瀏覽器：

![Imgur](https://i.imgur.com/On8YeWQ.png)



## 版面配置

接著簡單做一下 HTML 和 CSS 的 View，主要套用了 Bootstrap 4 使用，但這比較不是這篇的重點，可以直接參考專案中的 [`./src/views/index.html`](https://github.com/PJCHENder/webapis-media-recorder/blob/master/src/views/index.html) 和 [`./src/sass/style.scss`](https://github.com/PJCHENder/webapis-media-recorder/blob/master/src/sass/style.scss)。

套用好的版面大概會長的像這樣子：

![Imgur](https://i.imgur.com/gJ6Iv2W.png)

有一些元素是之後會在 JS 中選取的使用的，可以留意下面提到的這幾個元素。

透過 HTML5 的 `<video>` 元素來帶入影片，**分別取 id 為 `#inputVideo` 和 `#outputVideo` ，前者是用來顯示攝影機即時的影像，後者會顯示錄好的影像**，之後我們會在 JS 中選取這兩個元素。另外有個 `.is-recording` 的 div 是用來顯示錄影中的提示：

```html
<!-- 透過 <video> 代入影像 -->
<div class="row mb-5 justify-content-center align-items-center">
  <div class="col-md-6 text-center">
    <div class="video-container d-flex align-items-center justify-content-center">
      <div class="is-recording"></div>
      <video id="inputVideo" alt="在這裡錄影" muted>Video stream not available.</video>
    </div>
  </div>

  <div class="col-md-6 text-center">
    <div class="video-container d-flex align-items-center justify-content-center">
      <video id="outputVideo" alt="錄好的畫面將會出現在這" muted>Video stream not available.</video>
    </div>
  </div>
</div>
```

再來是按鈕的部分可以分成**開始錄影 `#startBtn`**, **結束錄影 `#stopBtn`** 和**重新啟動錄影機 `#resetBtn`** 這三個元素：

```html
<!-- 操作按鍵 -->
<div class="row mb-4 justify-content-center align-items-center">
  <div class="col-4 d-flex justify-content-center align-items-center">
    <button id="startBtn" class="btn btn-sm btn-outline-primary">Start Recording</button>
    <button id="stopBtn" class="btn btn-sm btn-outline-danger" style="display:none">Stop Recording</button>
    <button id="resetBtn" class="btn btn-sm btn-outline-info" style="display:none">Restart Recorder</button>
  </div>
</div>
```

最後有一個 `#errorMsg` 是當有錯誤訊息產生時放置的地方：

```html
<!-- 顯示錯誤訊息 -->
<div class="row">
  <div class="col-12">
    <div role="alert" id="errorMsg"></div>
  </div>
</div>
```

## 透過 Web APIs 錄製視訊畫面

在來就要透過 JS 搭配瀏覽器的 APIs 來實做錄製視訊畫面。這部分讀起來難度雖然不高，但就是很多名詞需要理解，讓我們一步一步看下去，在這篇文章中，我們先大概瞭解每個 API 的用法，最後再把每個範例完整的拼起來。

錄製視訊螢幕的流程大概是這樣的：

1. 取得使用者視訊鏡頭權限－MediaDevices API
2. 將取得視訊鏡頭的影音串流即時播放於瀏覽器－HTML5 Video Element
3. 錄製視訊鏡頭所取得的影音串流－MediaRecorder API
4. 將錄製的影音串流顯示於瀏覽器－Blob 物件
5. 關閉視訊鏡頭－MediaStream API
6. 重新啟動視訊鏡頭與釋放記憶體

> 提醒：要取得使用者視訊鏡頭，並需是安全來源（secure origin），因此網址需為 https 或 localhost。

### 1. 取得視訊鏡頭權限－MediaDevices API

[MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)  讓網頁能夠存取與系統連接的媒體裝置，例如相機、麥克風、甚至分享螢幕。我們透過 [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 可以請求並取得使用者的視訊鏡頭。

這個 API 的基本用法是這樣：

- 透過 `constraints` 定義想要取得的影音來源
- 透過 `navigator.mediaDevices.getUserMedia(constraints)` 來請求影音權限，並且回傳一個 **Promise**
- 當取得影音來源時，會透過 `.then()` 來回傳 [MediaStreams（影音串流）](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) ，因此我們可以透過在 function 中代入變數 `stream` （可自取變數名稱，慣例上用 **stream**）來取得影音串流的內容，在這裡影音串流的內容其實就是當前透過攝影機和麥克風取得的影音內容。

```js
// 定義要取得的影音內容，包含影像和聲音
let constraints = {
  audio: true,
  video: true
}

// 請求開啟影音裝置
navigator.mediaDevices.getUserMedia(constraints)
  .then(function (stream) {
    // 取得當前裝置的影音串流（stream）
  })
  .catch(function (error) {
  // 如果有錯誤發生
  });
```

當執行這段語法後，瀏覽去就會去請求使用者的麥克風和相機的權限：

![Imgur](https://i.imgur.com/VFu4Chf.png)

### 2. 將取得視訊鏡頭的影音串流即時播放於瀏覽器－HTML5 Video Element

接著要把透過 `MediaDevices.getUserMedia()` 將取得的**串流（Stream）**播放於瀏覽器上。我們先選取 HTML 的 `<video>` 元素：

```js
// <video> element
let inputVideo = document.querySelector('#inputVideo')
```

要把取得的串流放到 `<video>` 中有兩種作法，一種是透過 [HTMLMediaElement.srcObject](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject) 的方式，一種是透過 [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)  的方式，這兩種方法都可以把串流的內容放到 `<video>` 中進行播放，但前者並不會在 `<video>` 上出現 `src` 的屬性即可播放；後者則是利用在 `<video>` 上的 `src` 屬性來讀取影音串流。

由於 [HTMLMediaElement.srcObject](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject)  目前僅是實驗性的方法，因此如果要用的話，[MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject) 上建議還是要使用 `try ...catch `，進行瀏覽器不支援時的處理。因此在這裡我們還是先用 `URL.createObjectURL()` 的方式將影音串流放到 `<video>` 中：

```js
let inputVideo = document.querySelector('#inputVideo')

navigator.mediaDevices.getUserMedia(constraints)
  .then(function (stream) {
    inputVideoURL = URL.createObjectURL(stream)
    inputVideo.src = inputVideoURL
    inputVideo.controls = false       // 要不要顯示播放控制器
  })
  .catch(function (error) {
    console.warn('some error occurred' + error)
  });
```

這時候你會發現瀏覽器已經可以讀取視訊鏡頭上的串流了：

![Imgur](https://i.imgur.com/QMi9GNB.png)

但你可能會發現視訊的畫面有些卡頓，這是因為我們沒有讓這個 video 元素**播放**，所以只有在當瀏覽器畫面重新渲染時（例如捲動 scrollbar 時），才會更新視訊畫面，因此我們可以針對 [HTML Video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) 監聽 **loadedmetadata** 這個事件，它會在當媒體檔的 metadata 完成載入時被觸發，這時候在來透過 `video.play()` 播放：

```js
/* 當媒體的 metadata 載入後即播放媒體 */
inputVideo.addEventListener('loadedmetadata', e => {
  inputVideo.play()
})
```

這樣就不會有畫面卡頓的問題了。

### 3. 錄製視訊鏡頭所取得的影音串流－MediaRecorder

要對串流進行錄製的動作，需要使用到 [Media Recorder API](https://developer.mozilla.org/zh-TW/docs/Web/API/MediaRecorder)。**Media Recorder** 基本的使用方式是先透過 `MediaRecorder()` 建構式，給它要錄製的 [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) ，即可以建立 **MediaRecorder** 物件：

```js
/* 建立 mediaRecorder 物件 */
mediaRecorder = new MediaRecorder(stream)
```

接著 **mediaRecorder** 有一些方法可以使用，基本的像是：`mediaRecorder.start()` 和 `mediaRecorder.stop()` 來開啟和結束錄製串流：

```js
mediaRecorder = new MediaRecorder(stream)
mediaRecorder.start()   // 可使錄製影音串流
mediaRecorder.stop()    // 結束錄製影音串流
```

預設沒有帶參數的情況下，當停止錄製時，**mediaRecorder** 會一次丟**整包**錄製好的檔案回來；如果我們希望每次**丟一點丟一點**，則可以在 `mediaRecorder.start()` 中代入參數，它會根據你給予的時間一次回拋一段：

```Js
/* 每秒回拋一次錄製的串流 */
mediaRecorder.start(1000)
```

這裡可以整理出幾個 function：

```js
let startBtn = document.querySelector('#startBtn')
let stopBtn = document.querySelector('#stopBtn')

startBtn.addEventListener('click', onStartRecording)
stopBtn.addEventListener('click', onStopRecording)

// Start Recording: mediaRecorder.start()
function onStartRecording (e) {
  mediaRecorder.start()
}

// Stop Recording: mediaRecorder.stop()
function onStopRecording (e) {
  mediaRecorder.stop()
}
```

另外，**MediaRecorder** 也提供一些事件讓我們可以監聽，比較重要的是 **dataavailable** 這個事件，這個事件會在 **MediaRecorder** 傳送媒體資料到應用程式以供使用時促發，data 會是包含媒體資料。簡單來說，當有可用資料傳入時，就可以在 **dataavailable** 事件取得：

```js
/* 監聽 dataavailable 事件，可以用 ondataavailable 或透過 addEventListener 均可 */

MediaRecorder.addEventListener('dataavailable', function(e) {
  e.data    // 取得資料
})
```

如同前面所述的，如果我們開始錄製時的 `mediaRecorder.start()` 沒有代入參數，它會在停止錄製時一次丟整包錄製好的檔案回來，這個檔案可以在 **dataavailable** 事件中取得：

![Imgur](https://i.imgur.com/pBmknXg.png)

但若我們在 `mediaRecorder.start(1000)` 中代入參數 1000ms ，那麼開始錄製後每隔 1 秒就會回傳一次資料，像下面這樣：

![Imgur](https://i.imgur.com/ogtwAuu.gif)

### 4. 將錄製的影音串流顯示於瀏覽器 － Blob 物件

到目前為止簡單整理一下：

- 首先透過 **MediaDevices** 物件的方法 `MediaDevices.getUserMedia()` 可以請求使用者影音裝置的權限，並獲得影音裝置傳回來的**串流（stream）**；
- 接著透過 **MeidaRecorder** 物件的方法 `mediaRecorder.start()` 和 `mediaRecorder.stop()` 可以開始和結束錄製透過影音裝置傳來的串流；
- 最後監聽事件 `mediaRecorder.ondataavailable` 可以在觸發該事件時，透過 `function (e) {e.data} ` 來取得資料。

接著要把透過 **dataavailalbe** 取得的資料放到瀏覽器的 `<video>` 上面，從剛剛的說明可以知道 **dataavailable** 有可能是透過 `mediaRecorder.start()` 只促發一次（一次送回整包資料），或者透過 `mediaRecorder.start(1000)` 每隔一定時間回傳一包資料，因此作法上會先建立一個名為 chunks 的陣列，在把取得的資料推進這個陣列中（如果是一次送回整包資料的這種，可以不用 chunks）：

```js
let chunks = []
mediaRecorder.addEventListener('dataavailable', mediaRecorderOnDataAvailable)

function mediaRecorderOnDataAvailable (e) {
  chunks.push(e.data)
}
```

接著把這個 chunks 陣列變成 [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) 物件，Blob 物件可以簡單想成是一種相當於檔案的物件，透過 [Blob() 建構式](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob) 代入資料和編碼的方式，即可建立 Blob 物件，這裡我們把它編碼成 `video/webm` ，這個檔案格式可以透過 chrome 瀏覽器打開。接著透過前面提過的 `URL.createObjectURL(blob)` 的方式，再把影音連結丟給 video 元素：

```js
// 將由 dataavailable 取得的資料代入 Bl產生() 建構式中，產生 Blob 物件
var blob = new Blob(chunks, { 'type': 'video/webm; codecs=vp9' })

// 把 blob 物件透過 URL.createObjectURL() 代入 src 內
outputVideoURL = URL.createObjectURL(blob)
outputVideo.src = outputVideoURL
```

這時候，錄製好的影像就可以呈現於右邊 outputVideo 這個元素上。

這裡可以把 function 整理成：

```js
let chunks = []

navigator.mediaDevices.getUserMedia(constraints)
  .then(function (stream) {

    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.addEventListener('dataavailable', mediaRecorderOnDataAvailable)   // 資料傳入時觸發
    mediaRecorder.addEventListener('stop', mediaRecorderOnStop)                     // 停止錄影時觸發

    function mediaRecorderOnDataAvailable(e) {
      chunks.push(e.data)
    }

    function mediaRecorderOnStop(e) {
      var blob = new Blob(chunks, { 'type': 'video/webm; codecs=vp9' })
      chunks = []       // 清空 chunks
      // 將錄製好的影片接到 <video> 上
      outputVideoURL = URL.createObjectURL(blob)
      outputVideo.src = outputVideoURL
    }
  })
  .catch(err => {...})
```



### 5. 關閉視訊鏡頭 - MediaStream API

這時候錄製和播放雖然不會有什麼問題，但會發現即使錄影結束了，筆電上方的攝影鏡頭卻還亮著沒有關閉，左邊的 inputVideo 元素也繼續播放透過攝像鏡頭取得的影像：

![Imgur](https://i.imgur.com/TadGuvb.png)

因此，（若有需要）可以在結束錄影的時候把攝影鏡頭關閉。透過 `MediaStram.getTracks()` 可以取得當前正在串流的影音裝置，每個影音裝置都是一個**軌（track）**，在取得影音裝置後可以透過 `track.stop()` 把該裝置關閉：

```js
 navigator.mediaDevices.getUserMedia(constraints)
   .then(function (stream) {

     // 取得所有串流的裝置，並全部關閉
     stream.getTracks().forEach(function (track) {
       track.stop()
     })

   })
  .catch(...)
```

### 6. 重新啟動視訊鏡頭與釋放記憶體

最後，既然在上一步的時候關閉了視訊鏡頭，如果要再次錄製就需要重新啟動它，因此我們會把整個啟動攝影機到錄製的步驟（步驟 1 ~ 步驟 5）包在一個叫做 `mediaRecorderSetup` 的函式中，在重新啟動視訊鏡頭的時候再去呼叫這個 function 來啟動視訊鏡頭。

除此之外，由於透過 `URL.createObjectURL()` 的內容會佔用在瀏覽器的記憶體中，雖然瀏覽器有自動清除的機制，但 MDN 還是建議手動清除它，所以在重新啟動視訊鏡頭的過程中，我們順便把記憶體釋放掉：

```Js
function onReset (e) {
  // 釋放記憶體
  URL.revokeObjectURL(inputVideoURL)
  URL.revokeObjectURL(outputVideoURL)
  outputVideo.src = ''
  outputVideo.controls = false
  inputVideo.src = ''

  // 重新啟動攝影機
  mediaRecorderSetup()
}
```

## 其他函式

在這段程式碼中有一些和錄製視訊比較沒這麼相關的函式簡單說明一下。

### 自動下載

在預設的情況下，當錄製好的視訊影片載入完畢後，影片控制欄就會出現下載的符號可供下載：

![Imgur](https://i.imgur.com/DlNqgr9.png)

但如果希望視訊影片結束錄製時可以自動跳出下載視窗，可以透過建立一個連結並自動點擊來達到自動下載的方法：

```js
function saveData (dataURL) {
  var fileName = 'my-download-' + Date.now() + '.webm'
  var a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = dataURL
  a.download = fileName
  a.click()
}
```

### 顯示錯誤訊息

```js
function errorMsg (msg, error) {
  console.log('errorElement', errorElement)
  errorElement.classList.add('alert', 'alert-warning')
  errorElement.innerHTML += msg
  if (typeof error !== 'undefined') {
    console.error(error)
  }
}
```

這個 function 主要用來顯示錯誤訊息，例如當使用者未提供視訊裝置的權限時，會顯示：

![Imgur](https://i.imgur.com/Gu5xfRO.png)

### 切換按鈕

這個 function 只是用來切換要顯示的按鈕：

```js
function isRecordingBtn (recordBtnState) {
  startBtn.style.display = 'none'
  stopBtn.style.display = 'none'
  resetBtn.style.display = 'none'
  isRecordingIcon.style.display = 'none'
  switch (recordBtnState) {
    case 'start':
      startBtn.style.display = 'block'         // show startBtn
      break;
    case 'stop':
      stopBtn.style.display = 'block'          // show stopBtn
      isRecordingIcon.style.display = 'block'
      break;
    case 'reset':
      resetBtn.style.display = 'block'         // show resetBtn
      break;
    default:
      console.warn('isRecordingBtn error')
  }
}
```

## 統整 JavaScript 程式碼

最後，就可以把整個程式碼統整起來了，完整的程式碼放置於 [Github](https://github.com/PJCHENder/webapis-media-recorder/blob/master/src/js/main.js) 。

## 參考

- [Using Prmose](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) @ MDN
- [An Introduction To JavaScript Blobs and File Interface](http://qnimate.com/an-introduction-to-javascript-blobs-and-file-interface/)
- [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) @ MDN - Web APIs
- [HTML Vidoe Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) @ MDN
- [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) @ MDN - Web APIs
- [MediaStreams](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) @ MDN - Web APIs
- [Media Recorder](https://developer.mozilla.org/zh-TW/docs/Web/API/MediaRecorder) @ MDN - Web APIs

