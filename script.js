const sounds = {
    trashVariations: [
        new Audio('audio/trash1.mp3'), new Audio('audio/trash2.mp3'),
        new Audio('audio/trash3.mp3'), new Audio('audio/trash4.mp3')
    ],
    grinder: new Audio('audio/grinder.mp3'),
    plaster: new Audio('audio/plaster.mp3'),
    boom: new Audio('audio/explosion.mp3')
};

let itemsThrown = 0;

// Функция отрисовки Canvas "под картинку" (аналог object-fit: cover)
function drawImageCover(ctx, img, canvas) {
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// ЭТАП 1
document.querySelectorAll('.furniture').forEach(item => {
    item.onmousedown = function(e) {
        let shiftX = e.clientX - item.getBoundingClientRect().left;
        let shiftY = e.clientY - item.getBoundingClientRect().top;
        const area = document.getElementById('area1');
        function moveAt(pageX, pageY) {
            item.style.left = pageX - shiftX - area.offsetLeft + 'px';
            item.style.top = pageY - shiftY - area.offsetTop + 'px';
        }
        function onMouseMove(e) { moveAt(e.pageX, e.pageY); }
        document.addEventListener('mousemove', onMouseMove);
        item.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            let binElement = document.getElementById('trash-bin');
            if (!binElement) return;
            let bin = binElement.getBoundingClientRect();
            let itm = item.getBoundingClientRect();
            if (itm.right > bin.left && itm.left < bin.right && itm.bottom > bin.top) {
                item.style.display = 'none';
                sounds.trashVariations[itemsThrown % 4].play();
                itemsThrown++;
                if (itemsThrown < 4) {
                    const photo = document.getElementById('hist' + itemsThrown);
                    if(photo) photo.style.opacity = 1;
                    binElement.classList.add('shake');
                    setTimeout(() => binElement.classList.remove('shake'), 200);
                } else { prepareExplosion(binElement); }
            }
        };
    };
    item.ondragstart = () => false;
});

function prepareExplosion(bin) {
    bin.classList.add('growing'); 
    setTimeout(() => {
        sounds.boom.play();
        launchFinishEffect(document.getElementById('area1'), 'sparkles');
        const photo4 = document.getElementById('hist4');
        if(photo4) { photo4.style.opacity = "1"; photo4.style.zIndex = "10"; }
        document.getElementById('btn1').style.display = 'inline-block';
        bin.style.display = 'none';
    }, 600);
}

// ЭТАП 2
function initGrinderStage() {
    const canvas = document.getElementById('canvas2');
    const tool = document.getElementById('grinder-tool');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
    const img = new Image();
    img.src = 'img/photo2.jpg'; 
    img.onload = () => drawImageCover(ctx, img, canvas);
    canvas.parentElement.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        tool.style.display = 'block'; tool.style.left = x + 'px'; tool.style.top = y + 'px';
        if (e.buttons === 1) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
            if (sounds.grinder.paused) sounds.grinder.play();
            checkProgress(ctx, canvas, 'btn2', false, 0.95);
        } else { sounds.grinder.pause(); }
    };
}

// ФУНКЦИЯ ДЛЯ СЕРЫХ КАПЕЛЬ (ЭТАП 3)
function createPlasterDrop(x, y, container) {
    const drop = document.createElement('div');
    drop.className = 'plaster-drop';
    drop.style.left = x + 'px'; drop.style.top = y + 'px';
    const size = Math.random() * 8 + 4;
    drop.style.width = size + 'px'; drop.style.height = size + 'px';
    container.appendChild(drop);
    setTimeout(() => {
        drop.style.transition = "all 0.6s ease-in";
        drop.style.transform = "translateY(80px)";
        drop.style.opacity = "0";
    }, 10);
    setTimeout(() => drop.remove(), 700);
}

