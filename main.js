const { app, BrowserWindow, Menu, Tray } = require('electron');
const Vibrant = require('node-vibrant');
const express = require('express');
const server = require('./src/js/battery-listener');
const os = require('os')
const fs = require('fs')
const path = require('path');
const icon = __dirname + '/favicon.ico'
const { spawn } = require('child_process');

var moveable = false;

// checks if the appExe is named electron so it doesn't autostart electron.exe while developing
if (!app.getPath('exe').includes('electron')) {
    // starts the app at login
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });
}

// starts the background Serivce which provides information for the music and device care widget
const backgroundServicePath = path.join(path.dirname(app.getPath('exe')), 'backgroundService', 'backgroundService.exe')

// Check if the file exists
if (fs.existsSync(backgroundServicePath)) {
    const backgroundServiceChild = spawn(backgroundServicePath);
}

// declares the variables so the app doesnt outputs many error 
let musicWidget = null;
let batteryWidget = null;
let deviceCareWidget = null;
let weatherWidget = null;
let topStoriesWidget = null;
let flightWidget = null;
let calendarWidget = null;
let quickNotesWidget = null;
let digitalClockWidget = null;
let forecastWidget = null;
let upcomingMoviesWidget = null;
let hoursForecastWidget = null;

const folderPath = path.join(os.homedir(), 'AppData', 'Local', 'Galaxy-Widgets');

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

// All JSONs that are created for storing information/settings

const positionData = {
    musicWidget: { y: "75", x: "75" },
    batteryWidget: { y: "225", x: "75" },
    deviceCareWidget: { y: "400", x: "75" },
    weatherWidget: { y: "550", x: "75" },
    flightWidget: { y: "700", x: "75" },
    topStoriesWidget: { y: "75", x: "475" },
    calendarWidget: { y: "300", x: "475" },
    quickNotesWidget: { y: "550", x: "475" },
    digitalClockWidget: { y: "75", x: "875" },
    forecastWidget: { y: "750", x: "475" },
    upcomingMoviesWidget: { y: "200", x: "875" },
    hoursForecastWidget: { y: "425", x: "875" },
};

const stateData = {
    musicWidget: { show: "true" },
    batteryWidget: { show: "true" },
    deviceCareWidget: { show: "true" },
    weatherWidget: { show: "true" },
    topStoriesWidget: { show: "false" },
    flightWidget: { show: "false" },
    calendarWidget: { show: "true" },
    quickNotesWidget: { show: "true" },
    digitalClockWidget: { show: "true" },
    forecastWidget: { show: "false" },
    upcomingMoviesWidget: { show: "false" },
    hoursForecastWidget: { show: "false" },
};

const weatherData = {
    iplocation: true,
    weather_country: "",
    weather_name: "",
};

const flightData = {
    flight_code: "",
};

const colorData = {
    background: {
        red: 28,
        green: 28,
        blue: 28
    },
    text: {
        red: 250,
        green: 250,
        blue: 250
    },
    secondary: {
        red: 120,
        green: 120,
        blue: 120
    },
    primary: {
        red: 170,
        green: 167,
        blue: 195
    }
};

function createJSONFile(filePath, data) {
    let existingData = {};

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        existingData = JSON.parse(fileContent);
    }

    // Merge existing data with new data, adding missing keys and setting default values
    const updatedData = {
        ...data,
        ...existingData,
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 4));
}

// Creates or updates JSON files for the app
createJSONFile(path.join(folderPath, 'widgetPositions.json'), positionData);
createJSONFile(path.join(folderPath, 'widgetStates.json'), stateData);
createJSONFile(path.join(folderPath, 'weatherOptions.json'), weatherData);
createJSONFile(path.join(folderPath, 'flightOptions.json'), flightData);
createJSONFile(path.join(folderPath, 'color.json'), colorData);


