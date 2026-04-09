const API_KEY = "AIzaSyD_diNW2iDMOAKeRhOnXC4royMej57_diI";

let currentQuery = "";
let lastVideos = [];
let playerFrame = null;
let currentSongId = null;
let stream = null;

/* =========================
   LOGIN PANEL
========================= */
function toggleAuth(){
  let panel = document.getElementById("authPanel");
  if(panel) panel.classList.toggle("active");
}

/* =========================
   LOGIN
========================= */
function login(){
  let u = document.getElementById("username").value.trim();
  let p = document.getElementById("password").value.trim();

  if(!u || !p){
    alert("Enter username & password");
    return;
  }

  fetch("/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:u,password:p})
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.status==="success"){
      localStorage.setItem("user",u);

      toggleAuth();
      showUserProfile();
      loadHistory();

    } else {
      alert("❌ Wrong username or password");
    }
  });
}

/* =========================
   REGISTER
========================= */
function register(){
  let u = document.getElementById("username").value.trim();
  let p = document.getElementById("password").value.trim();

  if(!u || !p){
    alert("Enter username & password");
    return;
  }

  fetch("/register",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:u,password:p})
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.status==="exists"){
      alert("User already exists");
    } else {
      alert("Registered successfully ✅");
    }
  });
}

/* =========================
   PREMIUM PROFILE
========================= */
function showUserProfile(){
  let user = localStorage.getItem("user");
  let box = document.getElementById("profileBox");

  if(user && box){
    let firstLetter = user.charAt(0).toUpperCase();

    box.innerHTML = `
      <div class="profile" onclick="toggleProfile()">
        
        <div class="avatar">${firstLetter}</div>

        <div class="dropdown">
          <p>👤 ${user}</p>
          <button onclick="logout()">Logout</button>
        </div>

      </div>
    `;
  }
}

function toggleProfile(){
  let p = document.querySelector(".profile");
  if(p) p.classList.toggle("active");
}

function logout(){
  localStorage.removeItem("user");
  location.reload();
}

/* =========================
   SEARCH
========================= */
function searchSong(){
  let input = document.getElementById("searchInput");
  if(!input) return;

  let value = input.value.trim();
  if(!value) return;

  currentQuery = value;
  fetchVideos(value + " song");
}

/* =========================
   MOODS
========================= */
function getMood(m){
  const map = {
    happy:"happy bollywood songs",
    sad:"sad hindi songs",
    love:"romantic songs",
    party:"dj party songs",
    lofi:"lofi music",
    study:"study focus music",
    calm:"calm relaxing music"
  };

  currentQuery = map[m];
  fetchVideos(currentQuery);
}

/* =========================
   FETCH VIDEOS
========================= */
function fetchVideos(query){
  fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=12&videoEmbeddable=true`)
  .then(res=>res.json())
  .then(data=>{
    lastVideos = (data.items || []).filter(v => v.id.videoId);
    showSongs(lastVideos);
  })
  .catch(()=>alert("Error loading videos"));
}

/* =========================
   SHOW SONGS
========================= */
function showSongs(videos){
  const box = document.getElementById("player");
  if(!box) return;

  box.innerHTML = "";

  videos.forEach(v=>{
    let id = v.id.videoId;
    let title = v.snippet.title;
    let img = v.snippet.thumbnails.medium.url;

    let card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${img}">
      <p>${title}</p>
    `;

    card.onclick = ()=> playSong(id,title);
    box.appendChild(card);
  });
}

/* =========================
   PLAY SONG
========================= */
function playSong(id,title){
  currentSongId = id;
  saveHistory(title,id);

  if(!playerFrame){
    playerFrame = document.createElement("iframe");
    playerFrame.style.display="none";
    playerFrame.allow="autoplay";
    document.body.appendChild(playerFrame);
  }

  playerFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1`;

  let bar = document.querySelector(".player-bar");

  if(!bar){
    bar = document.createElement("div");
    bar.className = "player-bar";
    document.body.appendChild(bar);
  }

  bar.innerHTML = `
    <div>🎵 ${title}</div>
    <button onclick="stopSong()">⏹ Stop</button>
  `;
}

/* =========================
   STOP SONG
========================= */
function stopSong(){
  if(playerFrame) playerFrame.src="";
}

/* =========================
   SAVE HISTORY
========================= */
function saveHistory(title,id){
  let user = localStorage.getItem("user");
  if(!user) return;

  fetch("/save-history",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:user,title:title,videoId:id})
  });
}

/* =========================
   LOAD HISTORY
========================= */
function loadHistory(){
  let user = localStorage.getItem("user");
  if(!user) return;

  fetch("/get-history/"+user)
  .then(res=>res.json())
  .then(data=>{
    let list = document.getElementById("historyList");
    if(!list) return;

    list.innerHTML="";
    data.forEach(item=>{
      list.innerHTML += `
        <li onclick="playSong('${item[1]}','${item[0]}')">
          🎧 ${item[0]}
        </li>
      `;
    });
  });
}

/* =========================
   HISTORY PAGE
========================= */
function loadHistoryPage(){
  let user = localStorage.getItem("user");
  if(!user) return;

  fetch("/get-history/"+user)
  .then(res=>res.json())
  .then(data=>{
    let box = document.getElementById("historyPage");
    if(!box) return;

    box.innerHTML="";
    data.forEach(item=>{
      box.innerHTML += `
        <div class="card" onclick="playSong('${item[1]}','${item[0]}')">
          🎵 ${item[0]}
        </div>
      `;
    });
  });
}

/* =========================
   NAVIGATION
========================= */
function goToHistory(){ window.location.href="history.html"; }
function goBack(){ window.location.href="index.html"; }

/* =========================
   CAMERA
========================= */
function startCamera(){
  const video = document.getElementById("video");

  navigator.mediaDevices.getUserMedia({video:true})
  .then(s=>{
    stream = s;
    video.srcObject = s;

    setTimeout(()=>{
      let moods = ["happy","sad","love","party","lofi","calm"];
      let mood = moods[Math.floor(Math.random()*moods.length)];

      stopCamera();
      window.location.href="index.html?mood="+mood;

    },3000);
  })
  .catch(()=>alert("Camera error"));
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }
}

/* =========================
   ENTER KEY SUPPORT
========================= */
document.addEventListener("keydown",function(e){
  if(e.key==="Enter"){

    let panel = document.getElementById("authPanel");

    if(panel && panel.classList.contains("active")){
      login();
    }

    let input = document.getElementById("searchInput");
    if(document.activeElement === input){
      searchSong();
    }
  }
});

/* =========================
   LOAD
========================= */
window.onload=()=>{
  showUserProfile();
  loadHistory();
  loadHistoryPage();

  let mood = new URLSearchParams(location.search).get("mood");
  if(mood) getMood(mood);
};