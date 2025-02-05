const { app, dialog, BrowserWindow, ipcMain, Menu } = require("electron");
const exec = require('child_process').exec;
var main, loading;

app.allowRendererProcessReuse = false;
app.commandLine.appendSwitch('ignore-certificate-errors');

function openMainWindow(installKeyCloak) {
    main = new BrowserWindow({
        width: 1024,
        height: 768,
        nodeIntegration: "iframe",
        webPreferences: { nodeIntegration: true, webviewTag: true, webSecurity: true, additionalArguments: ["--installKeyCloak=" + installKeyCloak] }
        //icon: `file://${_dirname}/dist/assets/logo.png`
    });
    main.loadURL("file://" + __dirname + "/../www/index.html");
    main.webContents.openDevTools()
    main.setMenuBarVisibility(false);
    main.maximize();
    main.on("closed", function () {
        main = null;
    });
    main.show();
    if (loading !== undefined) {
        loading.destroy();
    }
}

async function openLoadingWindow() {
    loading = new BrowserWindow({ show: false, frame: false, width: 480, height: 270, resizable: false });
    loading.loadURL("file://" + __dirname + "/../www/assets/loading.gif");
    loading.show();
    exec('sh -c "./back/init.sh"', (err, stdout, stderr) => {
        console.error("Stdout to init:" + stdout);
        console.error("Stderr to init:" + stderr);
        if (err === null) {
            openMainWindow(false);
        } else {
            console.error("Error: " + err);
            if (err.code === 1) {
                dialog.showErrorBox("Error", "The file .kube/config not found in home directory");
                app.quit();
                return;
            }
            if (err.code === 2) {
                dialog.showErrorBox("Error", "Unable to access kubernetes");
                app.quit();
                return;
            }
            if (err.code === 3) {
                console.log("Keycloak is not installed");
                openMainWindow(true);
            }
            if (err.code === 4) {
                console.log("O.S. not supported");
                app.quit();
                return;
            }
        }
    });
}

//Menus
const logedMenu = Menu.buildFromTemplate([{
    label: "K8sProcect",
    submenu: [
        {label:'Manage', type: "submenu", submenu: [
            {label:'Software', click(){ main.webContents.send("view-tool-modal");}},
            {label:'Projects', click(){ main.webContents.send("view-projects-modal");}},
            {label:'Users', click(){ main.webContents.send("view-users-modal");}},
        ]},
        {label:'Profile', type: "submenu", submenu: [
            {label:'View', click(){main.webContents.send("view-profile");}},
            {label:'Logout', click(){
                Menu.setApplicationMenu(logoutMenu);
                main.webContents.send("menu-logout");
            }}
        ]},
        {type:'separator'},
        {label:'Exit', click() { app.quit() }}
    ]
}]);

const logoutMenu = Menu.buildFromTemplate([{
    label: "K8sProcect",
    submenu: [
        {type:'separator'},
        {label:'Exit', click() { app.quit() }}
    ]
}]);

//Disable menu config on init
Menu.setApplicationMenu(logoutMenu);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    // On macOS specific close process
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.whenReady().then(openLoadingWindow)

app.on('activate', () => {
    // En macOS es común volver a crear una ventana en la aplicación cuando el
    // icono del dock es clicado y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) {
        openLoadingWindow();
    }
});

function execCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) reject(error);
            resolve(stdout ? stdout : stderr);
        });
    });
}

//Enable menu
ipcMain.handle("enable-menu", async(event, args)=>{
    Menu.setApplicationMenu(logedMenu);
});

//Get config
ipcMain.handle("get-config", async(event, args)=>{
    return await execCommand('kubectl get configMap --namespace k8s-project k8s-project-config -o json');
});

//install keycloak
ipcMain.handle('install-keycloak', async (event, credentials) => {
    return await execCommand('sh -c "./back/install_tools.sh k8s-project-keycloak ' + credentials.username + ' ' + credentials.password + '"');
});

//get installed tools
ipcMain.handle("get-installed-tools", async(event, args)=>{
    return await execCommand('helm ls --namespace k8s-project --output json');
});

//install tool
ipcMain.handle('install-tool', async (event, tool) => {
    await execCommand('sh -c "./back/install_tools.sh ' + tool + '"');

});

//uninstall tool
ipcMain.handle('uninstall-tool', async (event, tool) => {
    return await execCommand('sh -c "./back/uninstall_tools.sh ' + tool + '"');
});