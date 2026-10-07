const sheetURL = "https://script.google.com/macros/s/AKfycbyVY3la-B-vyOFT32yxssDQ_fYIbOLCeNVrZn6GoWlAH-9wfa7bf7ciEwSZCdEOl_eU/exec";

// 1. GENERACIÓN DE LA MATRIZ DE CONTRABALANCEO (32 Grupos Experimentales)
const experimentalGroups = [];
const stancesData = [
    { id: 'progresista', text: "«Me identifico con una agenda progresista. Creo firmemente en ampliar las libertades individuales y en que el Estado debe garantizar el acceso a servicios públicos de calidad. Me opongo a cualquier restricción al derecho de las mujeres a decidir sobre su cuerpo; el acceso a una interrupción legal del embarazo debe estar garantizado.»" },
    { id: 'conservadora', text: "«Me identifico con una agenda conservadora. Creo firmemente en la importancia de la familia tradicional y en proteger las instituciones. Apoyo mantener restricciones legales al aborto; el Estado debe proteger la vida desde la concepción, aunque reconozco la importancia de acompañar a las mujeres en situaciones difíciles.»" }
];

stancesData.forEach(stance => {
    ['texto', 'video'].forEach(mod => {
        ['desmentida', 'confirmada'].forEach(cond => {
            ['S1', 'S2', 'S3', 'S4'].forEach(seq => {
                experimentalGroups.push({ stance: stance, modality: mod, condition: cond, sequence: seq });
            });
        });
    });
});

// 2. ASIGNACIÓN CONTRABALANCEADA (No aleatoria)
let groupIndex = parseInt(localStorage.getItem('participantCounter'));
if (isNaN(groupIndex)) {
    groupIndex = Date.now() % 32; 
}
const assignedGroup = experimentalGroups[groupIndex % 32];
localStorage.setItem('participantCounter', (groupIndex + 1).toString());

const state = {
    demographics: {},
    evaluations: [], 
    currentNewsIndex: 0,
    verificationAnswer: null,
    candidateStanceId: assignedGroup.stance.id,
    experimentalCondition: assignedGroup.condition,
    modality: assignedGroup.modality,
    sequenceType: assignedGroup.sequence,
    newsFlow: []
};

const assignedStance = assignedGroup.stance.text;

// 3. ESTRUCTURACIÓN DE LOS CICLOS (Basado en el Anteproyecto)
function generateNewsFlow() {
    const N1 = { id: 'N1', type: 'text', content: "Un gremio profesional respalda las propuestas de la candidatura y destaca su compromiso con la transparencia institucional." };
    const N10 = { id: 'N10', type: 'text', content: "La autoridad electoral anuncia la fecha de la elección. Evaluación final." };

    const cycleA = [
        { id: 'A-', type: 'video', content: "Rumores en redes sociales señalan un depósito irregular en la cuenta de la candidatura...", videoUrl: "video1.mp4" },
        { id: 'A+', type: 'text', content: "El equipo de campaña presenta documentos de auditoría interna que aclaran que el error bancario se corrigió sin afectación patrimonial." }
    ];
    const cycleB = [
        { id: 'B-', type: 'video', content: "Un reportaje periodístico revela que un contrato público fue asignado a una empresa vinculada a familiares de la candidatura...", videoUrl: "video2.mp4" },
        { id: 'B+', type: 'text', content: "Organizaciones civiles publican un comunicado en el que reconocen el impacto positivo de las iniciativas legislativas de la candidatura." }
    ];
    const cycleC = [
        { id: 'C-', type: 'video', content: `Circula en redes sociales un audio que se sospecha generado con inteligencia artificial... Peritos concluyen que el audio es ${state.experimentalCondition === 'desmentida' ? 'falso' : 'auténtico'}.`, videoUrl: "URL_DE_TU_VIDEO_3.mp4" },
        { id: 'C+', type: 'text', content: "La candidatura presenta su plan de infraestructura y salud pública, con financiamiento y presupuesto transparentes." }
    ];
    const cycleD = [
        { id: 'D-', type: 'video', content: `Una institución gubernamental publica un informe oficial con pruebas periciales... ${state.experimentalCondition === 'desmentida' ? 'La institución retira el informe al detectar errores en las pruebas.' : 'Una instancia independiente ratifica sus conclusiones.'}`, videoUrl: "URL_DE_TU_VIDEO_4.mp4" },
        { id: 'D+', type: 'text', content: "La candidatura ofrece una conferencia de prensa en la que reafirma su compromiso con el electorado." }
    ];

    let flow = [];
    if (state.sequenceType === 'S1') flow = [N1, ...cycleA, ...cycleB, ...cycleC, ...cycleD, N10];
    if (state.sequenceType === 'S2') flow = [N1, ...cycleB, ...cycleD, ...cycleA, ...cycleC, N10];
    if (state.sequenceType === 'S3') flow = [N1, ...cycleD, ...cycleC, ...cycleB, ...cycleA, N10];
    if (state.sequenceType === 'S4') flow = [N1, ...cycleC, ...cycleA, ...cycleD, ...cycleB, N10];

    state.newsFlow = flow;
}

