import * as PIXI from 'pixi.js-legacy';
import initCanvasKit from 'canvaskit-wasm';
import jsPDF from 'jspdf';

console.log('Скрипт запущен');

let pixiApp: any = null;
let skCanvas: any = null;
let skSurface: any = null;
let canvasKit: any = null;
let shapes: any[] = [];

// --- Проверка попадания точки в фигуру (hit testing) ---
function isPointInShape(px: number, py: number, shape: any): boolean {
    // Переводим точку в локальные координаты фигуры
    let localX = px - shape.x;
    let localY = py - shape.y;
    
    // Обратное вращение
    const angleRad = -shape.rotation * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    let rotatedX = localX * cos - localY * sin;
    let rotatedY = localX * sin + localY * cos;
    
    // Обратное масштабирование
    const scaleX = shape.scaleX || 1;
    const scaleY = shape.scaleY || 1;
    const scaledX = rotatedX / scaleX;
    const scaledY = rotatedY / scaleY;
    
    // Проверка в зависимости от типа фигуры
    if (shape.type === 'ellipse') {
        const rx = shape.radiusX;
        const ry = shape.radiusY;
        return (scaledX * scaledX) / (rx * rx) + (scaledY * scaledY) / (ry * ry) <= 1;
    }
    else if (shape.type === 'rect') {
        const left = shape.offsetX;
        const right = shape.offsetX + shape.width;
        const top = shape.offsetY;
        const bottom = shape.offsetY + shape.height;
        return scaledX >= left && scaledX <= right && scaledY >= top && scaledY <= bottom;
    }
    else if (shape.type === 'circle') {
        const radius = shape.radius;
        return (scaledX * scaledX + scaledY * scaledY) <= radius * radius;
    }
    else if (shape.type === 'line') {
        const x1 = shape.fromX;
        const y1 = shape.fromY;
        const x2 = shape.toX;
        const y2 = shape.toY;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        
        if (len2 === 0) return false;
        
        let t = ((scaledX - x1) * dx + (scaledY - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        const dist2 = (scaledX - projX) ** 2 + (scaledY - projY) ** 2;
        const threshold = ((shape.strokeWidth || 10) / 2) ** 2;
        
        return dist2 <= threshold;
    }
    
    return false;
}

// --- Получение названия фигуры для сообщения ---
function getShapeName(shape: any): string {
    switch (shape.type) {
        case 'ellipse': return 'эллипсу';
        case 'rect': return 'прямоугольнику';
        case 'circle': return 'кругу';
        case 'line': return 'линии';
        default: return 'фигуре';
    }
}

async function initPixi() {
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    console.log('Pixi canvas найден');
    
    pixiApp = new PIXI.Application({
        view: canvas,
        width: 800,
        height: 600,
        backgroundColor: 0xeeeeee,
    });
    
    console.log('Pixi приложение создано');
    
    // Красный эллипс
    const g1 = new PIXI.Graphics();
    g1.beginFill(0xff0000);
    g1.drawEllipse(0, 0, 200, 100);
    g1.endFill();
    g1.position.set(200, 100);
    g1.angle = 30;
    g1.interactive = true;
    g1.cursor = 'pointer';
    g1.on('pointerdown', () => {
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.innerHTML = '🔴 Pixi: Клик по красному эллипсу!';
    });
    pixiApp.stage.addChild(g1);
    shapes.push({ 
        type: 'ellipse', 
        x: 200, y: 100, 
        rotation: 30, 
        scaleX: 1, scaleY: 1,
        color: 0xff0000, 
        radiusX: 200, radiusY: 100 
    });
    
    // Синий прямоугольник
    const g2 = new PIXI.Graphics();
    g2.beginFill(0x0000ff);
    g2.drawRect(-50, -75, 100, 150);
    g2.endFill();
    g2.position.set(120, 60);
    g2.angle = 15;
    g2.scale.set(1.5, 1.7);
    g2.interactive = true;
    g2.cursor = 'pointer';
    g2.on('pointerup', () => {
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.innerHTML = '🔵 Pixi: Клик по синему прямоугольнику!';
    });
    pixiApp.stage.addChild(g2);
    shapes.push({ 
        type: 'rect', 
        x: 120, y: 60, 
        rotation: 15, 
        scaleX: 1.5, scaleY: 1.7,
        color: 0x0000ff, 
        width: 100, height: 150, 
        offsetX: -50, offsetY: -75 
    });
    
    console.log('Фигуры добавлены, всего:', shapes.length);
}

async function initSkia() {
    const canvas = document.getElementById('skia-canvas') as HTMLCanvasElement;
    console.log('Skia canvas найден');
    
    canvasKit = await initCanvasKit({
        locateFile: (file: string) => `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`,
    });
    
    skSurface = canvasKit.MakeWebGLCanvasSurface(canvas);
    if (!skSurface) throw new Error('Skia surface error');
    
    skCanvas = skSurface.getCanvas();
    
    // --- Добавляем обработчики событий на Skia канвас ---
    // pointerdown
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        // Проверяем все фигуры (сверху вниз)
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            if (isPointInShape(clickX, clickY, shape)) {
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                    statusDiv.innerHTML = `🎯 Skia pointerDown: клик по ${getShapeName(shape)}!`;
                }
                break;
            }
        }
    });
    
    // pointerup
    canvas.addEventListener('mouseup', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            if (isPointInShape(clickX, clickY, shape)) {
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                    statusDiv.innerHTML = `🎯 Skia pointerUp: клик по ${getShapeName(shape)}!`;
                }
                break;
            }
        }
    });
    
    // Курсор-указатель при наведении на фигуру
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        let isOverShape = false;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(mouseX, mouseY, shapes[i])) {
                isOverShape = true;
                break;
            }
        }
        canvas.style.cursor = isOverShape ? 'pointer' : 'default';
    });
    
    console.log('Skia готов, события добавлены');
}

