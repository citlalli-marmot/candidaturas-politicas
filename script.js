const state = {
            demographics: {},
            evaluations: [], 
            currentNewsIndex: 0,
            verificationAnswer: null
        };

        // NOTA PARA GITHUB: Sustituye las URLs falsas por los enlaces directos a tus .mp4 alojados en GitHub
        const newsFlow = [
            { id: 'N1', type: 'text', valencia: '+', content: "Un gremio profesional respalda las propuestas de la candidatura y destaca su compromiso con la transparencia institucional." },
            { id: 'A-', type: 'video', valencia: '-', content: "Rumores señalan un depósito irregular.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_1.mp4" }, 
            { id: 'A+', type: 'text', valencia: '+', content: "El equipo de campaña presenta documentos de auditoría interna que aclaran que el error bancario se corrigió sin afectación." },
            { id: 'B-', type: 'video', valencia: '-', content: "Reportaje periodístico revela contrato asignado a familiares.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_2.mp4" }, 
            { id: 'B+', type: 'text', valencia: '+', content: "Organizaciones civiles reconocen el impacto positivo de las iniciativas legislativas de la candidatura." },
            { id: 'C-', type: 'video', valencia: '-', content: "Circula audio sospechoso de IA ordenando desvío de fondos. Peritos concluyen que es falso.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_3.mp4" }, 
            { id: 'C+', type: 'text', valencia: '+', content: "La candidatura presenta su plan de infraestructura y salud pública, con financiamiento transparente." },
            { id: 'D-', type: 'video', valencia: '-', content: "Informe oficial señala retención de fondos. La institución retira el informe al detectar errores.", videoUrl: "URL_DE_TU_VIDEO_EN_GITHUB_4.mp4" }, 
            { id: 'D+', type: 'text', valencia: '+', content: "La candidatura ofrece una conferencia de prensa en la que reafirma su compromiso con el electorado." },
            { id: 'N10', type: 'text', valencia: 'N', content: "La autoridad electoral anuncia la fecha de la elección. Última evaluación." }
        ];

        const stances = [
            "«Me identifico con una agenda progresista. Creo firmemente en ampliar las libertades y en garantizar el acceso a una interrupción legal del embarazo.»",
            "«Me identifico con una agenda conservadora. Considero que el Estado debe proteger la vida desde la concepción y defender los valores tradicionales.»"
        ];
        
        const assignedStance = stances[Math.floor(Math.random() * stances.length)];

        function switchScreen(screenId) {
            document.querySelectorAll('.screen').forEach(el => {
                el.classList.remove('active');
                void el.offsetWidth; // Force reflow para reiniciar animaciones CSS
            });
            const nextScreen = document.getElementById(screenId);
            nextScreen.classList.add('active');
        }

        function validatePhase0() {
            const age = document.getElementById('age-input').value;
            const stance = document.getElementById('abortion-stance').value;
            const consent = document.getElementById('consent-check').checked;
            const btn = document.getElementById('btn-phase0-next');

            if (age >= 18 && age <= 25 && stance !== "" && consent) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        }

        function updateSliderValue(phase) {
            let slider, display, btn;
            
            if (phase === 't0') {
                slider = document.getElementById('t0-slider');
                display = document.getElementById('t0-value-display');
                btn = document.getElementById('btn-phase1-next');
            } else {
                slider = document.getElementById('news-slider');
                display = document.getElementById('news-value-display');
                btn = document.getElementById('btn-news-next');
            }

            display.textContent = slider.value;
            display.classList.remove('slider-value-hidden');
            display.classList.add('slider-value-visible');
            btn.disabled = false;
        }

        function resetSlider(phase) {
            let slider, display, btn;
            if (phase === 't0') {
                slider = document.getElementById('t0-slider');
                display = document.getElementById('t0-value-display');
                btn = document.getElementById('btn-phase1-next');
            } else {
                slider = document.getElementById('news-slider');
                display = document.getElementById('news-value-display');
                btn = document.getElementById('btn-news-next');
            }
            
            slider.value = 50; 
            display.textContent = 50;
            display.classList.add('slider-value-hidden');
            display.classList.remove('slider-value-visible');
            btn.disabled = true;
        }

        function startPhase1() {
            state.demographics = {
                age: document.getElementById('age-input').value,
                ideology: document.getElementById('ideology-slider').value,
                abortionStance: document.getElementById('abortion-stance').value
            };
            
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

        function loadNewsItem() {
            const item = newsFlow[state.currentNewsIndex];
            
            document.getElementById('news-counter').textContent = `Noticia ${state.currentNewsIndex + 1} de 10`;
            
            const textContainer = document.getElementById('news-text');
            const videoContainer = document.getElementById('video-container');
            const videoEl = document.getElementById('news-video');
            
            // Restablecer vistas
            textContainer.classList.remove('hidden');
            videoContainer.classList.add('hidden');
            videoEl.pause();
            
            if (item.type === 'video' && item.videoUrl && !item.videoUrl.includes("URL_DE_TU_VIDEO")) {
                textContainer.classList.add('hidden');
                videoContainer.classList.remove('hidden');
                videoEl.src = item.videoUrl;
                videoEl.load();
            } else if (item.type === 'video') {
                 // Fallback si la url no ha sido configurada correctamente en github
                 textContainer.textContent = "[Espacio para Video] " + item.content;
            } else {
                textContainer.textContent = item.content;
            }
            
            resetSlider('news');
        }

        function videoEnded() {
            console.log("Video finalizado - Interacción de usuario habilitada.");
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
                                <p class="text-gray-600 mb-6">Tus datos han sido enviados con éxito. Puedes cerrar esta pestaña.</p>
                                <button onclick="this.parentElement.parentElement.remove()" class="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-medium">Cerrar</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    btn.textContent = "Finalizado";
                }, 1000);
            }
        }

        // Forzar la primera pantalla visible
        switchScreen('screen-cover');