// 4. FUNCIONES DE INTERFAZ Y TRANSICIÓN
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function acceptConsent() {
    switchScreen('screen-phase0');
}

function validatePhase0() {
    const ageInput = document.getElementById('age-input');
    ageInput.value = ageInput.value.replace(/[^0-9]/g, '');
    
    const age = parseInt(ageInput.value, 10);
    const career = document.getElementById('career-input').value.trim();
    const stance = document.querySelector('input[name="abortion"]:checked');
    const btn = document.getElementById('btn-phase0-next');

    btn.disabled = !(age >= 18 && age <= 25 && career !== "" && stance);
}

function updateSliderValue(phase) {
    let slider = document.getElementById(phase === 't0' ? 't0-slider' : 'news-slider');
    let display = document.getElementById(phase === 't0' ? 't0-value-display' : 'news-value-display');
    let btn = document.getElementById(phase === 't0' ? 'btn-phase1-next' : 'btn-news-next');

    display.textContent = slider.value;
    display.classList.remove('slider-value-hidden');
    display.classList.add('slider-value-visible');
    btn.disabled = false;
}

function resetSlider(phase) {
    let slider = document.getElementById(phase === 't0' ? 't0-slider' : 'news-slider');
    let display = document.getElementById(phase === 't0' ? 't0-value-display' : 'news-value-display');
    let btn = document.getElementById(phase === 't0' ? 'btn-phase1-next' : 'btn-news-next');
    
    slider.value = 50; 
    display.textContent = 50;
    display.classList.add('slider-value-hidden');
    display.classList.remove('slider-value-visible');
    btn.disabled = true;
}

function goToTransition() {
    state.demographics = {
        age: document.getElementById('age-input').value,
        career: document.getElementById('career-input').value,
        ideology: document.getElementById('ideology-slider').value,
        abortionStance: document.querySelector('input[name="abortion"]:checked').value
    };
    generateNewsFlow(); 
    switchScreen('screen-transition');
}

function goToInstructions() {
    switchScreen('screen-instructions');
}

function startPhase1() {
    document.getElementById('dynamic-stance').textContent = assignedStance;
    resetSlider('t0');
    switchScreen('screen-phase1');
}

function startPhase2() {
    state.evaluations.push({ step: 'T0', value: document.getElementById('t0-slider').value });
    state.currentNewsIndex = 0;
    loadNewsItem();
    switchScreen('screen-phase2');
}

function highlightContent(text) {
    return text
        .replace("respalda", "<span class='highlight-word text-blue-600 bg-blue-50'>respalda</span>")
        .replace("irregular", "<span class='highlight-word text-red-600 bg-red-50'>irregular</span>")
        .replace("aclaran", "<span class='highlight-word text-green-600 bg-green-50'>aclaran</span>")
        .replace("negligencia", "<span class='highlight-word text-orange-600 bg-orange-50'>negligencia</span>")
        .replace("positiva", "<span class='highlight-word text-blue-600 bg-blue-50'>positiva</span>")
        .replace("falso", "<span class='highlight-word text-green-600 bg-green-50 px-1'>falso</span>")
        .replace("auténtico", "<span class='highlight-word text-red-600 bg-red-50 px-1'>auténtico</span>")
        .replace("deliberada", "<span class='highlight-word text-red-700'>deliberada</span>")
        .replace("transparentes", "<span class='highlight-word text-blue-600'>transparentes</span>")
        .replace("errores", "<span class='highlight-word text-orange-600'>errores</span>")
        .replace("ratifica", "<span class='highlight-word text-red-600'>ratifica</span>")
        .replace("reafirma", "<span class='highlight-word text-blue-600'>reafirma</span>");
}

