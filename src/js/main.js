'use strict'
/* global MediaRecorder, Blob, URL */

/**
 * Get DOM element
 */
// <video> element
let inputVideo = document.querySelector('#inputVideo')
let outputVideo = document.querySelector('#outputVideo')

// <button> element
let startBtn = document.querySelector('#startBtn')
let stopBtn = document.querySelector('#stopBtn')
let resetBtn = document.querySelector('#resetBtn')

// error message
let errorElement = document.querySelector('#errorMsg')

// is-recording icon
let isRecordingIcon = document.querySelector('.is-recording')

/**
 * Global variables
 */
let chunks = [] // 在 mediaRecord 要用的 chunks

// 在 getUserMedia 使用的 constraints 變數
let constraints = {
  audio: true,
  video: true
}

// 第一次啟動攝影機
mediaRecorderSetup()

/**
 * MediaRecorder Related Event Handler
 */
let mediaRecorder = null
let inputVideoURL = null
let outputVideoURL = null

startBtn.addEventListener('click', onStartRecording)
stopBtn.addEventListener('click', onStopRecording)
resetBtn.addEventListener('click', onReset)

/**
 * MediaRecorder Methods
 */
// Start Recording: mediaRecorder.start()
function onStartRecording (e) {
  e.preventDefault()
  e.stopPropagation()
  isRecordingBtn('stop')
  mediaRecorder.start()
  console.log('mediaRecorder.start()')
}

// Stop Recording: mediaRecorder.stop()
function onStopRecording (e) {
  e.preventDefault()
  e.stopPropagation()
  isRecordingBtn('reset')
  mediaRecorder.stop()
  console.log('mediaRecorder.stop()')
}

// Reset Recording
function onReset (e) {
  e.preventDefault()
  e.stopPropagation()

  // 釋放記憶體
  URL.revokeObjectURL(inputVideoURL)
  URL.revokeObjectURL(outputVideoURL)
  outputVideo.src = ''
  outputVideo.controls = false
  inputVideo.src = ''

  // 重新啟動攝影機
  mediaRecorderSetup()
}

/**
 * Setup MediaRecorder
 **/

function mediaRecorderSetup () {
  // 設定顯示的按鍵
  isRecordingBtn('start')

  // mediaDevices.getUserMedia() 取得使用者媒體影音檔
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      /**
       * inputVideo Element
       * 將串流的 inputVideo 設定到 <video> 上
       **/
      // Older browsers may not have srcObject
      if ('srcObject' in inputVideo) {
        inputVideo.srcObject = stream
      } else {
        // Avoid using this in new browsers, as it is going away.
        inputVideo.src = window.URL.createObjectURL(stream)
      }
      inputVideo.controls = false

      /**
       * 透過 MediaRecorder 錄製影音串流
       */
      // 建立 MediaRecorder 準備錄影
      // 如果沒有指定 mimeType，錄下來的 webm 影片在 Firefox 上可能不能看（Firefox 也不支援 h264)
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=VP9',
        // bitsPerSecond: '512000',
      })

      /* MediaRecorder EventHandler */
      mediaRecorder.addEventListener(
        'dataavailable',
        mediaRecorderOnDataAvailable
      ) // 有資料傳入時觸發
      mediaRecorder.addEventListener('stop', mediaRecorderOnStop) // 停止錄影時觸發

      function mediaRecorderOnDataAvailable (e) {
        console.log('mediaRecorder on dataavailable', e.data)
        chunks.push(e.data)
      }

      function mediaRecorderOnStop (e) {
        console.log('mediaRecorder on stop')
        outputVideo.controls = true
        var blob = new Blob(chunks, { type: 'video/webm' })
        chunks = []
        outputVideoURL = URL.createObjectURL(blob)
        outputVideo.src = outputVideoURL

        saveData(outputVideoURL)

        // 停止所有的輸入或輸出的串流裝置（例如，關攝影機）
        stream.getTracks().forEach(function (track) {
          track.stop()
        })
      }
    })
    .catch(function (error) {
      if (error.name === 'ConstraintNotSatisfiedError') {
        errorMsg(
          'The resolution ' +
            constraints.video.width.exact +
            'x' +
            constraints.video.width.exact +
            ' px is not supported by your device.'
        )
      } else if (error.name === 'PermissionDeniedError') {
        errorMsg('Permissions have not been granted to use your media devices')
      }
      errorMsg('getUserMedia error: ' + error.name, error)
    })
}

/**
 * DOM EventListener
 */
inputVideo.addEventListener('loadedmetadata', function () {
  inputVideo.play()
  console.log('inputVideo on loadedmetadata')
})

/**
 * Other Function
 */
function errorMsg (msg, error) {
  console.log('errorElement', errorElement)
  errorElement.classList.add('alert', 'alert-warning')
  errorElement.innerHTML += msg
  if (typeof error !== 'undefined') {
    console.error(error)
  }
}

function saveData (dataURL) {
  var fileName = 'my-download-' + Date.now() + '.webm'
  var a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = dataURL
  a.download = fileName
  a.click()
}

function isRecordingBtn (recordBtnState) {
  startBtn.style.display = 'none'
  stopBtn.style.display = 'none'
  resetBtn.style.display = 'none'
  isRecordingIcon.style.display = 'none'
  switch (recordBtnState) {
    case 'start':
      startBtn.style.display = 'block' // show startBtn
      break
    case 'stop':
      stopBtn.style.display = 'block' // show stopBtn
      isRecordingIcon.style.display = 'block'
      break
    case 'reset':
      resetBtn.style.display = 'block' // show resetBtn
      break
    default:
      console.warn('isRecordingBtn error')
  }
}
