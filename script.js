const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzXnQsSpg21rMVIpR80pfRobnWCZZLo62Y2t1bFwtB-_U_MqmjG_BB-mKqCQMrWTI0/exec"; 

const state = {
    id_participante: null,
    id_condicion: null,
    modalidad: null,
    version_candidatura: null, // 'A' o 'B'
    estatus_acusacion: null,
    secuencia_ciclos: null,
    
    demographics: {},
    evaluaciones: [], 
    newsFlow: [],
    currentNewsIndex: 0,
    startTime: 0,
    timeoutTexto: null
};

// T3: Declaraciones de la candidatura
const declaraciones = {
    A: "«Lo que me mueve es la libertad de las personas para decidir sobre su propia vida. Quiero que el Estado garantice servicios públicos de calidad para toda la población y que nadie se quede sin apoyo cuando más lo necesita. Defenderé que cada mujer tenga la última palabra sobre su cuerpo y su futuro, que el Estado garantice el aborto legal, seguro y gratuito, y que ninguna mujer sea castigada por decidir.»",
    B: "«Lo que me mueve es la defensa de la familia y de los valores que nos han dado estabilidad como sociedad. Quiero que el Estado proteja a las familias y a las instituciones que las sostienen, y que nadie se quede sin apoyo cuando más lo necesita. Defenderé la vida desde la concepción y los derechos de los bebés por nacer, mantendré las restricciones legales al aborto y acompañaré a las mujeres que enfrentan un embarazo difícil.»"
};

// Opciones de verificación para la Tarea 2
const opcionesVerificacion = [
    { id: 'A', texto: "Defendía que cada mujer decida y que el aborto sea legal, seguro y gratuito" },
    { id: 'B', texto: "Defendía la vida desde la concepción y mantener restricciones legales al aborto" }
];

// T6: Configuración centralizada de noticias (rutas exactas en minúsculas)
const CONFIG_NOTICIAS = {
    'N1': { videoUrl: 'videos/n01.mp4', duracionMs: 12000, texto: "Un gremio profesional respalda las propuestas de la candidatura y destaca su compromiso con la transparencia institucional." },
    'A-': { videoUrl: 'videos/a_neg.mp4', duracionMs: 15000, texto: "Rumores en redes sociales señalan un depósito irregular en la cuenta de la candidatura; el hecho se describe como un error administrativo accidental." },
    'A+': { videoUrl: 'videos/a_pos.mp4', duracionMs: 15000, texto: "El equipo de campaña presenta documentos de auditoría interna que aclaran que el error bancario se corrigió sin afectación patrimonial." },
    'B-': { videoUrl: 'videos/b_neg.mp4', duracionMs: 16000, texto: "Un reportaje periodístico revela que un contrato público fue asignado a una empresa vinculada a familiares de la candidatura y lo atribuye a negligencia y falta de supervisión." },
    'B+': { videoUrl: 'videos/b_pos.mp4', duracionMs: 14000, texto: "Organizaciones civiles publican un comunicado en el que reconocen el impacto positivo de las iniciativas legislativas de la candidatura." },
    
    // Ciclos C y D dependen del estatus
    'C-_desmentida': { videoUrl: 'videos/c_neg_desmentida.mp4', duracionMs: 18000, texto: "Circula en redes sociales un audio que se sospecha generado con inteligencia artificial, en el que se acusa a la candidatura de ordenar de manera deliberada el desvío de fondos. Peritos concluyen que el audio es FALSO." },
    'C-_confirmada': { videoUrl: 'videos/c_neg_confirmada.mp4', duracionMs: 18000, texto: "Circula en redes sociales un audio que se sospecha generado con inteligencia artificial, en el que se acusa a la candidatura de ordenar de manera deliberada el desvío de fondos. Peritos concluyen que el audio es AUTÉNTICO." },
    'C+': { videoUrl: 'videos/c_pos.mp4', duracionMs: 14000, texto: "La candidatura presenta su plan de infraestructura y salud pública, con financiamiento y presupuesto transparentes." },
    
    'D-_desmentida': { videoUrl: 'videos/d_neg_desmentida.mp4', duracionMs: 19000, texto: "Una institución gubernamental publica un informe oficial con pruebas periciales que señala que la candidatura ordenó de manera deliberada la retención de fondos. La institución RETIRA el informe al detectar errores." },
    'D-_confirmada': { videoUrl: 'videos/d_neg_confirmada.mp4', duracionMs: 19000, texto: "Una institución gubernamental publica un informe oficial con pruebas periciales que señala que la candidatura ordenó de manera deliberada la retención de fondos. Una instancia independiente RATIFICA sus conclusiones." },
    'D+': { videoUrl: 'videos/d_pos.mp4', duracionMs: 12000, texto: "La candidatura ofrece una conferencia de prensa en la que reafirma su compromiso con el electorado." },
    
    'N10': { videoUrl: 'videos/n10.mp4', duracionMs: 10000, texto: "La autoridad electoral anuncia la fecha de la elección. Evaluación final." }
};