function loadNewsItem() {
    const item = state.newsFlow[state.currentNewsIndex];
    document.getElementById('news-counter').textContent = `Noticia ${state.currentNewsIndex + 1} de 10`;
    
    const textContainer = document.getElementById('news-text');
    const videoContainer = document.getElementById('video-container');
    const videoEl = document.getElementById('news-video');
    
    textContainer.classList.remove('hidden');
    videoContainer.classList.add('hidden');
    videoEl.pause();
    
    if (state.modality === 'video' && item.type === 'video' && item.videoUrl) {
        textContainer.classList.add('hidden');
        videoContainer.classList.remove('hidden');
        videoEl.src = item.videoUrl;
        videoEl.load();
        
        let playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay requiere interacción. El usuario deberá dar play manualmente.", error);
            });
        }
    } else {
        textContainer.innerHTML = highlightContent(item.content);
    }
    resetSlider('news');
}

function nextNewsItem() {
    const currentItem = state.newsFlow[state.currentNewsIndex];
    state.evaluations.push({
        step: `T${state.currentNewsIndex + 1}_${currentItem.id}`,
        value: document.getElementById('news-slider').value
    });

    state.currentNewsIndex++;

    if (state.currentNewsIndex < state.newsFlow.length) {
        const container = document.getElementById('news-content-container');
        container.style.opacity = 0;
        setTimeout(() => {
            loadNewsItem();
            container.style.transition = 'opacity 0.4s';
            container.style.opacity = 1;
        }, 300);
    } else {
        switchScreen('screen-closure');
    }
}

function enableFinish() {
    document.getElementById('btn-finish').disabled = false;
}

// 5. ENVÍO DE DATOS A GOOGLE SHEETS
function finishStudy() {
    const verification = document.querySelector('input[name="verification"]:checked');
    const debriefingStep = document.getElementById('debriefing-step');
    const verificationStep = document.getElementById('verification-step');
    const btn = document.getElementById('btn-finish');

    if (debriefingStep.classList.contains('hidden')) {
        verificationStep.classList.add('hidden');
        debriefingStep.classList.remove('hidden');
        btn.textContent = "Cerrar y Enviar Datos";
        btn.classList.replace('from-[#f8c8d8]', 'from-green-400');
        btn.classList.replace('to-[#eab4c6]', 'to-emerald-500');
        state.verificationAnswer = verification ? verification.value : null;
    } else {
        btn.textContent = "Enviando...";
        btn.disabled = true;

        const payload = {
            edad: state.demographics.age,
            carrera: state.demographics.career,
            ideologia: state.demographics.ideology,
            aborto: state.demographics.abortionStance,
            posturaCandidatura: state.candidateStanceId,
            modalidad: state.modality,
            condicion: state.experimentalCondition,
            secuencia: state.sequenceType,
            verificacion: state.verificationAnswer,
            ...state.evaluations.reduce((acc, curr, index) => {
                acc[`Ev_${index}`] = curr.value;
                return acc;
            }, {})
        };

        console.log("Enviando a Google Sheets:", payload);

        fetch(sheetURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(() => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center border-t-8 border-[#f8c8d8]">
                        <h3 class="text-xl font-bold mb-4 text-gray-800">¡Muchas gracias!</h3>
                        <p class="text-gray-700 mb-6">Tus datos han sido enviados con éxito. Puedes cerrar esta pestaña.</p>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }).catch(err => {
            console.error("Error al enviar datos:", err);
            alert("Hubo un problema de conexión al enviar tus datos, por favor revisa tu internet.");
            btn.textContent = "Reintentar";
            btn.disabled = false;
        });
    }
}

// INICIALIZACIÓN: Asegurar que el HTML esté completamente cargado antes de inicializar
document.addEventListener("DOMContentLoaded", function() {
    switchScreen('screen-cover');
});