// info for widget windows
const widgetsData = {
    widgets: [
        { name: "musicWidget", width: 390, height: 125, html: "./src/widgets/music/music.html", "clickthrough": true },
        { name: "batteryWidget", width: 390, height: 150, html: "./src/widgets/deviceCare/battery.html", "clickthrough": true },
        { name: "deviceCareWidget", width: 390, height: 125, html: "./src/widgets/deviceCare/deviceCare.html", "clickthrough": true },
        { name: "weatherWidget", width: 390, height: 125, html: "./src/widgets/weather/weather.html", "clickthrough": true },
        { name: "topStoriesWidget", width: 390, height: 200, html: "./src/widgets/news/topStories.html", "clickthrough": true },
        { name: "flightWidget", width: 390, height: 175, html: "./src/widgets/wallet/flight.html", "clickthrough": true },
        { name: "calendarWidget", width: 390, height: 225, html: "./src/widgets/calendar/calendar.html", "clickthrough": true },
        { name: "quickNotesWidget", width: 390, height: 175, html: "./src/widgets/notes/quickNotes.html", "clickthrough": false },
        { name: "digitalClockWidget", width: 390, height: 100, html: "./src/widgets/clock/digitalClock.html", "clickthrough": true },
        { name: "forecastWidget", width: 390, height: 175, html: "./src/widgets/weather/forecast.html", "clickthrough": true },
        { name: "upcomingMoviesWidget", width: 390, height: 200, html: "./src/widgets/videoPlayer/upcomingMovies.html", "clickthrough": true },
        { name: "hoursForecastWidget", width: 390, height: 175, html: "./src/widgets/weather/hoursForecast.html", "clickthrough": true },
    ],
};

app.on('ready', () => {
    // creates tray for quitting the app+
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Toggle Moveable', click: () => { moveable = !moveable; } },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.quit(); } } // Quit the app completely when clicked
    ]);
    tray.setToolTip('Galaxy Widgets')
    tray.setContextMenu(contextMenu)

    function setStates() {
        const widgetStates = JSON.parse(fs.readFileSync(folderPath + "\\widgetStates.json"))
        const widgetPositions = JSON.parse(fs.readFileSync(folderPath + "\\widgetPositions.json"))

        // goes through each widget
        widgetsData.widgets.forEach(widget => {
            // checks if the widget is enabled and if it doesnt exist (== null)
            if (widgetStates[widget.name].show == "true" && eval(widget.name) == null) {
                const widgetWindow = new BrowserWindow({
                    width: widget.width,
                    height: widget.height,
                    frame: false,
                    transparent: true,
                    resizable: false,
                    transparency: true,
                    skipTaskbar: true,
                    webPreferences: {
                        contextIsolation: false,
                        nodeIntegration: true,
                    }
                });

                // sets clickthrough based on widgetsData
                widgetWindow.setIgnoreMouseEvents(widget.clickthrough)


                // sets the variable to something else than null so it wont get created again
                eval(`${widget.name} = widgetWindow`)

                // sets the position | uses setBounds because setPosition makes the widget bigger in anything else than 100% scaling
                if (eval(widget.name) != null) {
                    widgetWindow.setBounds({
                        width: widget.width,
                        height: widget.height,
                        x: parseInt(widgetPositions[widget.name].x),
                        y: parseInt(widgetPositions[widget.name].y)
                    });
                }

                widgetWindow.loadFile(path.join(__dirname, widget.html));


                // sets the variable again to null when its closed
                widgetWindow.on('closed', () => {
                    eval(`${widget.name} = null`);
                });

                // fixes widget appearing in taskbar
                widgetWindow.on('focus', () => {
                    widgetWindow.setSkipTaskbar(true)
                });


                widgetWindow.on('moved', () => {
                    let roundedX, roundedY;

                    const currentPosition = widgetWindow.getPosition()
                    const currentX = currentPosition[0];
                    const currentY = currentPosition[1];

                    roundedX = Math.round(currentX / 25) * 25;
                    roundedY = Math.round(currentY / 25) * 25;

                    widgetPositions[widget.name].x = roundedX.toString();
                    widgetPositions[widget.name].y = roundedY.toString();
                    fs.writeFileSync(path.join(folderPath, 'widgetPositions.json'), JSON.stringify(widgetPositions, null, 4));

                    widgetWindow.setBounds({
                        width: widget.width,
                        height: widget.height,
                        x: roundedX,
                        y: roundedY
                    });
                });


            }
            // destroys window if it gets deactivated
            else if (widgetStates[widget.name].show != "true" && eval(widget.name) != null) {
                eval(`${widget.name}.destroy()`);
                eval(`${widget.name} = null`);

            }
            // fixes widget appearing in taskbar
            else if (widgetStates[widget.name].show == "true" && eval(widget.name) != null) {
                // eval(`${widget.name}.setBounds({
                //     width: ${widget.width},  
                //      height: ${widget.height},  
                //      x: parseInt(widgetPositions[widget.name].x),
                //      y: parseInt(widgetPositions[widget.name].y), 
                // })`)

                eval(`${widget.name}.setIgnoreMouseEvents(${!moveable})`)
                eval(`${widget.name}.setMovable(${moveable})`)
            }
        });
    }

    setStates()
    setInterval(function () {
        setStates();
    }, 400);
});

// hot reloader for easier development
try {
    require('electron-reloader')(module)
} catch (_) { }