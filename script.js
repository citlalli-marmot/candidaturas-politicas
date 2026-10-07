const state = {
    demographics: {},
    evaluations: [], 
    currentNewsIndex: 0,
    verificationAnswer: null,
    experimentalCondition: Math.random() > 0.5 ? 'desmentida' : 'confirmada' // Asignación aleatoria del estatus de la acusación
};

// Textos extraídos fielmente del documento (Tabla 3)
const newsFlow = [
    { id: 'N1', type: 'text', valencia: '+', content: "Un gremio profesional respalda las propuestas de la candidatura y destaca su compromiso con la transparencia institucional." },
    { id: 'A-', type: 'video', valencia: '-', content: "Rumores en redes sociales señalan un depósito irregular en la cuenta de la candidatura; el hecho se describe como un error administrativo accidental.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_1.mp4" }, 
    { id: 'A+', type: 'text', valencia: '+', content: "El equipo de campaña presenta documentos de auditoría interna que aclaran que el error bancario se corrigió sin afectación patrimonial." },
    { id: 'B-', type: 'video', valencia: '-', content: "Un reportaje periodístico revela que un contrato público fue asignado a una empresa vinculada a familiares de la candidatura y lo atribuye a negligencia y falta de supervisión.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_2.mp4" }, 
    { id: 'B+', type: 'text', valencia: '+', content: "Organizaciones civiles publican un comunicado en el que reconocen el impacto positivo de las iniciativas legislativas de la candidatura." },
    { id: 'C-', type: 'video', valencia: '-', content: `Circula en redes sociales un audio que se sospecha generado con inteligencia artificial, en el que se acusa a la candidatura de ordenar de manera deliberada el desvío de fondos destinados a medicinas de un hospital público. Peritos concluyen que el audio es ${state.experimentalCondition === 'desmentida' ? 'falso' : 'auténtico'}.`, videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_3.mp4" }, 
    { id: 'C+', type: 'text', valencia: '+', content: "La candidatura presenta su plan de infraestructura y salud pública, con financiamiento y presupuesto transparentes." },
    { id: 'D-', type: 'video', valencia: '-', content: `Una institución gubernamental publica un informe oficial con pruebas periciales que señala que la candidatura ordenó de manera deliberada la retención de fondos destinados a la compra de equipo médico de un hospital público. ${state.experimentalCondition === 'desmentida' ? 'La institución retira el informe al detectar errores en las pruebas.' : 'Una instancia independiente ratifica sus conclusiones.'}`, videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_4.mp4" }, 
    { id: 'D+', type: 'text', valencia: '+', content: "La candidatura ofrece una conferencia de prensa en la que reafirma su compromiso con el electorado." },
    { id: 'N10', type: 'text', valencia: 'N', content: "La autoridad electoral anuncia la fecha de la elección. Evaluación final." }
];

const stances = [
    "«Me identifico con una agenda progresista. Creo firmemente en ampliar las libertades individuales y en que el Estado debe garantizar el acceso a servicios públicos de calidad. Me opongo a cualquier restricción al derecho de las mujeres a decidir sobre su cuerpo; el acceso a una interrupción legal del embarazo debe estar garantizado.»",
    "«Me identifico con una agenda conservadora. Creo firmemente en la importancia de la familia tradicional y en proteger las instituciones. Apoyo mantener restricciones legales al aborto; el Estado debe proteger la vida desde la concepción, aunque reconozco la importancia de acompañar a las mujeres en situaciones difíciles.»"
];

const assignedStance = stances[Math.floor(Math.random() * stances.length)];

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        void el.offsetWidth;
    });
    document.getElementById(screenId).classList.add('active');
}

function acceptConsent() {
    switchScreen('screen-phase0');
}

// Validación de Fase 0 (Edad entera, Carrera, Aborto en Likert)
function validatePhase0() {
    const ageInput = document.getElementById('age-input');
    // Forzar solo números (elimina letras y caracteres especiales)
    ageInput.value = ageInput.value.replace(/[^0-9]/g, '');
    
    const age = parseInt(ageInput.value, 10);
    const career = document.getElementById('career-input').value.trim();
    const stance = document.querySelector('input[name="abortion"]:checked');
    const btn = document.getElementById('btn-phase0-next');

    if (age >= 18 && age <= 25 && career !== "" && stance) {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
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
    state.evaluations.push({
        step: 'T0',
        value: document.getElementById('t0-slider').value
    });
    
    state.currentNewsIndex = 0;
    loadNewsItem();
    switchScreen('screen-phase2');
}

// Función para resaltar palabras importantes
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
    const item = newsFlow[state.currentNewsIndex];
    document.getElementById('news-counter').textContent = `Noticia ${state.currentNewsIndex + 1} de 10`;
    
    const textContainer = document.getElementById('news-text');
    const videoContainer = document.getElementById('video-container');
    const videoEl = document.getElementById('news-video');
    
    textContainer.classList.remove('hidden');
    videoContainer.classList.add('hidden');
    videoEl.pause();
    
    if (item.type === 'video' && item.videoUrl && !item.videoUrl.includes("URL_DE_TU_VIDEO")) {
        textContainer.classList.add('hidden');
        videoContainer.classList.remove('hidden');
        videoEl.src = item.videoUrl;
        videoEl.load();
    } else {
        // Formato texto puro, usando la función para destacar palabras
        textContainer.innerHTML = highlightContent(item.content);
    }
    resetSlider('news');
}

function nextNewsItem() {
    const currentItem = newsFlow[state.currentNewsIndex];
    state.evaluations.push({
        step: `T${state.currentNewsIndex + 1}_${currentItem.id}`,
        value: document.getElementById('news-slider').value
    });

    state.currentNewsIndex++;

    if (state.currentNewsIndex < newsFlow.length) {
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

function finishStudy() {
    const verification = document.querySelector('input[name="verification"]:checked');
    const debriefingStep = document.getElementById('debriefing-step');
    const verificationStep = document.getElementById('verification-step');
    const btn = document.getElementById('btn-finish');

    if (debriefingStep.classList.contains('hidden')) {
        verificationStep.classList.add('hidden');
        debriefingStep.classList.remove('hidden');
        btn.textContent = "Cerrar y Enviar Datos";
        btn.classList.replace('from-[#a7c7e7]', 'from-green-400');
        btn.classList.replace('to-[#c3b1e1]', 'to-emerald-500');
        state.verificationAnswer = verification ? verification.value : null;
    } else {
        console.log("Datos Listos para la BD:", state);
        btn.textContent = "Enviando...";
        btn.disabled = true;
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center">
                        <h3 class="text-xl font-bold mb-4 text-gray-800">¡Muchas gracias!</h3>
                        <p class="text-gray-700 mb-6">Tus datos han sido enviados con éxito. Puedes cerrar esta pestaña.</p>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }, 1000);
    }
}

// Inicializar mostrando la primera pantalla
switchScreen('screen-cover');
