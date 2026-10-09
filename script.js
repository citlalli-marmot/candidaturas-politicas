const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyF3peCP_LZaNmf6Xx-svmPE4BY9cjgLZsNzuIhwBQpvH1mpoE8CoAC-S_2s4inJ4z9/exec"; 

const state = {
    id_participante: null,
    id_condicion: null,
    modalidad: null,
    postura_candidatura: null,
    estatus_acusacion: null,
    secuencia_ciclos: null,
    
    demographics: {},
    evaluaciones: [], 
    newsFlow: [],
    currentNewsIndex: 0,
    startTime: 0
};

const stancesData = {
    progresista: "«Me identifico con una agenda progresista. Creo firmemente en ampliar las libertades individuales y en que el Estado debe garantizar el acceso a servicios públicos de calidad. Me opongo a cualquier restricción al derecho de las mujeres a decidir sobre su cuerpo; el acceso a una interrupción legal del embarazo debe estar garantizado.»",
    conservadora: "«Me identifico con una agenda conservadora. Creo firmemente en la importancia de la familia tradicional y en proteger las instituciones. Apoyo mantener restricciones legales al aborto; el Estado debe proteger la vida desde la concepción.»"
};

function validatePhase0() {
    const age = parseInt(document.getElementById('age-input').value, 10);
    const gender = document.getElementById('gender-input').value;
    const faculty = document.getElementById('faculty-input').value;
    const career = document.getElementById('career-input').value.trim();
    const abortion = document.querySelector('input[name="abortion"]:checked');

    // Validación corregida: Mayor a 18 sin límite superior
    document.getElementById('btn-phase0-next').disabled = 
        !(age >= 18 && gender && faculty && career && abortion);
}

async function assignCondition() {
    const btnText = document.getElementById('assign-btn-text');
    document.getElementById('btn-phase0-next').disabled = true;
    
    // Mensaje genérico para no revelar el proceso técnico
    btnText.textContent = "Cargando instrumento...";

    state.demographics = {
        age: document.getElementById('age-input').value,
        gender: document.getElementById('gender-input').value,
        faculty: document.getElementById('faculty-input').value,
        career: document.getElementById('career-input').value,
        ideology: document.getElementById('ideology-slider').value,
        abortionStance: document.querySelector('input[name="abortion"]:checked').value
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'registrar_y_asignar',
                facultad: state.demographics.faculty
            })
        });
        
        let data = await response.json();
        
        // SISTEMA ANTI-BLOQUEO: Si el servidor falla o devuelve vacío, asigna una de emergencia.
        if (!data || !data.postura_candidatura) {
            console.warn("Fallo de sincronización. Usando asignación local.");
            data = {
                id_participante: 'emergencia-' + Date.now(),
                id_condicion: 'local-1',
                modalidad: Math.random() > 0.5 ? 'texto' : 'video',
                postura_candidatura: Math.random() > 0.5 ? 'progresista' : 'conservadora',
                estatus_acusacion: Math.random() > 0.5 ? 'desmentida' : 'confirmada',
                secuencia_ciclos: ['S1','S2','S3','S4'][Math.floor(Math.random()*4)]
            };
        }

        state.id_participante = data.id_participante;
        state.id_condicion = data.id_condicion;
        state.modalidad = String(data.modalidad).trim().toLowerCase();
        state.postura_candidatura = String(data.postura_candidatura).trim().toLowerCase();
        state.estatus_acusacion = String(data.estatus_acusacion).trim().toLowerCase();
        state.secuencia_ciclos = String(data.secuencia_ciclos).trim().toUpperCase();

        applyModalityStrictness();
        buildNewsFlow();
        switchScreen('screen-transition');
    } catch (err) {
        console.error("Error de red:", err);
        // Fallback extremo por si no hay internet (CORS / Bloqueo)
        state.id_participante = 'offline-' + Date.now();
        state.modalidad = 'texto';
        state.postura_candidatura = 'progresista';
        state.estatus_acusacion = 'desmentida';
        state.secuencia_ciclos = 'S1';
        
        applyModalityStrictness();
        buildNewsFlow();
        switchScreen('screen-transition');
    }
}

