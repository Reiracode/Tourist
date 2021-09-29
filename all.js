let yourPositon, infoData, filterData;
const loading = document.getElementById("loading");
const maskSize = document.querySelector("#mask_sel");
const api =
  "https://ptx.transportdata.tw/MOTC/v2/Tourism/ScenicSpot/Taipei?$top=300&$format=JSON";
// 25.0224296 121.4994827
// const api =
//   "https://ptx.transportdata.tw/MOTC/v2/Tourism/ScenicSpot/Taipei?$top=1000&$spatialFilter=nearby(25.0224296%2C121.4994827%2C30000000)&$format=JSON";
// const api =
//   "https://ptx.transportdata.tw/MOTC/v2/Tourism/ScenicSpot/Chiayi?$top=1000&$format=JSON";
const jpg =
  "https://images.unsplash.com/photo-1550760146-f2f4cf8961f1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80";
let mymarker,
  map,
  mymap,
  markers,
  markersRef = [];
// ios mobile height
let vh = window.innerHeight * 0.01;

document.documentElement.style.setProperty("--vh", `${vh}px`);
window.addEventListener("resize", () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
});

//ICON
let greenIcon = createIcon("icon-11");
let redIcon = createIcon("warehouse-solid");
let userIcon = createIcon("icon-blue");
function createIcon(name) {
  return new L.Icon({
    iconUrl: `./icon/${name}.png`,
    iconSize: [30, 30],
    iconAnchor: [16, 36],
    popupAnchor: [1, -34],
    // color: "red"
  });
}
function createIcons(name) {
  return new L.Icon({
    // return new L.divIcon({
    //  html: item,
    iconUrl: `./img/${name}.jpeg`,
    iconSize: [30, 30],
    iconAnchor: [16, 36],
    popupAnchor: [1, -34],
  });
}
function createMaskIcon(path) {
  return new L.Icon({
    iconUrl: path,
    iconSize: [60, 60],
    iconAnchor: [16, 36],
    popupAnchor: [1, -34],
  });
}

const getPosition = () => {
  // function getPosition() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      const position = (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      };
      const showError = (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("讀取不到您目前的位置");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("讀取不到您目前的位置");
            break;
          case error.TIMEOUT:
            alert("讀取位置逾時");
            break;
          case error.UNKNOWN_ERROR:
            alert("Error");
            break;
        }
        resolve([23.954635, 120.571868]);
      };
      navigator.geolocation.getCurrentPosition(position, showError);
    }
  });
};

const getAllPoints = async () => {
  const response = await fetch(api);
  const json = await response.json();
  return json;
};

async function getPoints() {
  const [position, points] = await Promise.all([getPosition(), getAllPoints()]);
  yourPositon = position;
  infoData = points;
  infoData = infoData.filter(({ Name, DescriptionDetail }) => {
    return !!DescriptionDetail
      ? DescriptionDetail.indexOf("日式") !== -1 ||
          DescriptionDetail.indexOf("日本") !== -1 ||
          DescriptionDetail.indexOf("日治") !== -1
      : "" || Name.indexOf("國立中正紀念堂") !== -1;
  });

  // console.log(yourPositon);
  console.log(infoData);
  drawMap();
  nearestStore();
  loading.style.display = "none";
}

getPoints();

// map on load  //markerClusterGroup Customising the Clustered Markers
function drawMap() {
  mymap = L.map("maskmap").on("load", onMapLoad).setView(yourPositon, 15);

  markers = L.markerClusterGroup({
    maxClusterRadius: 120,
    iconCreateFunction: function (cluster) {
      let childCount = cluster.getChildCount();
      let group = " marker-cluster-";
      if (childCount < 5) {
        group += "small";
      } else if (childCount < 10) {
        group += "medium";
      } else {
        group += "large";
      }
      return new L.DivIcon({
        html: "<div><span>" + childCount + "</span></div>",
        className: "marker-cluster" + group,
        iconSize: new L.Point(40, 40),
      });
    },
  });

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tiles = L.tileLayer(tileUrl, { attribution });
  tiles.addTo(mymap);
  getMymarker();
}

//重新整理
async function relocate() {
  loading.style.display = "flex";
  mymap.removeLayer(mymarker);
  document.querySelector(".county").value = "";
  document.querySelector(".district").value = "";
  yourPositon = await getPosition();
  console.log(yourPositon);
  getMymarker(); // 現在位置
  nearestStore();
  loading.style.display = "none";
  document.querySelector("#relocate").classList.remove("active");
}

