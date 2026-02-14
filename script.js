const sounds = {
    trash: [new Audio('audio/trash1.mp3'), new Audio('audio/trash2.mp3'), new Audio('audio/trash3.mp3'), new Audio('audio/trash4.mp3')],
    grinder: new Audio('audio/grinder.mp3'),
    plaster: new Audio('audio/plaster.mp3'),
    boom: new Audio('audio/explosion.mp3'),
    finalMusic: new Audio('audio/final_music.mp3')
};
sounds.finalMusic.loop = true;
let musicStarted = false;
let itemsThrown = 0;

// Вспомогательная функция для координат
function getCoords(e, container) {
    const rect = container.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
}

// ЭТАП 1: МУСОР (Touch + Mouse)
document.querySelectorAll('.furniture').forEach(item => {
    const start = (e) => {
        e.preventDefault();
        const area = document.getElementById('area1');
        const move = (me) => {
            const p = getCoords(me, area);
            item.style.left = (p.x - item.offsetWidth/2) + 'px';
            item.style.top = (p.y - item.offsetHeight/2) + 'px';
        };
        const end = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('touchmove', move);
            const bin = document.getElementById('trash-bin').getBoundingClientRect();
            const itm = item.getBoundingClientRect();
            if (itm.right > bin.left && itm.left < bin.right && itm.bottom > bin.top) {
                item.style.display = 'none';
                sounds.trash[itemsThrown % 4].play();
                itemsThrown++;
                if (itemsThrown < 4) {
                    document.getElementById('hist' + itemsThrown).style.opacity = 1;
                } else {
                    document.getElementById('trash-bin').classList.add('growing');
                    setTimeout(() => {
                        sounds.boom.play();
                        document.getElementById('hist4').style.opacity = 1;
                        document.getElementById('trash-bin').style.display = 'none';
                        document.getElementById('btn1').style.display = 'inline-block';
                    }, 600);
                }
            }
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, {passive: false});
        document.addEventListener('mouseup', end, {once: true});
        document.addEventListener('touchend', end, {once: true});
    };
    item.addEventListener('mousedown', start);
    item.addEventListener('touchstart', start, {passive: false});
});

// ОБЩАЯ ФУНКЦИЯ ДЛЯ КАНВАСА (Исправлено мелькание фото)
function initStage(canvasId, toolId, btnId, type) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const tool = document.getElementById(toolId);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const img = new Image();
    img.src = (type === 'plaster') ? 'img/dirty_wall.jpg' : (canvasId === 'canvas4' ? 'img/milk.jpg' : 'img/photo2.jpg');
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const handle = (e) => {
        e.preventDefault();
        const p = getCoords(e, canvas);
        if (tool) { tool.style.display = 'block'; tool.style.left = p.x + 'px'; tool.style.top = p.y + 'px'; }

        if (e.buttons === 1 || e.touches) {
            if (canvasId === 'canvas4' && !musicStarted) { sounds.finalMusic.play(); musicStarted = true; }
            ctx.globalCompositeOperation = (type === 'plaster') ? 'source-over' : 'destination-out';
            if (type === 'plaster') {
                ctx.fillStyle = '#f2f2f2'; ctx.fillRect(p.x - 30, p.y - 15, 60, 30);
                if (sounds.plaster.paused) sounds.plaster.play();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, 35, 0, Math.PI*2); ctx.fill();
                if (canvasId === 'canvas2' && sounds.grinder.paused) sounds.grinder.play();
            }
            check(ctx, canvas, btnId, type === 'plaster');
        } else {
            sounds.grinder.pause(); sounds.plaster.pause();
        }
    };

    canvas.addEventListener('mousemove', handle);
    canvas.addEventListener('touchmove', handle, {passive: false});
    canvas.addEventListener('mousedown', handle);
    canvas.addEventListener('touchstart', handle, {passive: false});
}

function check(ctx, canvas, btnId, isPlaster) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hits = 0;
    for (let i = 3; i < data.length; i += 400) {
        if (isPlaster ? data[i-3] > 200 : data[i] === 0) hits++;
    }
    if (hits > (data.length/400) * 0.85) {
        const btn = document.getElementById(btnId);
        if (btn.style.display !== 'inline-block') {
            btn.style.display = 'inline-block';
            canvas.style.opacity = 0;
            // Показ скрытых фото только ТУТ
            const photo = (btnId === 'btn2') ? document.getElementById('hist5') : (btnId === 'btn3' ? document.getElementById('hist6') : null);
            if (photo) { photo.style.display = 'block'; setTimeout(() => photo.classList.add('show'), 10); }
            if (btnId === 'btn4') document.getElementById('kiss-text').style.display = 'block';
        }
    }
}

function nextStage(n) {
    document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
    document.getElementById('stage' + n).classList.add('active');
    if (n === 2) initStage('canvas2', 'grinder-tool', 'btn2', 'grind');
    if (n === 3) initStage('canvas3', 'spatula-tool', 'btn3', 'plaster');
    if (n === 4) initStage('canvas4', '', 'btn4', 'milk');
}

function showFinal() {
    document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
    document.getElementById('final').classList.add('active');
    setInterval(() => {
        const h = document.createElement('div');
        h.className = 'waterfall-heart'; h.innerHTML = '❤️';
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = Math.random() * 20 + 20 + 'px';
        h.style.animationDuration = Math.random() * 2 + 2 + 's';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 3000);
    }, 100);
    setTimeout(() => { document.getElementById('wish-modal').style.display = 'flex'; }, 2000);
}

function closeModal() { document.getElementById('wish-modal').style.display = 'none'; }