function applyModalityStrictness() {
    const textContainer = document.getElementById('news-text');
    const videoContainer = document.getElementById('video-container');
    
    if (state.modalidad === 'texto') {
        if(videoContainer) videoContainer.parentNode.removeChild(videoContainer);
    } else {
        if(textContainer) textContainer.parentNode.removeChild(textContainer);
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
    const isDesmentida = state.estatus_acusacion === 'desmentida';

    const N1 = { id: 'N1', valencia: 'positiva', content: "Un gremio profesional respalda las propuestas de la candidatura y destaca su compromiso con la transparencia institucional.", videoUrl: "URL_VIDEO_1.mp4" };
    const N10 = { id: 'N10', valencia: 'neutra', content: "La autoridad electoral anuncia la fecha de la elección. Evaluación final.", videoUrl: "URL_VIDEO_10.mp4" };

    const cycleA = [
        { id: 'A-', valencia: 'negativa', content: "Rumores en redes sociales señalan un depósito irregular en la cuenta de la candidatura; el hecho se describe como un error administrativo accidental.", videoUrl: "URL_VIDEO_A_MINUS.mp4" },
        { id: 'A+', valencia: 'positiva', content: "El equipo de campaña presenta documentos de auditoría interna que aclaran que el error bancario se corrigió sin afectación patrimonial.", videoUrl: "URL_VIDEO_A_PLUS.mp4" }
    ];
    const cycleB = [
        { id: 'B-', valencia: 'negativa', content: "Un reportaje periodístico revela que un contrato público fue asignado a una empresa vinculada a familiares de la candidatura y lo atribuye a negligencia y falta de supervisión.", videoUrl: "URL_VIDEO_B_MINUS.mp4" },
        { id: 'B+', valencia: 'positiva', content: "Organizaciones civiles publican un comunicado en el que reconocen el impacto positivo de las iniciativas legislativas de la candidatura.", videoUrl: "URL_VIDEO_B_PLUS.mp4" }
    ];
    
    const cycleC = [
        { id: 'C-', valencia: 'negativa', 
          content: isDesmentida ? "Circula en redes sociales un audio que se sospecha generado con inteligencia artificial, en el que se acusa a la candidatura de ordenar de manera deliberada el desvío de fondos. Peritos concluyen que el audio es FALSO." : "Circula en redes sociales un audio que se sospecha generado con inteligencia artificial, en el que se acusa a la candidatura de ordenar de manera deliberada el desvío de fondos. Peritos concluyen que el audio es AUTÉNTICO.", 
          videoUrl: isDesmentida ? "URL_C_FALSO.mp4" : "URL_C_AUTENTICO.mp4" },
        { id: 'C+', valencia: 'positiva', content: "La candidatura presenta su plan de infraestructura y salud pública, con financiamiento y presupuesto transparentes.", videoUrl: "URL_VIDEO_C_PLUS.mp4" }
    ];
    
    const cycleD = [
        { id: 'D-', valencia: 'negativa', 
          content: isDesmentida ? "Una institución gubernamental publica un informe oficial con pruebas periciales que señala que la candidatura ordenó de manera deliberada la retención de fondos. La institución RETIRA el informe al detectar errores." : "Una institución gubernamental publica un informe oficial con pruebas periciales que señala que la candidatura ordenó de manera deliberada la retención de fondos. Una instancia independiente RATIFICA sus conclusiones.", 
          videoUrl: isDesmentida ? "URL_D_RETIRADO.mp4" : "URL_D_RATIFICADO.mp4" },
        { id: 'D+', valencia: 'positiva', content: "La candidatura ofrece una conferencia de prensa en la que reafirma su compromiso con el electorado.", videoUrl: "URL_VIDEO_D_PLUS.mp4" }
    ];

    if (state.secuencia_ciclos === 'S1') state.newsFlow = [N1, ...cycleA, ...cycleB, ...cycleC, ...cycleD, N10];
    else if (state.secuencia_ciclos === 'S2') state.newsFlow = [N1, ...cycleB, ...cycleD, ...cycleA, ...cycleC, N10];
    else if (state.secuencia_ciclos === 'S3') state.newsFlow = [N1, ...cycleD, ...cycleC, ...cycleB, ...cycleA, N10];
    else if (state.secuencia_ciclos === 'S4') state.newsFlow = [N1, ...cycleC, ...cycleA, ...cycleD, ...cycleB, N10];
    else state.newsFlow = [N1, ...cycleA, ...cycleB, ...cycleC, ...cycleD, N10]; // Fallback final
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

    slider.addEventListener('input', function onFirstInput() {
        slider.classList.remove('no-thumb');
        slider.removeEventListener('input', onFirstInput);
    });
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
    // Si por alguna razon el estado no se guardo correctamente, evita crasheo usando el fallback
    const posturaAUsar = state.postura_candidatura && stancesData[state.postura_candidatura] 
                         ? state.postura_candidatura : 'progresista';
                         
    document.getElementById('dynamic-stance').textContent = stancesData[posturaAUsar];
    
    resetSlider('t0');
    state.startTime = Date.now();
    switchScreen('screen-phase1');
}

function startPhase2() {
    state.evaluaciones.push({
        momento: 'T0',
        noticia_codigo: 'Biografia',
        valencia_noticia: 'neutra',
        valor: document.getElementById('t0-slider').value,
        tiempo_ms: Date.now() - state.startTime
    });

    state.currentNewsIndex = 0;
    loadNewsItem();
    switchScreen('screen-phase2');
}

function loadNewsItem() {
    // Seguridad adicional si se desborda el indice
    if (!state.newsFlow || state.currentNewsIndex >= state.newsFlow.length) {
        switchScreen('screen-closure');
        return;
    }

    const item = state.newsFlow[state.currentNewsIndex];
    document.getElementById('news-counter').textContent = `Noticia ${state.currentNewsIndex + 1} de 10`;
    
    if (state.modalidad === 'texto') {
        const textEl = document.getElementById('news-text');
        if(textEl) textEl.innerHTML = highlightContent(item.content);
    } else {
        const videoEl = document.getElementById('news-video');
        if(videoEl) {
            videoEl.src = item.videoUrl;
            videoEl.play().catch(e => console.log("Autoplay bloqueado, requiere clic manual"));
        }
    }
    
    resetSlider('news');
    state.startTime = Date.now();
}

function nextNewsItem() {
    const item = state.newsFlow[state.currentNewsIndex];
    state.evaluaciones.push({
        momento: `T${state.currentNewsIndex + 1}`,
        noticia_codigo: item.id,
        valencia_noticia: item.valencia,
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

        const payload = {
            action: 'guardar_experimento_completo',
            ...state,
            postura_recordada: document.querySelector('input[name="verification"]:checked').value
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

document.addEventListener("DOMContentLoaded", () => switchScreen('screen-cover'));