function renderToSkia() {
    if (!canvasKit || !skCanvas || !skSurface) return;
    
    skCanvas.clear(canvasKit.WHITE);
    
    for (const s of shapes) {
        skCanvas.save();
        skCanvas.translate(s.x, s.y);
        if (s.rotation) skCanvas.rotate(s.rotation, 0, 0);
        if (s.scaleX) skCanvas.scale(s.scaleX, s.scaleY || 1);
        
        if (s.type === 'ellipse') {
            const paint = new canvasKit.Paint();
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            paint.setColor(canvasKit.Color(r, g, b, 1.0));
            paint.setStyle(canvasKit.PaintStyle.Fill);
            skCanvas.drawOval([-s.radiusX, -s.radiusY, s.radiusX, s.radiusY], paint);
            paint.delete();
        } else if (s.type === 'rect') {
            const paint = new canvasKit.Paint();
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            paint.setColor(canvasKit.Color(r, g, b, 1.0));
            paint.setStyle(canvasKit.PaintStyle.Fill);
            skCanvas.drawRect([s.offsetX, s.offsetY, s.offsetX + s.width, s.offsetY + s.height], paint);
            paint.delete();
        } else if (s.type === 'circle') {
            const paint = new canvasKit.Paint();
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            paint.setColor(canvasKit.Color(r, g, b, 1.0));
            paint.setStyle(canvasKit.PaintStyle.Fill);
            skCanvas.drawCircle(0, 0, s.radius, paint);
            paint.delete();
        } else if (s.type === 'line') {
            const paint = new canvasKit.Paint();
            const r = (s.strokeColor >> 16) & 0xFF, g = (s.strokeColor >> 8) & 0xFF, b = s.strokeColor & 0xFF;
            paint.setColor(canvasKit.Color(r, g, b, 1.0));
            paint.setStyle(canvasKit.PaintStyle.Stroke);
            paint.setStrokeWidth(s.strokeWidth || 2);
            skCanvas.drawLine(s.fromX, s.fromY, s.toX, s.toY, paint);
            paint.delete();
        }
        
        skCanvas.restore();
    }
    
    skSurface.flush();
    console.log('Skia отрендерил, фигур:', shapes.length);
}

