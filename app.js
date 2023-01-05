const getEl = (id) => document.getElementById(id)

baud = getEl("idBaud")
conn = getEl("idConnect")
close = getEl("idClose")
report = getEl("idReport")

tMax = getEl("tempMax")
tMin = getEl("tempMin")
tAver = getEl("tempAver")
hMax = getEl("humiMax")
hMin = getEl("humiMin")
hAver = getEl("humiAver")

let reader;
let result;
let baudRate;
let arrayTmp;
let array;
let customChart;
let date;
let days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
let months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

moment.locale('es')

const charts = (id, type, data, options) => {
    var ctx = document.getElementById(id).getContext('2d');

    if (customChart) {
        customChart.destroy()
    }

    customChart = new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

const readLoop = async () => {
    while (true) {
        const { value, done } = await reader.read();

        if (value) {
            result += value;
            result = result.replace(/\r/g, "%")
            result = result.replace(/\n/g, "%")
            arrayTmp = result.split("%%")
            arrayTmp = arrayTmp.map(a => a.split(","))

            array = arrayTmp.map(a => {
                let t = new Date(parseInt(a[0] * 1000))
                time = `${t.getUTCHours()}:${t.getUTCMinutes()}:${t.getUTCSeconds()}`
                time = (time === 'NaN:NaN:NaN') ? time = '' : time;
                date = moment(new Date()).format("dddd, DD MMMM YYYY")
                return {
                    time: time, temp: parseFloat(a[1]), humi: parseFloat(a[2])
                }
            })
            array = array.filter(i => i.time !== '').filter(i => i.temp > 0).filter(i => i.humi > 0)

            tempMax = array.reduce((a, b) => { return Math.max(a, b.temp) }, 0)
            tempMin = array.reduce((a, b) => { return Math.min(a, b.temp) }, Infinity)
            tempAver = array.reduce((a, b) => { return (a + b.temp) / 2 }, 0)

            humiMax = array.reduce((a, b) => { return Math.max(a, b.humi) }, 0)
            humiMin = array.reduce((a, b) => { return Math.min(a, b.humi) }, Infinity)
            humiAver = array.reduce((a, b) => { return (a + b.humi) / 2 }, 0)

            arrayTime = array.map(a => a.time)
            arrayTemp = array.map(a => a.temp)
            arrayHumi = array.map(a => a.humi)

            let temp = {
                data: {
                    labels: [...arrayTime],
                    datasets: [
                        {
                            label: "Temperatura",
                            data: arrayTemp,
                            tension: 0.5
                        },
                        {
                            label: "Humedad",
                            data: arrayHumi,
                            tension: 0.5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    elements: {
                        point: {
                            pointStyle: 'rectRot',
                            borderWidth: 0,
                            radius: 5
                        }
                    },
                    animation: {
                        duration: 0,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `Lectura de sensores ${date}`
                        }
                    }
                }
            }

            charts("line", "line", temp.data, temp.options)

            tMax.innerHTML = tempMax.toFixed(2)
            tMin.innerHTML = tempMin.toFixed(2)
            tAver.innerHTML = tempAver.toFixed(2)
            hMax.innerHTML = humiMax.toFixed(2)
            hMin.innerHTML = humiMin.toFixed(2)
            hAver.innerHTML = humiAver.toFixed(2)
        }



        if (done) {
            reader.releaseLock();
            break;
        }

    }
}

baud.addEventListener('input', (e) => {
    baudRate = e.target.value
    conn.style.display = 'flex'
})

conn.addEventListener('click', async () => {
    conn.style.display = 'none'
    close.style.display = 'flex'
    port = await navigator.serial.requestPort();
    // - Wait for the port to open.
    await port.open({ baudRate: baudRate });

    let decoder = new TextDecoderStream();
    let inputDone = port.readable.pipeTo(decoder.writable);
    let inputStream = decoder.readable;

    reader = inputStream.getReader();
    readLoop();

})