let yourPositon, infoData, filterData;
const loading = document.getElementById("loading");
const maskSize = document.querySelector("#mask_sel");
// 洧杰申請
//   let AppID = '4ad9f73726a0409a9376afd2b59e59a7';
//  let AppKey = 'iR-j7mJI1CY924a-xfd6vhXZciM';

function getAuthorizationHeader() {
  //  填入自己 ID、KEY 開始
  let AppID = "4ad9f73726a0409a9376afd2b59e59a7";
  let AppKey = "iR-j7mJI1CY924a-xfd6vhXZciM";
  //  填入自己 ID、KEY 結束
  let GMTString = new Date().toGMTString();
  let ShaObj = new jsSHA("SHA-1", "TEXT");
  ShaObj.setHMACKey(AppKey, "TEXT");
  ShaObj.update("x-date: " + GMTString);
  let HMAC = ShaObj.getHMAC("B64");
  let Authorization =
    'hmac username="' +
    AppID +
    '", algorithm="hmac-sha1", headers="x-date", signature="' +
    HMAC +
    '"';
  return { Authorization: Authorization, "X-Date": GMTString };
}

const api =
  "https://ptx.transportdata.tw/MOTC/v2/Tourism/ScenicSpot/Taipei?$top=300&$format=JSON";

// get bike position nearby
let a1 =
  "https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$top=30&$spatialFilter=nearby(25.0375421148651%2C%20121.50675594797%2C%201000)&$format=JSON";
let a2 =
  "https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?$top=30&$spatialFilter=nearby(25.0375421148651%2C%20121.50675594797%2C%201000)&$format=JSON";

function mergeArrayObjects(a1, a2) {
  return a1.map((item, i) => {
    if (item.StationUID === a2[i].StationUID) {
      return Object.assign({}, item, a2[i]);
    }
  });
}
//
let bike_path =
  "https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/NewTaipei?$top=5500&$format=JSON";
// let bike_path = "https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/Taipei?$top=500&$format=JSON"

const getBike = async () => {
  const response = await fetch(a1, {
    headers: getAuthorizationHeader(),
  });
  const json = await response.json();
  return json;
};

const getBike1 = async () => {
  const response = await fetch(a2, {
    headers: getAuthorizationHeader(),
  });
  const json = await response.json();
  return json;
};

const getPath = async () => {
  const response = await fetch(bike_path, {
    headers: getAuthorizationHeader(),
  });
  const json = await response.json();
  return json;
};

let ballsssss, tesing, a3;
async function getBikes() {
  const [a1, a2, bikepath] = await Promise.all([
    getBike(),
    getBike1(),
    getPath(),
  ]);

  // bike position avaiable
  a3 = mergeArrayObjects(a1, a2);
  console.log(a3);
  console.log(bikepath);
  tesing = bikepath;
  // bike path
  ballsssss = bikepath.filter(({ RouteName, Geometry }) => {
    return RouteName.indexOf("自行車道") > -1;
  });

  console.log(ballsssss);
}

getBikes();

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

