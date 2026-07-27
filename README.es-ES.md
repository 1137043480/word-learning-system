# 🎓 Sistema Adaptativo de Aprendizaje de Vocabulario Chino

[![中文文档](https://img.shields.io/badge/文档-中文版-blue)](./README_zh.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-learnchinese.kzwbelieve.top-brightgreen)](http://learnchinese.kzwbelieve.top)
[![GitHub stars](https://img.shields.io/github/stars/1137043480/word-learning-system?style=social)](https://github.com/1137043480/word-learning-system)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](http://learnchinese.kzwbelieve.top)

**Versión**: 2.2.0 · **Estado**: Producción · **Última actualización**: Marzo 2026

> 🌐 **[Pruébalo ahora → learnchinese.kzwbelieve.top](http://learnchinese.kzwbelieve.top)** — ¡Sin necesidad de instalación! Funciona en móviles y escritorio.

Un sistema inteligente y adaptativo de aprendizaje de vocabulario para estudiantes de nivel intermedio de Chino como Lengua Extranjera (CFL). Desarrollado como parte de una tesis de maestría en la **Universidad de Pekín** — *"Investigación y Diseño de un Sistema Adaptativo de Aprendizaje de Vocabulario Chino Intermedio"* — este proyecto implementa una plataforma de aprendizaje full-stack con rutas de aprendizaje personalizadas impulsadas por IA, repetición espaciada y analíticas de aprendizaje exhaustivas.

---

## ✨ Características Principales

- 🧠 **Motor de Recomendación Adaptativo** — Ruta de aprendizaje personalizada mediante IA basada en la competencia del usuario, patrones de aprendizaje e historial de rendimiento.
- 🔄 **Repetición Espaciada (SM-2)** — Programación de repasos científicos basados en el algoritmo SuperMemo-2 con intervalos personalizados.
- 📊 **Panel de Analíticas de Aprendizaje** — Visualización de datos en tiempo real con mapas de calor de dominio, análisis de tendencias y perspectivas predictivas.
- 📝 **Evaluación basada en VKS** — Pruebas de la Escala de Conocimiento del Vocabulario (VKS) para determinar los puntos de entrada óptimos al aprendizaje.
- ⏱️ **Rastreo con precisión de milisegundos** — Registro detallado del comportamiento de aprendizaje para la recolección de datos de grado de investigación.
- 🔊 **Pronunciación de audio TTS** — Texto a voz integrado para caracteres, palabras, colocaciones y frases de ejemplo.
- 🔗 **Cadena de Aprendizaje Multi-módulo** — Flujo de aprendizaje progresivo: Carácter → Vocabulario → Colocación → Frase.
- 📖 **Diseño Curricular basado en SLA** — Materiales de aprendizaje fundamentados en la teoría de Adquisición de Segundas Lenguas: clasificación de dificultad basada en la frecuencia de palabras mediante el corpus BCC (miles de millones de tokens), extracción de colocaciones mediante NLP usando análisis de dependencias e información mutua, puntuación automatizada de complejidad de frases e identificación de palabras confusas basada en un corpus interlingüístico.
- 📱 **Soporte PWA** — Instálalo como una aplicación nativa en iOS, Android y escritorio; funciona offline gracias al almacenamiento en caché de Service Worker.
- ☁️ **Sincronización de progreso entre dispositivos** — Estado de aprendizaje persistido en el backend; cambia de dispositivo sin perder el progreso.

---

## 📸 Capturas de Pantalla

<details>
<summary><b>Haz clic para ver las 9 capturas de pantalla 👇</b></summary>

<table>
  <tr>
    <td align="center"><b>Página de Inicio</b></td>
    <td align="center"><b>Evaluación VKS</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/01-homepage.png?v=3" width="400" alt="Home Page - Mobile-first welcome interface with navigation to all learning modules"></td>
    <td><img src="docs/screenshots/02-vks-entrance.png?v=3" width="400" alt="VKS Assessment - Vocabulary Knowledge Scale test to determine learning entry point"></td>
  </tr>
  <tr>
    <td align="center"><b>Aprendizaje de Caracteres</b></td>
    <td align="center"><b>Aprendizaje de Palabras</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/03-character-learning.png?v=3" width="400" alt="Character Learning - Chinese character breakdown with pinyin, stroke order, and definitions"></td>
    <td><img src="docs/screenshots/04-word-learning.png?v=3" width="400" alt="Word Learning - Deep dive into word meanings, collocations, and usage"></td>
  </tr>
  <tr>
    <td align="center"><b>Aprendizaje de Colocaciones</b></td>
    <td align="center"><b>Aprendizaje de Frases</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/04b-collocation-learning.png?v=3" width="400" alt="Collocation Learning - Mastering native-like phrasing combinations"></td>
    <td><img src="docs/screenshots/04c-sentence-learning.png?v=3" width="400" alt="Sentence Learning - Contextual reading and listening practice"></td>
  </tr>
  <tr>
    <td align="center"><b>Ejercicios de Vocabulario</b></td>
    <td align="center"><b>Panel de Aprendizaje</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/07-exercise.png?v=3" width="400" alt="Vocabulary Exercise - Interactive quizzes with immediate feedback"></td>
    <td><img src="docs/screenshots/05-dashboard.png?v=3" width="400" alt="Learning Dashboard - AI-powered smart recommendations with confidence scoring"></td>
  </tr>
  <tr>
    <td align="center"><b>Repaso de Hoy</b></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/06-today-review.png?v=3" width="400" alt="Spaced Repetition Review - Daily personalized review tasks"></td>
    <td></td>
  </tr>
</table>

</details>

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Flask, SQLAlchemy, SQLite |
| **PWA** | Service Worker, Web App Manifest, almacenamiento en caché offline |
| **Algoritmo** | SuperMemo-2 modificado, Motor de recomendación multi-factor |
| **Modelos ML** | AdaBoost (Multinomial NB), Gaussian NB, XGBoost con voting ensemble |
| **Pipeline NLP** | Análisis de frecuencia del corpus BCC, análisis de dependencias, puntuación de información mutua |
| **Despliegue** | Nginx, PM2, VPS con HTTPS |

---

## 📚 Fundamentos de Investigación

Este sistema está construido sobre una rigurosa investigación académica en la **Universidad de Pekín**, combinando teoría de SLA, técnicas de NLP y algoritmos de aprendizaje adaptativo:

- **Selección de vocabulario impulsada por corpus** — Análisis de frecuencia de palabras a través del corpus BCC (miles de millones de tokens) y un corpus de libros de texto CFL recolectado manualmente (165k caracteres de 13 libros de nivel intermedio) usando Pandas y SQL.
- **Modelado de frecuencia-dificultad** — Implementa el hallazgo de Stewart de que $\log(\text{frecuencia del corpus})$ correlaciona fuertemente con la dificultad de la palabra ($r=0.8$), permitiendo una clasificación automatizada de la dificultad.
- **Extracción de colocaciones basada en NLP** — Colocaciones provenientes de una base de conocimientos construida con análisis de dependencias y filtrado de información mutua, clasificadas por fuerza de colocación.
- **Selección automatizada de frases** — La complejidad de la frase se calcula sumando las dificultades normalizadas de las palabras, seleccionando los ejemplos de menor complejidad de los corpus de libros de texto.
- **Análisis de errores interlingüísticos** — Palabras confusas extraídas del Corpus de Composición Dinámica HSK basadas en la frecuencia de errores de los estudiantes, con aprendizaje separado para evitar la interferencia por agrupación semántica.
- **Pedagogía "Basada en Caracteres Relativos"** — Siguiendo la teoría de Bai Lesan: aprender caracteres a través de palabras (以词带字) en nivel intermedio, cubriendo pronunciación, forma y significados de alta frecuencia.
- **Equilibrio de carga cognitiva** — Palabras de frecuencia alta/media/baja y palabras confusas distribuidas uniformemente en las sesiones de aprendizaje.
- **Validado con estudiantes reales** — Experimento docente de dos meses con 17 estudiantes de HSK-4, 51 usuarios en total, produciendo mejoras estadísticamente significativas en la adquisición de vocabulario, aprendizaje de colocaciones y dominio de palabras.

---

## 🌐 Demo en Vivo

**¡No requiere instalación!** Visita el despliegue directamente:

👉 **[learnchinese.kzwbelieve.top](http://learnchinese.kzwbelieve.top)**

El sistema está desplegado en un VPS con proxy inverso Nginx, gestión de procesos PM2 y servicios full-stack funcionando 24/7.

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Prerrequisitos
- Python 3.11+ (se recomienda conda)
- Node.js 18+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/1137043480/word-learning-system.git
cd word-learning-system

# Instalar dependencias del backend
pip install -r requirements.txt

# Instalar dependencias del frontend
npm install
```

### Ejecución del Sistema

#### Opción 1: Inicio en un clic (Recomendado)
```bash
# Generar datos de prueba automáticamente e iniciar servidor API
./start_system.sh

# En otra terminal, iniciar el frontend
npm run dev
```

#### Opción 2: Inicio Manual
```bash
# Iniciar servidor API Fase 2 (puerto 5004)
python app_phase.py

# Iniciar servidor de desarrollo frontend (puerto 3000)
npm run dev
```

#### Opción 3: Despliegue con Docker
```bash
# Despliegue de producción con Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Acceso
- **Local**: http://localhost:3000 (dev) o http://localhost:3002 (Docker)
- **En vivo**: http://learnchinese.kzwbelieve.top

---

## 🎯 Recorrido de Funciones

### Ruta de Experiencia Recomendada

1. **Estado del Sistema** → `/system-status` — Verificar salud del servicio y resumen de arquitectura.
2. **Demo Fase 2** → `/phase-demo` — Demo interactiva del motor de recomendación adaptativo.
3. **Panel de Aprendizaje** → `/learning-dashboard` — Analíticas completas y visualización.
4. **Comenzar a Aprender** → `/word-learning-entrance` — Experiencia de aprendizaje personalizada guiada por VKS.

### Páginas Principales

| Página | Ruta | Descripción |
|------|-------|-------------|
| Inicio | `/` | Página de bienvenida y entrada al aprendizaje |
| Evaluación VKS | `/word-learning-entrance` | Test de la Escala de Conocimiento del Vocabulario |
| Aprendizaje de Caracteres | `/character-learning` | Módulo de caracteres chinos |
| Aprendizaje de Vocabulario | `/word-learning` | Significado y uso de palabras |
| Aprendizaje de Colocaciones | `/collocation-learning` | Patrones de colocación de palabras |
| Aprendizaje de Frases | `/sentence-learning` | Práctica de frases en contexto |
| Ejercicios | `/exercise` | Tres tipos de ejercicios |
| Panel de Aprendizaje | `/learning-dashboard` | Analíticas y perspectivas ⭐ |
| Demo Fase 2 | `/phase-demo` | Demostración de funciones ⭐ |
| Estado del Sistema | `/system-status` | Verificación de estado |

---

## 🔌 Referencia de la API

### Puertos de Servicio
| Puerto | Servicio |
|------|---------|
| 3000 | Frontend Next.js |
| 5004 | API Fase 2 (Principal) ⭐ |
| 5002 | API Extendida Fase 1 |
| 5001 | API Original |

### Endpoints Clave

```bash
# Estadísticas del sistema
GET /api/stats

# Recomendaciones adaptativas para un usuario
GET /api/adaptive/recommendation/{user_id}

# Datos del panel de aprendizaje
GET /api/analytics/user/{user_id}/dashboard

# Elementos de repaso pendientes
GET /api/review/user/{user_id}/due

# Lista de usuarios
GET /api/users

# Persistencia del estado de aprendizaje (sincronización entre dispositivos)
GET  /api/users/{user_id}/learning-state
PUT  /api/users/{user_id}/learning-state

# Gestión de sesiones de aprendizaje
POST /api/learning/session/start
POST /api/learning/session/end
POST /api/learning/events/batch
```

---

## 🧠 Cómo funciona el Motor Adaptativo

### Lógica de Recomendación
El sistema utiliza una estrategia de recomendación de múltiples capas:

1. **Repaso Urgente** — Elementos en riesgo de ser olvidados (basado en el modelo de decaimiento de memoria).
2. **Repaso Programado** — Elementos cuyo turno de repetición espaciada ha llegado.
3. **Contenido Nuevo** — Material nuevo ajustado al nivel de competencia del estudiante.

### Algoritmos Clave
- **SM-2 Modificado**: Programación de intervalos personalizada basada en el rendimiento individual.
- **Modelo de Fuerza de Memoria**: Evaluación multi-factor de la probabilidad de retención.
- **Reconocimiento de Patrones de Usuario**: Clasifica a los estudiantes por eficiencia, precisión y preferencias.
- **Puntuación de Confianza**: Cada recomendación incluye un índice de confianza.

---

## 📊 Métricas de Rendimiento

### Rendimiento del Algoritmo
| Métrica | Valor |
|--------|-------|
| Tiempo de respuesta de recomendación | < 300ms |
| Precisión de la recomendación | > 85% |
| Precisión de temporización de repasos | > 90% |
| Mejora de eficiencia de aprendizaje | > 25% |

### Rendimiento del Sistema
| Métrica | Valor |
|--------|-------|
| Tiempo de carga del panel | < 1.5s |
| Manejo de solicitudes concurrentes (100 req) | < 2s |
| Precisión de los datos | 99.5% |
| Latencia de actualización en tiempo real | < 100ms |

---

## 📂 Estructura del Proyecto

```
├── pages/                    # Páginas de Next.js
│   ├── index.tsx            # Página de inicio
│   ├── word-learning-entrance.tsx  # Evaluación VKS
│   ├── learning-dashboard.tsx      # Panel de analíticas ⭐
│   ├── phase-demo.tsx             # Demo de funciones ⭐
│   └── exercise.tsx                # Ejercicios de práctica
├── components/ui/            # Librería de componentes UI (shadcn)
├── src/
│   ├── context/             # Proveedores de React Context
│   ├── hooks/               # Hooks personalizados de React
│   └── lib/                 # Funciones de utilidad
├── app_phase.py            # Servidor API Fase 2 ⭐
├── adaptive_engine.py       # Motor de recomendación adaptativo
├── models_extended.py       # Modelos de base de datos
├── start_system.sh          # Script de inicio en un clic
└── README.md                # Este archivo
```

---

## 📈 Escala del Dataset

| Métrica | Cantidad |
|--------|-------|
| Usuarios de Prueba | 51 |
| Sesiones de Aprendizaje | 4,050 |
| Registros de Ejercicios | 15,200 |
| Eventos de Aprendizaje | 50,100 |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! No dudes en enviar issues y pull requests.

### Guías de Desarrollo
- Componentes de React: Componentes funcionales + TypeScript.
- Estilo de código: Sangría de 2 espacios, nomenclatura de archivos PascalCase.
- Python: Cumplimiento de PEP 8.
- Commits: Formato de [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia MIT](./LICENSE).

---

## 📚 Documentación

- [中文文档 (Chinese README)](./README_zh.md)

---

**Construido con ❤️ para estudiantes de idiomas de todo el mundo**
*Basado en una tesis de maestría de la Universidad de Pekín: "Investigación y Diseño de un Sistema Adaptativo de Aprendizaje de Vocabulario Chino Intermedio"*