function addRandomShape() {
    if (!pixiApp) return;
    
    const colors = [0xff00ff, 0x00ff00, 0xff6600, 0x00ccff];
    const x = Math.random() * 700 + 50;
    const y = Math.random() * 500 + 50;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isRect = Math.random() > 0.5;
    
    const shape = new PIXI.Graphics();
    shape.beginFill(color);
    
    let shapeData: any;
    
    if (isRect) {
        shape.drawRect(-30, -30, 60, 60);
        shape.endFill();
        shape.position.set(x, y);
        shapeData = { 
            type: 'rect', x, y, rotation: 0, scaleX: 1, scaleY: 1,
            color: color, width: 60, height: 60, offsetX: -30, offsetY: -30 
        };
    } else {
        shape.drawCircle(0, 0, 30);
        shape.endFill();
        shape.position.set(x, y);
        shapeData = { 
            type: 'circle', x, y, rotation: 0, scaleX: 1, scaleY: 1,
            color: color, radius: 30 
        };
    }
    
    shape.interactive = true;
    shape.cursor = 'pointer';
    shape.on('pointerdown', () => {
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.innerHTML = `🎨 Pixi: Клик по новой фигуре!`;
    });
    
    pixiApp.stage.addChild(shape);
    shapes.push(shapeData);
    renderToSkia();
    
    const statusDiv = document.getElementById('status');
    if (statusDiv) statusDiv.innerHTML = `➕ Добавлена новая фигура! Всего: ${shapes.length}`;
}

function clearShapes() {
    if (!pixiApp) return;
    
    while (shapes.length > 2) {
        shapes.pop();
        if (pixiApp.stage.children.length > 2) {
            pixiApp.stage.removeChildAt(pixiApp.stage.children.length - 1);
        }
    }
    
    renderToSkia();
    
    const statusDiv = document.getElementById('status');
    if (statusDiv) statusDiv.innerHTML = `🗑️ Фигуры очищены. Осталось: ${shapes.length}`;
}

function exportToPDF() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(0, 0, 800, 600);
    
    for (const s of shapes) {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.rotation) ctx.rotate(s.rotation * Math.PI / 180);
        if (s.scaleX) ctx.scale(s.scaleX, s.scaleY || 1);
        
        if (s.type === 'ellipse') {
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, s.radiusX, s.radiusY, 0, 0, 2 * Math.PI);
            ctx.fill();
        } else if (s.type === 'rect') {
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(s.offsetX, s.offsetY, s.width, s.height);
        } else if (s.type === 'circle') {
            const r = (s.color >> 16) & 0xFF, g = (s.color >> 8) & 0xFF, b = s.color & 0xFF;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius, 0, 2 * Math.PI);
            ctx.fill();
        } else if (s.type === 'line') {
            const r = (s.strokeColor >> 16) & 0xFF, g = (s.strokeColor >> 8) & 0xFF, b = s.strokeColor & 0xFF;
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.lineWidth = s.strokeWidth || 2;
            ctx.beginPath();
            ctx.moveTo(s.fromX, s.fromY);
            ctx.lineTo(s.toX, s.toY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 800, 600);
    pdf.save('export.pdf');
    
    const statusDiv = document.getElementById('status');
    if (statusDiv) statusDiv.innerHTML = `📄 PDF экспортирован!`;
}

async function main() {
    try {
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.innerHTML = 'Инициализация Pixi...';
        await initPixi();
        
        if (statusDiv) statusDiv.innerHTML = 'Инициализация Skia...';
        await initSkia();
        
        renderToSkia();
        
        document.getElementById('add-btn')!.onclick = addRandomShape;
        document.getElementById('clear-btn')!.onclick = clearShapes;
        document.getElementById('pdf-btn')!.onclick = exportToPDF;
        
        if (statusDiv) statusDiv.innerHTML = '✅ Готово! Кликайте на фигуры на ОБОИХ канвасах!';
        console.log('Готово');
    } catch (error) {
        console.error(error);
        const statusDiv = document.getElementById('status');
        if (statusDiv) statusDiv.innerHTML = `❌ Ошибка: ${error}`;
    }
}

main();