function validatePhase0() {
    const age = parseInt(document.getElementById('age-input').value, 10);
    const gender = document.getElementById('gender-input').value;
    const faculty = document.getElementById('faculty-input').value;
    const zona = document.getElementById('zona-input').value;
    const abortion = document.querySelector('input[name="abortion"]:checked');

    document.getElementById('btn-phase0-next').disabled = 
        !(age >= 18 && gender && faculty && zona && abortion);
}

function generateFallbackId() {
    return 'P-LOCAL' + Math.floor(1000 + Math.random() * 9000);
}

// Función auxiliar para barajar arreglos
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function assignCondition() {
    const btnText = document.getElementById('assign-btn-text');
    document.getElementById('btn-phase0-next').disabled = true;
    btnText.textContent = "Cargando instrumento...";

    const abortionVal = parseInt(document.querySelector('input[name="abortion"]:checked').value, 10);
    // T1: Definición de postura sobre el aborto (<=5 en contra, >5 a favor)
    const posturaAbortoStr = abortionVal > 5 ? "A favor" : "En contra";

    state.demographics = {
        age: document.getElementById('age-input').value,
        gender: document.getElementById('gender-input').value,
        sede: document.getElementById('faculty-input').value, // T4 Sede
        zona_residencia_zmvm: document.getElementById('zona-input').value,
        ideology: document.getElementById('ideology-slider').value,
        abortionStanceValue: abortionVal,
        abortionStanceGroup: posturaAbortoStr
    };

    try {
        /* T1: Se envía la sede y postura para el contrabalanceo. 
           NOTA: El cálculo exacto entre participantes requiere lógica en tu Google Apps Script. 
           Aquí preparamos la carga útil exacta para que el servidor lo asigne si lo tienes configurado,
           o si decides usar URLs (?celda=17), deberíamos capturarlo aquí en el futuro. */
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'registrar_y_asignar',
                sede: state.demographics.sede,
                postura_aborto: state.demographics.abortionStanceGroup
            })
        });
        
        let data = await response.json();
        
        if (!data || !data.version_candidatura) throw new Error("Datos incompletos");

        state.id_participante = data.id_participante;
        state.id_condicion = data.id_condicion;
        state.modalidad = String(data.modalidad).trim().toLowerCase();
        state.version_candidatura = String(data.version_candidatura).trim().toUpperCase(); // A o B
        state.estatus_acusacion = String(data.estatus_acusacion).trim().toLowerCase();
        state.secuencia_ciclos = String(data.secuencia_ciclos).trim().toUpperCase();

    } catch (err) {
        console.warn("Fallo de red o servidor. Usando asignación aleatoria local.");
        state.id_participante = generateFallbackId();
        state.id_condicion = 'FALLBACK-1';
        state.modalidad = Math.random() > 0.5 ? 'texto' : 'video';
        state.version_candidatura = Math.random() > 0.5 ? 'A' : 'B';
        state.estatus_acusacion = Math.random() > 0.5 ? 'desmentida' : 'confirmada';
        state.secuencia_ciclos = ['S1','S2','S3','S4'][Math.floor(Math.random()*4)];
    }

    applyModalityStrictness();
    buildNewsFlow();
    switchScreen('screen-transition');
}

