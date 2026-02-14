const sounds = {
    trashVariations: [
        new Audio('audio/trash1.mp3'), new Audio('audio/trash2.mp3'),
        new Audio('audio/trash3.mp3'), new Audio('audio/trash4.mp3')
    ],
    grinder: new Audio('audio/grinder.mp3'),
    plaster: new Audio('audio/plaster.mp3'),
    boom: new Audio('audio/explosion.mp3'),
    finalMusic: new Audio('audio/final_music.mp3')
};

sounds.finalMusic.loop = true;
let finalMusicStarted = false; 
let itemsThrown = 0;

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

// ЭТАП 1: УБОРКА МУСОРА
document.querySelectorAll('.furniture').forEach(item => {
    const startDrag = (e) => {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        let shiftX = clientX - item.getBoundingClientRect().left;
        let shiftY = clientY - item.getBoundingClientRect().top;
        const area = document.getElementById('area1');

        const moveAt = (pageX, pageY) => {
            item.style.left = pageX - shiftX - area.offsetLeft + 'px';
            item.style.top = pageY - shiftY - area.offsetTop + 'px';
        };

        const onMove = (e) => {
            const moveX = e.type === 'touchmove' ? e.touches[0].pageX : e.pageX;
            const moveY = e.type === 'touchmove' ? e.touches[0].pageY : e.pageY;
            moveAt(moveX, moveY);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, {passive: false});

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            
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

        document.addEventListener('mouseup', onUp, {once: true});
        document.addEventListener('touchend', onUp, {once: true});
    };

    item.addEventListener('mousedown', startDrag);
    item.addEventListener('touchstart', startDrag, {passive: false});
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

// ОБЩАЯ ФУНКЦИЯ ДЛЯ КАНВАСА (ДЛЯ ВСЕХ ЭТАПОВ)
function handleCanvasAction(canvasId, toolId, btnId, isPlaster) {
    const canvas = document.getElementById(canvasId);
    const tool = document.getElementById(toolId);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const img = new Image();
    img.src = canvasId === 'canvas3' ? 'img/dirty_wall.jpg' : (canvasId === 'canvas4' ? 'img/milk.jpg' : 'img/photo2.jpg');
    img.onload = () => drawImageCover(ctx, img, canvas);

    const performAction = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (tool) {
            tool.style.display = 'block';
            tool.style.left = x + 'px';
            tool.style.top = y + 'px';
        }

        if (e.buttons === 1 || e.type === 'touchmove') {
            if (canvasId === 'canvas4' && !finalMusicStarted) {
                sounds.finalMusic.play();
                finalMusicStarted = true;
            }

            if (isPlaster) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = '#f2f2f2';
                ctx.beginPath(); ctx.rect(x - 60, y - 30, 120, 60); ctx.fill();
                if (Math.random() > 0.7) createPlasterDrop(x, y, canvas.parentElement);
                if (sounds.plaster.paused) sounds.plaster.play();
            } else {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
                if (canvasId === 'canvas2' && sounds.grinder.paused) sounds.grinder.play();
                if (canvasId === 'canvas4' && Math.random() > 0.8) createHeart(clientX, clientY);
            }
            checkProgress(ctx, canvas, btnId, isPlaster, 0.92);
        }
    };

    const stopSounds = () => {
        sounds.grinder.pause();
        sounds.plaster.pause();
    };

    canvas.parentElement.addEventListener('mousemove', performAction);
    canvas.parentElement.addEventListener('touchmove', performAction, {passive: false});
    window.addEventListener('mouseup', stopSounds);
    window.addEventListener('touchend', stopSounds);
}

function initGrinderStage() { handleCanvasAction('canvas2', 'grinder-tool', 'btn2', false); }
function initSpatulaStage() { handleCanvasAction('canvas3', 'spatula-tool', 'btn3', true); }
function initMilkStage() { handleCanvasAction('canvas4', null, 'btn4', false); }

function createPlasterDrop(x, y, container) {
    const drop = document.createElement('div');
    drop.className = 'plaster-drop';
    drop.style.left = x + 'px'; drop.style.top = y + 'px';
    drop.style.width = '8px'; drop.style.height = '8px';
    drop.style.backgroundColor = '#f2f2f2';
    container.appendChild(drop);
    setTimeout(() => {
        drop.style.transition = "all 0.6s ease-in";
        drop.style.transform = "translateY(80px)";
        drop.style.opacity = "0";
    }, 10);
    setTimeout(() => drop.remove(), 700);
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
            
            // ИСПРАВЛЕНО: Показываем фото только после прохождения этапа
            let hiddenPhotoId = btnId === 'btn2' ? 'hist5' : (btnId === 'btn3' ? 'hist6' : null);
            if(hiddenPhotoId) {
                const photo = document.getElementById(hiddenPhotoId);
                photo.style.display = 'block';
                setTimeout(() => photo.classList.add('show'), 50);
            }

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

function heartWaterfall() {
    const hearts = ['❤️','💖','💝','💕','💘','😍','✨'];
    setInterval(() => {
        const h = document.createElement('div');
        h.className = 'waterfall-heart';
        h.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = (Math.random() * 25 + 25) + 'px';
        h.style.animationDuration = (Math.random() * 1.5 + 2) + 's';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 4000);
    }, 80); 
}

function closeModal() { document.getElementById('wish-modal').style.display = 'none'; }