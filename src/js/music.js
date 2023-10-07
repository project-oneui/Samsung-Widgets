const Vibrant = require('node-vibrant')
const os = require('os');
const fs = require('fs');
const path = require('path');
const { json } = require('body-parser');

const folderPath = path.join(os.homedir(), 'AppData', 'Local', 'Samsung-Widgets');

window.addEventListener("DOMContentLoaded", () => {
    // change color based on Setting
    const colorData = JSON.parse(fs.readFileSync(path.join(folderPath, 'color.json'), 'utf8'));

    const containerMain = document.getElementById("container-main");

    const day = document.getElementsByClassName('day')
    // Check its not black
    containerMain.style.background = `linear-gradient(135deg, rgb(${colorData.red}, ${colorData.green}, ${colorData.blue}) 0%, rgb(${colorData.red - 35}, ${colorData.green - 35}, ${colorData.blue - 35}) 100%)`;

    // check if text should be white or black
    function getLuminance(r, g, b) {
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    const backgroundLuminance = getLuminance(colorData.red, colorData.green, colorData.blue);
    const textColor = backgroundLuminance > 128 ? 'black' : 'var(--text)';
    const secondaryColor = backgroundLuminance > 128 ? 'var(--secondary-darker)' : 'var(--secondary-lighter)';

    document.getElementById("music-artists").style.color = secondaryColor;
    document.getElementById("music-position").style.color = secondaryColor;
    document.getElementById("music-duration").style.color = secondaryColor;
    var progressBar = document.querySelector('progressbar');
    progressBar.style.backgroundColor = secondaryColor;
    containerMain.style.color = textColor;

    function setInfo() {
        const jsonData = JSON.parse(fs.readFileSync(folderPath + '\\temp\\songInfo.json', 'utf8'));

        if (jsonData.CoverUrl == "") {
            if (colorData.red != 8) {
                containerMain.style.background = `linear-gradient(135deg, rgb(${colorData.red}, ${colorData.green}, ${colorData.blue}) 0%, rgb(${colorData.red - 35}, ${colorData.green - 35}, ${colorData.blue - 35}) 100%)`;
            } else {
                containerMain.style.backgroundColor = '#080808'
            }
            document.getElementById("music-cover").src = "../res/generic-cover.png";
        } else {
            document.getElementById("music-cover").src = jsonData.CoverUrl + "?" + Date.now();
            Vibrant.from(jsonData.CoverUrl).getPalette()
                .then((palette) => {
                    const LightRGB = palette.DarkVibrant._rgb;
                    document.getElementById("container-main").style.background = `linear-gradient(180deg, rgba(${LightRGB[0]}, ${LightRGB[1]}, ${LightRGB[2]}, 1) 0%, rgba(${LightRGB[0] - 25}, ${LightRGB[1] - 25}, ${LightRGB[2] - 25}, 1) 100%)`
                })
        }

        if (jsonData.Title == "") {
            document.getElementById("music-title").innerHTML = "No Song found";
        } else {
            document.getElementById("music-title").innerHTML = jsonData.Title;
        }
        document.getElementById("music-artists").innerHTML = jsonData.Artist;
        document.getElementById("music-position").innerHTML = jsonData.Position;
        document.getElementById("music-progress").style.width = jsonData.PositionPercent + "%";
        document.getElementById("music-duration").innerHTML = jsonData.Duration;
    }

    setInfo();
    setInterval(setInfo, 500)

});

