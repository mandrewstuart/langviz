const state = {};


function getCursorPosition(event) {
    canvas = document.getElementById('myCanvas');
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    let found = false;
    for (i=0; i<state.pointsToDraw.length; i++) {
        let point = state.pointsToDraw[i];
        dist = Math.sqrt(Math.pow(point.X_coord - x, 2) + Math.pow(point.Y_coord - y, 2))
        if (dist <= 10) {
            found = true;
            document.getElementById('clicked_on_sentence').innerText = `From cluster ${point.cluster_label}: ` + point.sentence.substring(1, point.sentence.length - 1);
        }
        if (found) break;

    }
    if (!found) {
        document.getElementById('clicked_on_sentence').innerText = '';
    }
}

document.getElementById('myCanvas').addEventListener('click', getCursorPosition);

function generateRandomColors(number) {
    const possibleColours = 16777215;
    const firstColour = Math.floor(Math.random() * possibleColours);
    const interval = Math.floor(possibleColours / number);
    const colours = [];
    for (i = 0; i < number; i++) {
        colours.push('#' + ((firstColour + interval * i) % possibleColours).toString(16));
    }
    return colours;
}

const makeCircle = (x, y, color) => {
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var radius = 10;

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.stroke();
}

const splitDataIntoClusterLists = () => {
    state.cluster_list = Array.from(new Set(state.data.map(elem => elem.cluster_label)))
        .sort((a, b) => Number(a.substring(1, a.length)) > Number(b.substring(1, b.length)));
    state.cluster_members = {}
    for (i = 0; i < state.cluster_list.length; i++) {
        state.cluster_members[state.cluster_list[i]] = [];
    }
    state.data.forEach(elem => {
        state.cluster_members[elem.cluster_label].push(elem);
    })
}

const putRequestOntoState = (csv) => {
    rows = csv.split("\n");
    headers = rows.splice(0, 1)[0];
    headers = headers.split(',');
    state.data = rows.map(row => row.split(',')).map(row => {
        obj = {}
        for (i = 0; i < headers.length; i++) {
            obj[headers[i]] = row[i]
        }
        obj.X_coord = Number(obj.X_coord)
        obj.Y_coord = Number(obj.Y_coord)
        return obj;
    })
}

const fetchAndDraw = () => {
    document.getElementById("cluster_controls").innerHTML = "Computing... The map will update soon.";
    const userText = document.getElementById("user_text").value;
    const numClusters = document.getElementById("num_clusters").value;

    fetch("/transform", {
        method: "POST",
        body: JSON.stringify({ text: userText, numClusters })
    })
        .then(data => data.text())
        .then(putRequestOntoState)
        .then(splitDataIntoClusterLists)
        .then(newColours)
        .then(fillInClusterControls)
        .then(displaySingleCluster)
}

const displaySingleCluster = (cluster_label) => {
    state.selectedCluster = cluster_label;
    drawPoints(state.selectedCluster);
    drawText(state.selectedCluster);
}

const fillInClusterControls = () => {
    const div = document.getElementById("cluster_controls");
    let options = `<input type="radio" name="clusterSelector" onclick="displaySingleCluster('all')" checked>all<br />`;
    options += state.cluster_list
        .map(item => `<input type="radio" name='clusterSelector' onclick="displaySingleCluster('${item}')">
        <font color="${state.cluster_colours[item]}">${item}</font> ${state.cluster_members[item].length} items
        <br />`)
        .join('');
    div.innerHTML = options;
}

const getMeNewColours = () => {
    newColours();
    drawPoints(state.selectedCluster);
    fillInClusterControls();
    drawText(state.selectedCluster)
}

const clearCanvas = () => {
    const canvas = document.getElementById('myCanvas')
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const newColours = () => {
    state.cluster_colours = {};
    const newColours = generateRandomColors(state.cluster_list.length);
    for (i = 0; i < state.cluster_list.length; i++) {
        state.cluster_colours[state.cluster_list[i]] = newColours[i];
    }
}

const deepCopy = (data) => JSON.parse(JSON.stringify(data));

const drawPoints = (clusterId) => {
    clearCanvas();
    let pointsToDraw = state.cluster_members[clusterId] || state.data;
    pointsToDraw = deepCopy(pointsToDraw);
    state.pointsToDraw = pointsToDraw
    // determine scale
    Xs = [];
    Ys = [];
    pointsToDraw.forEach(function (d) {
        Xs.push(d.X_coord);
        Ys.push(d.Y_coord);
    })

    Xmax = Math.max(...Xs);
    Xmin = Math.min(...Xs);
    Ymax = Math.max(...Ys);
    Ymin = Math.min(...Ys);

    //draw
    canvas = document.getElementById('myCanvas')
    const border = 50;
    if (pointsToDraw.length > 1) {
        for (i = 0; i < pointsToDraw.length; i++) {
            pointsToDraw[i].X_coord = border/2 + (canvas.width - border) * (pointsToDraw[i].X_coord - Xmin) / (Xmax - Xmin);
            pointsToDraw[i].Y_coord = border/2 + (canvas.height - border) * (pointsToDraw[i].Y_coord - Ymin) / (Ymax - Ymin);
            makeCircle(pointsToDraw[i].X_coord, pointsToDraw[i].Y_coord, state.cluster_colours[pointsToDraw[i].cluster_label])
        }
    } else {
        pointsToDraw[0].X_coord = canvas.width/2;
        pointsToDraw[0].Y_coord = canvas.height/2;
        makeCircle(pointsToDraw[0].X_coord, pointsToDraw[0].Y_coord, state.cluster_colours[pointsToDraw[0].cluster_label])
    }
}

const drawText = (clusterId) => {
    textContainer = document.getElementById("coloured_text");
    textContainer.innerHTML = '';
    state.data.forEach(item => {
        textContainer.innerHTML += `<span style="
color: ${item.cluster_label === state.selectedCluster ? 'yellow' : 'black'};
background-color: ${item.cluster_label === state.selectedCluster ? 'black' : 'white'};
">
${item.sentence.substring(1, item.sentence.length - 1)}. 
        </span>`
    })
}