function applyModalityStrictness() {
    const textContainer = document.getElementById('news-text-container');
    const videoContainer = document.getElementById('video-container');
    
    if (state.modalidad === 'texto') {
        if(videoContainer) videoContainer.classList.add('hidden');
        if(textContainer) textContainer.classList.remove('hidden');
        if(textContainer) textContainer.classList.add('flex');
    } else {
        if(textContainer) textContainer.classList.add('hidden');
        if(videoContainer) videoContainer.classList.remove('hidden');
    }
}

function highlightContent(text) {
    return text
        .replace("respalda", "<span class='highlight-word text-blue-600 bg-blue-50'>respalda</span>")
        .replace("irregular", "<span class='highlight-word text-red-600 bg-red-50'>irregular</span>")
        .replace("aclaran", "<span class='highlight-word text-green-600 bg-green-50'>aclaran</span>")
        .replace("negligencia", "<span class='highlight-word text-orange-600 bg-orange-50'>negligencia</span>")
        .replace("positiva", "<span class='highlight-word text-blue-600 bg-blue-50'>positiva</span>")
        .replace("FALSO", "<span class='highlight-word text-green-600 bg-green-50 px-1'>FALSO</span>")
        .replace("AUTÉNTICO", "<span class='highlight-word text-red-600 bg-red-50 px-1'>AUTÉNTICO</span>")
        .replace("deliberada", "<span class='highlight-word text-red-700'>deliberada</span>")
        .replace("transparentes", "<span class='highlight-word text-blue-600'>transparentes</span>")
        .replace("errores", "<span class='highlight-word text-orange-600'>errores</span>")
        .replace("RETIRA", "<span class='highlight-word text-orange-600'>RETIRA</span>")
        .replace("RATIFICA", "<span class='highlight-word text-red-600'>RATIFICA</span>")
        .replace("reafirma", "<span class='highlight-word text-blue-600'>reafirma</span>");
}