// 現在位置
function getMymarker() {
  function twnIcons() {
    return new L.divIcon({
      html: '<i class="twicon-san-domingo"></i>',
      iconSize: [60, 60],
      className: "myDivIcon",
    });
  }
  const fontAwesomeIcon = L.divIcon({
    html: '<i class="twicon-san-domingo"></i>',
    iconSize: [60, 60],
    className: "myDivIcon",
  });

  mymarker = L.marker(yourPositon, { icon: twnIcons() })
    .addTo(mymap)
    .bindPopup("You're here!")
    .openPopup();
}

//經緯度算距離
function getDistance(origin, destination) {
  lat1 = origin[0];
  lng1 = origin[1];
  lat2 = destination[0];
  lng2 = destination[1];
  // console.log(lat1, lng1)
  //   console.log(lat2, lng2);
  return (
    2 *
    6378.137 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((Math.PI * (lat1 - lat2)) / 360), 2) +
          Math.cos((Math.PI * lat1) / 180) *
            Math.cos((Math.PI * lat2) / 180) *
            Math.pow(Math.sin((Math.PI * (lng1 - lng2)) / 360), 2)
      )
    )
  );
}

//filter by dsitance <1KM
function nearestStore() {
  console.log(yourPositon[0], yourPositon[1]);
  console.log(infoData[1].Position.PositionLon);
  const res = infoData.filter(
    (point) =>
      getDistance(
        [yourPositon[0], yourPositon[1]],
        [point.Position.PositionLat, point.Position.PositionLon]
      ) < 300
  );
  filterData = res;
  console.log(res);

  const nameList = Object.values(filterData).map((items) => items.Level);
  // console.log(nameList);

  var index = Array.from(new Set(nameList));
  console.log(index);

  renderMask();
}

function markClick(event) {
  let id = event.layer._leaflet_id;
  let markIndex = markersRef.map((items) => items._leaflet_id).indexOf(id);
  // console.log(markIndex);
  //scroll對應到overlay id的位子點地圖上icon位置的 ，找到click id的index 15
  // if (!!document.querySelector(".overlay.active>.datalist")) {
    let overlaylist = document.querySelector(".overlay.active>.datalist");
    let divid = overlaylist.id;
    let all = document.querySelectorAll(`#${divid}>.spot_detail`);
    marginBtom = all[0].marginBottom;
    let margbtm = marginBtom.substr(0, marginBtom.length - 2);
    //5px  scrollto 只算前段的div的高度  index=5  len=6 calcu div*index==>index 3  ==>  0+1+2
    let sum = 0;
    for (let i = 0; i < markIndex; i++) {
      sum += parseInt(all[i].scrollWidth) + parseInt(margbtm);
    }
    document.getElementById(`${divid}`).scrollTo(0, sum);
  // }
}

//select all / adult/ child
 

//************************************************
function onMapLoad() {
  console.log("Map successfully loaded");
}

function twnIcons(path) {
  return new L.divIcon({
    html: `<i class="twicon-${path}"></i>`,
    iconSize: [60, 60],
    className: "myDivIcon",
  });
}

