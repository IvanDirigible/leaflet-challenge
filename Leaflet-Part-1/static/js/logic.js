// API endpoint for earthquakes in the past 7 days
let queryEarthUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// GET request to URL
d3.json(queryEarthUrl).then(function (data) {

  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });
  
  function markerSize(mag) {
    return Math.pow(10, mag/2) * 1000
  };

  let myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 5,
    layers: [street]
  });

  let baseMaps = {
    Street: street,
    Topographic: topo
  };

  function negativeDetector(mag) {
    if (mag < 0) {
      return mag /-10;
    } else {
      return mag;
    }
  };

  let depthChecker = data.features.map(feature => feature.geometry.coordinates[2]);
  let min = Math.min(...depthChecker);
  let max = Math.max(...depthChecker);
  let mid = depthChecker.reduce((acc, depth) => acc + depth, 0) / depthChecker.length

  function depthToColor(depth) {
    let shallowColor = [220, 255, 220]
    let midColor = [0, 90, 0]
    let deepColor = [45, 0, 0]
    
    if (depth <= mid) {
      let degree = (depth - min) / (mid - min)
      let r = Math.round(shallowColor[0] + (midColor[0] - shallowColor[0]) * degree)
      let g = Math.round(shallowColor[1] + (midColor[1] - shallowColor[1]) * degree)
      let b = Math.round(shallowColor[2] + (midColor[2] - shallowColor[2]) * degree)
      return `rgb(${r}, ${g}, ${b})`
    } else{
      let degree = (depth - mid) / (max - mid)
      let r = Math.round(midColor[0] + (deepColor[0] - midColor[0]) * degree)
      let g = Math.round(midColor[1] + (deepColor[1] - midColor[1]) * degree)
      let b = Math.round(midColor[2] + (deepColor[2] - midColor[2]) * degree)
      return `rgb(${r}, ${g}, ${b})`
    }
  };

  L.control.layers(baseMaps).addTo(myMap);

  for (let i = 0; i < data.features.length; i++) {
    let lon = data.features[i].geometry.coordinates[0]
    let lat = data.features[i].geometry.coordinates[1]
    let depth = data.features[i].geometry.coordinates[2]

    L.circle([lat, lon], {
      opacity: 0.75,
      fillOpacity: 0.75,
      color: depthToColor(depth),
      fillColor: depthToColor(depth),
      radius: negativeDetector(markerSize(data.features[i].properties.mag)),
      zIndexOffset: depth
    }).bindPopup(`<h2 style="text-align:center">Magnitude: ${data.features[i].properties.mag}</h2><h3 style="text-align:center">Time: ${Date(data.features[i].properties.time)}</h3><h3 style="text-align:center">Location: ${data.features[i].properties.place}</br>(${lat}, ${lon})</h3><h3 style="text-align:center; color:${depthToColor(depth)}">Depth: ${depth} km</h3>`).addTo(myMap)
  };

  let legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    let div = L.DomUtil.create('div', 'info legend')
    let lowerDepths = []
    let upperDepths = []
    let halfInterval = 5

    let lowerStep = (mid - min) / (halfInterval - 1)
    for (let i = 0; i < halfInterval; i++) {
      lowerDepths.push(min + i * lowerStep)
    }

    let upperStep = (max - mid) / (halfInterval - 1);
    for (let i = 0; i < halfInterval; i++) {
      upperDepths.push(mid + i * upperStep);
    }

    let depths = lowerDepths.concat(upperDepths.slice(1))

    let labels = depths.map(depth => {
        return `<i style="background: ${depthToColor(depth)}; width: 20px; height: 20px; display: inline-block;"></i>${depth.toFixed(2)}`
    });

    div.innerHTML = `<h4>Depth (km)</h4>` + labels.join('<br>');
    return div;
};

legend.addTo(myMap);
});