# Pixi.js + Skia (CanvasKit) интеграция

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![PixiJS](https://img.shields.io/badge/PixiJS-7.4.3-green.svg)](https://pixijs.com/)
[![Skia](https://img.shields.io/badge/Skia-CanvasKit-orange.svg)](https://skia.org/)

## 📋 Описание

Проект демонстрирует интеграцию **Pixi.js** и **Skia (CanvasKit)** для рендеринга графических сцен с поддержкой трансформаций и экспортом в PDF.

### 🎯 Цель

Создать TypeScript-обёртку для Skia, которая принимает `PIXI.Container` и рендерит его с учётом всех трансформаций (translate, rotate, scale), поддерживая `PIXI.Graphics` и `PIXI.Sprite`.

---

## ✨ Функциональность

| Функция                                          | Статус |
| ------------------------------------------------ | ------ |
| Pixi.js канвас с интерактивными фигурами         | ✅     |
| Skia канвас с рендерингом тех же фигур           | ✅     |
| Трансформации (translate, rotate, scale)         | ✅     |
| `PIXI.Graphics` (эллипсы, прямоугольники, линии) | ✅     |
| `PIXI.Sprite` (png картинки)                     | ✅     |
| pointerDown/pointerUp на **обоих** канвасах      | ✅     |
| Курсор-указатель на Skia канвасе                 | ✅     |
| Добавление случайных фигур                       | ✅     |
| Очистка добавленных фигур                        | ✅     |
| Экспорт в PDF                                    | ✅     |
| TypeScript + `forceCanvas: true`                 | ✅     |

---

## 🛠 Технологии

- **TypeScript** — типизация и современный JavaScript
- **Pixi.js-legacy 7.4.3** — 2D графика с `forceCanvas: true`
- **Skia / CanvasKit 0.39.1** — альтернативный рендеринг через WebGL/Canvas
- **jsPDF** — экспорт в PDF
- **Webpack** — сборка проекта

---

## Демо

https://Atichka.github.io/pixi-skia-export/

## 🚀 Запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/Atichka/pixi-skia-export.git
cd pixi-skia-export
```