// ЭТАП 3
function initSpatulaStage() {
    const canvas = document.getElementById('canvas3');
    const tool = document.getElementById('spatula-tool');
    const container = document.getElementById('area3');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
    const img = new Image();
    img.src = 'img/dirty_wall.jpg'; 
    img.onload = () => drawImageCover(ctx, img, canvas);
    canvas.parentElement.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        tool.style.display = 'block'; tool.style.left = x + 'px'; tool.style.top = y + 'px';
        if (e.buttons === 1) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#f2f2f2';
            ctx.beginPath(); ctx.rect(x - 60, y - 30, 120, 60); ctx.fill();
            
            // ВОССТАНОВЛЕННЫЕ КАПЛИ
            if (Math.random() > 0.7) createPlasterDrop(x, y, container);
            
            if (sounds.plaster.paused) sounds.plaster.play();
            checkProgress(ctx, canvas, 'btn3', true, 0.95);
        } else { sounds.plaster.pause(); }
    };
}

// ЭТАП 4: МОЛОКО
function initMilkStage() {
    const canvas = document.getElementById('canvas4');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
    const imgMilk = new Image();
    imgMilk.src = 'img/milk.jpg'; 
    imgMilk.onload = () => drawImageCover(ctx, imgMilk, canvas);
    canvas.parentElement.onmousemove = function(e) {
        if (e.buttons === 1) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
            if (Math.random() > 0.8) createHeart(e.clientX, e.clientY);
            checkProgress(ctx, canvas, 'btn4', false, 0.90);
        }
    };
}

function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.innerHTML = '❤️';
    heart.style.left = x + 'px'; heart.style.top = y + 'px';
    heart.style.setProperty('--x', (Math.random() - 0.5) * 200 + 'px');
    heart.style.setProperty('--y', (Math.random() - 0.5) * 200 + 'px');
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
}

function launchFinishEffect(container, type) {
    for (let i = 0; i < 100; i++) {
        const p = document.createElement('div');
        p.className = 'finish-spark';
        p.style.left = '50%'; p.style.top = '50%';
        p.style.setProperty('--x', (Math.random() - 0.5) * 600 + 'px');
        p.style.setProperty('--y', (Math.random() - 0.5) * 600 + 'px');
        container.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
}

function checkProgress(ctx, canvas, btnId, isAdding, threshold) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0; const step = 800;
    for(let i = 3; i < data.length; i += step) { 
        if (isAdding) { if (data[i-3] > 240) count++; } else { if (data[i] === 0) count++; }
    }
    if (count > (data.length / step) * threshold) {
        const btn = document.getElementById(btnId);
        if (btn.style.display !== 'inline-block') {
            btn.style.display = 'inline-block';
            canvas.style.opacity = "0";
            if (btnId === 'btn2') document.getElementById('hist5').classList.add('show');
            if (btnId === 'btn3') document.getElementById('hist6').classList.add('show');
            if (btnId === 'btn4') {
                document.getElementById('kiss-text').style.display = 'block';
                document.getElementById('milk-text').innerHTML = "Так-то лучше!";
            }
        }
    }
}

function nextStage(n) {
    document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
    document.getElementById('stage' + n).classList.add('active');
    if (n === 2) initGrinderStage();
    if (n === 3) initSpatulaStage();
    if (n === 4) initMilkStage();
}

function showFinal() {
    document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
    document.getElementById('final').classList.add('active');
    heartWaterfall();
    setTimeout(() => { document.getElementById('wish-modal').style.display = 'flex'; }, 2000);
}

// БЕСКОНЕЧНАЯ ЛАВИНА СЕРДЕЦ (ОБНОВЛЕНО)
function heartWaterfall() {
    const hearts = ['❤️','💖','💝','💕','💘','😍','✨'];
    // Используем setInterval для бесконечного потока
    setInterval(() => {
        const h = document.createElement('div');
        h.className = 'waterfall-heart';
        h.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = (Math.random() * 25 + 25) + 'px';
        h.style.animationDuration = (Math.random() * 1.5 + 2) + 's';
        document.body.appendChild(h);
        
        // Удаляем элемент после завершения анимации, чтобы не перегружать браузер
        setTimeout(() => h.remove(), 4000);
    }, 80); // Сердца появляются каждые 80мс
}

function closeModal() { document.getElementById('wish-modal').style.display = 'none'; }