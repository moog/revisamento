require('dotenv').config()
const path = require('path')
const url = require('url')
const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
} = require('electron')

const startURL = process.env.ELECTRON_START_URL || url.format({
  pathname: path.join(__dirname, 'build/index.html'),
  protocol: 'file:',
  slashes: true
})

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({ width: 800, height: 600 })
  mainWindow.loadURL(startURL)

  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  ipcMain.on('notificate', (event, { newNumbers }) => {
    const requestedReviewsNotification = new Notification({
      title: 'Requested Reviews!',
      body: `You have ${newNumbers.length} requested reviews!`,
    })

    requestedReviewsNotification.show()
  })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  app.quit()
})
app.on('activate', () => {
  mainWindow === null ? createWindow() : false
})