function buildNewsFlow() {
    const est = state.estatus_acusacion === 'desmentida' ? '_desmentida' : '_confirmada';

    const getNoticia = (key) => ({ id: key, ...CONFIG_NOTICIAS[key] });

    const N1 = getNoticia('N1');
    const cycleA = [ getNoticia('A-'), getNoticia('A+') ];
    const cycleB = [ getNoticia('B-'), getNoticia('B+') ];
    const cycleC = [ getNoticia('C-' + est), getNoticia('C+') ];
    const cycleD = [ getNoticia('D-' + est), getNoticia('D+') ];
    const N10 = getNoticia('N10');

    if (state.secuencia_ciclos === 'S1') state.newsFlow = [N1, ...cycleA, ...cycleB, ...cycleC, ...cycleD, N10];
    else if (state.secuencia_ciclos === 'S2') state.newsFlow = [N1, ...cycleB, ...cycleD, ...cycleA, ...cycleC, N10];
    else if (state.secuencia_ciclos === 'S3') state.newsFlow = [N1, ...cycleD, ...cycleC, ...cycleB, ...cycleA, N10];
    else state.newsFlow = [N1, ...cycleC, ...cycleA, ...cycleD, ...cycleB, N10];
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function resetSlider(phase) {
    const slider = document.getElementById(phase === 't0' ? 't0-slider' : 'news-slider');
    const display = document.getElementById(phase === 't0' ? 't0-value-display' : 'news-value-display');
    const btn = document.getElementById(phase === 't0' ? 'btn-phase1-next' : 'btn-news-next');
    
    slider.value = 50; 
    slider.classList.add('no-thumb'); 
    display.textContent = "";
    btn.disabled = true;

    // En T1-T10 el slider arranca deshabilitado hasta que acabe video/texto
    if (phase !== 't0') {
        slider.disabled = true;
    } else {
        slider.disabled = false;
    }

    const onFirstInput = function() {
        if(!slider.disabled) {
            slider.classList.remove('no-thumb');
            slider.removeEventListener('input', onFirstInput);
        }
    };
    slider.addEventListener('input', onFirstInput);
}

function updateSliderValue(phase) {
    const slider = document.getElementById(phase === 't0' ? 't0-slider' : 'news-slider');
    const display = document.getElementById(phase === 't0' ? 't0-value-display' : 'news-value-display');
    const btn = document.getElementById(phase === 't0' ? 'btn-phase1-next' : 'btn-news-next');

    display.textContent = slider.value;
    btn.disabled = false;
}

function acceptConsent() { switchScreen('screen-phase0'); }
function goToInstructions() { switchScreen('screen-instructions'); }

function startPhase1() {
    const posturaAUsar = state.version_candidatura && declaraciones[state.version_candidatura] 
                         ? state.version_candidatura : 'A';
                         
    document.getElementById('dynamic-stance').textContent = declaraciones[posturaAUsar];
    
    resetSlider('t0');
    switchScreen('screen-phase1');
    state.startTime = Date.now(); 
}

function startPhase2() {
    state.evaluaciones.push({
        momento: 'T0',
        valor: document.getElementById('t0-slider').value,
        tiempo_ms: Date.now() - state.startTime
    });

    state.currentNewsIndex = 0;
    
    // Preparar opciones de verificación barajadas
    const contenedor = document.getElementById('verification-options');
    contenedor.innerHTML = "";
    const opciones = shuffleArray([...opcionesVerificacion]);
    opciones.forEach(op => {
        contenedor.innerHTML += `
            <label class="flex p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-pink-50 transition shadow-sm bg-white">
                <input type="radio" name="verification" value="${op.id}" class="mr-4 mt-1 w-5 h-5 accent-pink-500" onchange="enableFinish()">
                <span class="text-gray-800">${op.texto}</span>
            </label>
        `;
    });

    loadNewsItem();
    switchScreen('screen-phase2');
}

function loadNewsItem() {
    if (!state.newsFlow || state.currentNewsIndex >= state.newsFlow.length) {
        switchScreen('screen-closure');
        return;
    }

    const item = state.newsFlow[state.currentNewsIndex];
    document.getElementById('news-counter').textContent = `Noticia ${state.currentNewsIndex + 1} de 10`;
    
    resetSlider('news');
    
    if (state.modalidad === 'texto') {
        const textEl = document.getElementById('news-text');
        const timerMsg = document.getElementById('text-timer-msg');
        if(textEl) textEl.innerHTML = highlightContent(item.texto);
        
        timerMsg.textContent = "Por favor, lee la información detenidamente...";
        timerMsg.classList.remove('hidden');

        if(state.timeoutTexto) clearTimeout(state.timeoutTexto);
        state.timeoutTexto = setTimeout(() => {
            enableNewsEvaluation();
            timerMsg.textContent = "Ya puedes registrar tu respuesta.";
        }, item.duracionMs);

        state.startTime = Date.now(); 
    } else {
        const videoEl = document.getElementById('news-video');
        const errorMsg = document.getElementById('video-error-msg');
        const overlay = document.getElementById('video-overlay');
        
        errorMsg.classList.add('hidden');
        overlay.classList.remove('hidden');
        
        if(videoEl) {
            videoEl.src = item.videoUrl;
            videoEl.load();
            videoEl.onerror = () => {
                errorMsg.classList.remove('hidden');
                enableNewsEvaluation();
            };
        }
    }
}

// T6: Reproducir video tras hacer tap en overlay
function playCurrentVideo() {
    const videoEl = document.getElementById('news-video');
    const overlay = document.getElementById('video-overlay');
    
    if (videoEl) {
        videoEl.play().then(() => {
            overlay.classList.add('hidden');
            state.startTime = Date.now(); // Inicia tiempo T(x) al reproducir
        }).catch(e => {
            console.log("Error al reproducir", e);
            document.getElementById('video-error-msg').classList.remove('hidden');
            enableNewsEvaluation();
        });
    }
}

// Habilitar deslizador al terminar video o tiempo de lectura
function enableNewsEvaluation() {
    const slider = document.getElementById('news-slider');
    if (slider) slider.disabled = false;
}

function nextNewsItem() {
    const item = state.newsFlow[state.currentNewsIndex];
    state.evaluaciones.push({
        momento: `T${state.currentNewsIndex + 1}`,
        valor: document.getElementById('news-slider').value,
        tiempo_ms: Date.now() - state.startTime
    });

    state.currentNewsIndex++;
    if (state.currentNewsIndex < state.newsFlow.length) {
        loadNewsItem();
    } else {
        switchScreen('screen-closure');
    }
}

function enableFinish() {
    document.getElementById('btn-finish').disabled = false;
}

async function finishStudy() {
    const debriefingStep = document.getElementById('debriefing-step');
    const btn = document.getElementById('btn-finish');

    if (debriefingStep.classList.contains('hidden')) {
        document.getElementById('verification-step').classList.add('hidden');
        debriefingStep.classList.remove('hidden');
        btn.textContent = "Cerrar y Enviar Datos";
        btn.classList.replace('from-[#f8c8d8]', 'from-green-400');
        btn.classList.replace('to-[#eab4c6]', 'to-emerald-500');
    } else {
        btn.textContent = "Guardando...";
        btn.disabled = true;

        const respuestaVerificacion = document.querySelector('input[name="verification"]:checked').value;

        // T1 y T2: Agregar datos solicitados
        const payload = {
            action: 'guardar_experimento_completo',
            id_participante: state.id_participante,
            id_condicion: state.id_condicion,
            modalidad: state.modalidad,
            estatus_acusacion: state.estatus_acusacion,
            version_candidatura: state.version_candidatura,
            apellido_candidatura: "MARTINEZ", // Constante
            secuencia_ciclos: state.secuencia_ciclos,
            sede: state.demographics.sede,
            postura_aborto: state.demographics.abortionStanceGroup,
            postura_aborto_valor_crudo: state.demographics.abortionStanceValue,
            respuesta_verificacion: respuestaVerificacion,
            verificacion_correcta: respuestaVerificacion === state.version_candidatura,
            evaluaciones: state.evaluaciones,
            demographics: state.demographics
        };

        try {
            await fetch(BACKEND_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            document.body.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center border-t-8 border-[#f8c8d8]">
                        <h3 class="text-xl font-bold mb-4 text-gray-800">¡Muchas gracias!</h3>
                        <p class="text-gray-700 mb-6">Tus datos han sido guardados con éxito en la base de datos. Ya puedes cerrar esta pestaña.</p>
                    </div>
                </div>`;
        } catch (err) {
            alert("Error al guardar en el servidor remoto. Intenta de nuevo.");
            btn.disabled = false;
            btn.textContent = "Reintentar envío";
        }
    }
}

// T6 Modo Revisión: ?revision=1
function checkRevisionMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('revision') === '1') {
        const overlay = document.getElementById('revision-overlay');
        const tbody = document.getElementById('revision-table-body');
        if (overlay && tbody) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            
            // Extraer videos únicos requeridos
            const requiredVideos = Object.values(CONFIG_NOTICIAS).map(n => n.videoUrl);
            const uniqueVideos = [...new Set(requiredVideos)];
            
            uniqueVideos.forEach(video => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td class="border border-gray-600 p-2">${video}</td><td class="border border-gray-600 p-2 text-yellow-400">Comprobando...</td>`;
                tbody.appendChild(tr);
                
                fetch(video, { method: 'HEAD' })
                    .then(res => {
                        const td = tr.lastElementChild;
                        if (res.ok) { td.textContent = 'Existe'; td.className = 'border border-gray-600 p-2 text-green-400'; }
                        else { td.textContent = 'No encontrado (404)'; td.className = 'border border-gray-600 p-2 text-red-500'; }
                    })
                    .catch(() => {
                        const td = tr.lastElementChild;
                        td.textContent = 'Error de red / CORS'; td.className = 'border border-gray-600 p-2 text-red-500';
                    });
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    switchScreen('screen-cover');
    checkRevisionMode();
});