function createDivIcon(name) {
  return new L.divIcon({
    html: '<div class="divicon">' + name + "</div>",
    iconSize: [0, 0],
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
      let childCount = cluster.getChildCount() / 2;
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
      iconSize: [30, 30],
      className: "myDivIcon",
    });
  }
  const fontAwesomeIcon = L.divIcon({
    html: '<i class="twicon-san-domingo"></i>',
    iconSize: [30, 30],
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
  console.log(lat1, lng1)
    console.log(lat2, lng2);
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
    iconSize: [30, 30],
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
  // StationPosition: GeoHash: "wsqqkyxyv";
  // PositionLat: 25.041778;
  // PositionLon: 121.508693;
  let bikedata = a3.sort(({ StationPosition: a }, { StationPosition: b }) => {
    console.log(a)
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
  console.log(bikedata);
  console.log(yourPositon);
let sss = bikedata.forEach((item) => {
    // console.log(item.StationPosition);
    let distance = getDistance(
      [yourPositon[0], yourPositon[1]],
      [item.StationPosition.PositionLat, item.StationPosition.PositionLon]
    );
   
  console.log(distance)
  
  
});



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
        : createMaskIcon(item.Picture.PictureUrl1)
      : createIcons("factory");

    let marker = L.marker(
      new L.LatLng(item.Position.PositionLat, item.Position.PositionLon),
      { icon: mask }
    );

    // let divIcon = L.divIcon({
    //   html: '<div class="divicon">' + item.Name + "</div>",
    //   iconSize: [0, 0],
    // });

    // L.marker([item.Position.PositionLat, item.Position.PositionLon], {
    //   icon: divIcon,
    // }).addTo(mymap);

    let divmark = L.marker(
      new L.LatLng(item.Position.PositionLat, item.Position.PositionLon),
      { icon: createDivIcon(item.Name) }
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
                    <img src=${item.Picture.PictureUrl1} alt="" />
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

    // L.marker([item.Position.PositionLat, item.Position.PositionLon], {
    //   icon: divIcon,
    // }).addTo(mymap);

    markersRef.push(marker);
    markers.addLayer(marker);

    markers.addLayer(divmark);
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
              <img src="${alldata[markIndex].Picture.PictureUrl1}" alt="" />
          </div>`
        : " "
    }
    <div class="detail_body">
      <h2 class="spot_title">
        <a href="${alldata[markIndex].WebsiteUrl}" target="_blank">
        ${alldata[markIndex].Name}</a>
      </h2>
      <a target="_blank" href="https://www.google.com/search?tbm=isch&q=${
        alldata[markIndex].Name
      }">
      XXXX
      </a>
      <p><i class="far fa-clock"></i> ${alldata[markIndex].OpenTime}</p>
      <div class="hook">
        <p> ${alldata[markIndex].DescriptionDetail}</p>
      </div>
      <button class="view_all"><i class="fas fa-chevron-right">詳全文</i></button>
    </div>`;
    info.innerHTML = el;

    let all = document.querySelectorAll(`#${s_list.id}>.spot_detail`);
    console.log(all);
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
  //add more latitude and longitude
  console.log(tesing);
  // bike path

  // var a = ballsssss.map((items) => {
  var a = tesing
    .filter(({ RouteName }) => {
      return RouteName.indexOf("自行車道") > -1;
    })
    .map((items) => {
      let sns = items.Geometry.replace("MULTILINESTRING ((", "")
        .replaceAll("))", "")
        .replaceAll(")", "")
        .replaceAll("(", "")
        .split(",");

      let newsa = sns.map((i) => {
        return i.split(" ").reverse();
      });

      items.geolocation = newsa;
      return items;
    });

  console.log(a); //no reverse
  let route = a[0].geolocation;
  console.log(route); //no reverse

  for (var i = 0, latlngs = [], len = route.length; i < len; i++) {
    latlngs.push(new L.LatLng(route[i][0], route[i][1]));
  }
  console.log(latlngs[0]);
  console.log(latlngs[len - 1]);

  var path = L.polyline(latlngs);
  //  var map = L.map("map");
  mymap.fitBounds(L.latLngBounds(latlngs));
  mymap.addLayer(L.marker(latlngs[0]));
  mymap.addLayer(L.marker(latlngs[len - 1]));

  mymap.addLayer(path);
  path.snakeIn();
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
  console.log(e.parentNode);
}

info.addEventListener("click", (e) => {
  const ta = e.target;
  e.stopPropagation();
  console.log(ta);
  if (ta.className == "view_all") {
    document.querySelector(".detail_body .hook").classList.toggle("open");
  }
});

// }).addTo(mymap);
let searchbike = document.getElementById("findspots");
// searchbike.addEventListener("click mouseover keypress", (e) => {
//   // e.currentTarget.classList.add("click");
//   console.log(e);
// });

searchbike.addEventListener("keyup", (e) => {
  console.log(e.code);
  //    e.currentTarget.classList.add("click");
  switch (e.code) {
    case "Enter":
      console.log("Enter filter");
      filterPoints();

    case "click":

    default:
      break;
  }
});

searchbike.addEventListener("mousedown", (e) => {
  e.currentTarget.classList.add("click");
});

//filter by select option
function filterPoints() {
  let string = searchbike.value;
  console.log(string);
  const res = infoData.filter(({ Name }) => {
    return Name.indexOf(string) !== -1;
  });

  console.log(infoData);
  console.log(res);

  filterData = res;
  renderMask();
}