let info = document.querySelector(".side_detail");
function renderMask() {
  markers.clearLayers();
  markersRef = [];

  let s_list = document.querySelector(".datalist");
  let focus = filterData[0].Position;
  mymap.setView([focus.PositionLat, focus.PositionLon], 15);

  let el = "";
  let alldata = filterData.sort(({ Position: a }, { Position: b }) => {
    return (
      getDistance(
        [yourPositon[0], yourPositon[1]],
        [a.PositionLat, a.PositionLon]
      ) -
      getDistance(
        [yourPositon[0], yourPositon[1]],
        [b.PositionLat, b.PositionLon]
      )
    );
  });


//  san-domingo
  alldata.forEach((item) => {
    let cion;
    if (!item.Name.includes("總統府")) {
      cion = twnIcons("president-office");
      // console.log(cion);
    }
    // else if (item.Name.indexOf("台灣博物館")) {
    //     cion = twnIcons("nt-mus");
    // } else {
    //   cion = twnIcons("san-domingo");
    // }

    // console.log(cion);
    mask = !!item.Picture.PictureUrl1
      ? !!item.Name.includes("總統府")
        ? twnIcons("president-office")
        : createMaskIcon(jpg)
      : createIcons("factory");

    let marker = L.marker(
      new L.LatLng(item.Position.PositionLat, item.Position.PositionLon),
      {icon: mask,}
    );
    //********************************************* */
    let distance = getDistance(
      [yourPositon[0], yourPositon[1]],
      [item.Position.PositionLat, item.Position.PositionLon]
    );
    el += `<div class="spot_detail">
          ${
            !!item.Picture.PictureUrl1
              ? `<div class="detail_img">
                    <img src=${jpg} alt="" />
                </div>`
              : " "
          }
        <h2 class="spot_title">${item.Name}
          <span><i class="fas fa-map-marker-alt"></i>
              ${
                distance >= 1
                  ? distance.toFixed(1) + "km"
                  : ((distance * 1000) >> 0) + "m"
              }
          </span>
        </h2>
      </div>`;
    s_list.innerHTML = el;
    marker.bindPopup(`<h2>${item.Name}</h2>`);
    marker.on("mouseover", function (ev) {
      marker.openPopup();
    });
    markersRef.push(marker);
    markers.addLayer(marker);
  });

  s_list.scrollTo(0, 0);
  mymap.addLayer(markers);
  //marker 點時，算高度到scroll如果有資料，scroll to index
  markers.on("click", (event) => {
    let id = event.layer._leaflet_id;
    let markIndex = markersRef.map((items) => items._leaflet_id).indexOf(id);
    document.querySelector(".side_info").classList.add("active");

    el = `${
      !!alldata[markIndex].Picture.PictureUrl1
        ? `<div class="sidedetail_img">
              <img src="${jpg}" alt="" />
          </div>`
        : " "
    }
    <div class="detail_body">
      <h2 class="spot_title">
        <a href="${alldata[markIndex].WebsiteUrl}" target="_blank">
        ${alldata[markIndex].Name}</a>
      </h2>
      <p><i class="far fa-clock"></i> ${alldata[markIndex].OpenTime}</p>
      <div class="hook">
        <p> ${alldata[markIndex].DescriptionDetail}</p>
      </div>
      <button class="view_all"><i class="fas fa-chevron-right">詳全文</i></button>
    </div>`;
    info.innerHTML = el;


    let all = document.querySelectorAll(`#${s_list.id}>.spot_detail`);
    console.log(all)
      marginBtom = getComputedStyle(all[0]).marginBottom;
      let margbtm = marginBtom.substr(0, marginBtom.length - 2);
      sum = 0;
      for (let i = 0; i < markIndex; i++) {
        console.log(all[i].scrollWidth);
        sum += parseInt(all[i].scrollWidth) + parseInt(margbtm);
      }
      document.getElementById(`${s_list.id}`).scrollTo({
        left: sum,
        behavior: "smooth",
      });
    // }
  });
  mymap.doubleClickZoom.disable();
  checkInfox = document.querySelector(".close_overlay");
  checkInfox.addEventListener("click", getStore);

  sideInfo = [...s_list.children];
  sideInfo.forEach((dom) => dom.addEventListener("click", getPoint));

  // document.querySelector(".view_all").addEventListener("click", readAll);

}
 
function getStore(e) {
  // document.querySelector(".close_overlay").addEventListener("click", (e) => {
  console.log(e);
  let closeid = e.currentTarget.parentNode;
  console.log(closeid);
  closeid.classList.remove("active");
  // });
}

function getPoint() {
  // console.log(this);
  // console.log(markersRef);
  if (!markersRef[sideInfo.indexOf(this)].isPopupOpen()) {
    let marker = markersRef[sideInfo.indexOf(this)];
    markers.zoomToShowLayer(marker, function () {
      marker.openPopup();
    });
  }
}
function readAll() {
  console.log(e.parentNode)
}


info.addEventListener("click", (e) => {
  const ta = e.target;
  e.stopPropagation();
  console.log(ta);
  if (ta.className == "view_all") {
    document.querySelector(".detail_body .hook").classList.toggle("open");;
    
  }
});


// L.Routing.control({
//     waypoints: [L.latLng(49.47748, 8.42216), L.latLng(49.47648, 8.32216)],
//     routeWhileDragging: true
//   }).addTo(map);
  

