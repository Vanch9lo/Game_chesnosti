// Состояние игры
let gameState = {
    health: 100,
    stamina: 100,
    morality: 0,
    honor: 0,      // Новая шкала "Честь"
    goal: 0,       // Новая шкала "Цель"
    money: 5000,
    currentScene: 'start',
    currentEpisode: 1,
    choices: {
        trainer: null, // 'vera' или 'crow'
        implant: false,
        finalChoice: null,
        episode1Ending: null
    },
    flags: {
        investigateFound: false,
        darayaHelped: false,
        alexandraAlly: false,
        evidenceCount: 0,
        crowCorruption: false,
        neuroscanPassed: false
    }
};

// Прогресс игрока
let playerProgress = {
    completedEpisodes: [],
    bestEndings: {},
    totalPlaytime: 0,
    startTime: null,
    unlockedEpisodes: [1, 2] // Оба эпизода доступны сразу
};

// Загрузка прогресса из localStorage
function loadProgress() {
    const saved = localStorage.getItem('honestGameProgress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            playerProgress = { ...playerProgress, ...data };
            // Убеждаемся, что оба эпизода доступны
            if (!playerProgress.unlockedEpisodes.includes(2)) {
                playerProgress.unlockedEpisodes.push(2);
            }
            updateProgressDisplay();
        } catch (error) {
            console.warn('Ошибка загрузки прогресса:', error);
        }
    }
    // Убеждаемся, что оба эпизода доступны по умолчанию
    playerProgress.unlockedEpisodes = [1, 2];
}

// Сохранение прогресса
function saveProgress() {
    try {
        localStorage.setItem('honestGameProgress', JSON.stringify(playerProgress));
    } catch (error) {
        console.warn('Ошибка сохранения прогресса:', error);
    }
}

// Обновление отображения прогресса
function updateProgressDisplay() {
    const completedEl = document.getElementById('completed-episodes');
    const bestEndingEl = document.getElementById('best-ending');
    const playtimeEl = document.getElementById('total-playtime');
    
    if (completedEl) {
        completedEl.textContent = `${playerProgress.completedEpisodes.length}/2`;
    }
    
    if (bestEndingEl) {
        const bestEnding = getBestEnding();
        bestEndingEl.textContent = bestEnding || 'Не пройдено';
    }
    
    if (playtimeEl) {
        playtimeEl.textContent = `${Math.round(playerProgress.totalPlaytime / 60)} мин`;
    }
    
    // Обновляем доступность эпизода 2
    updateEpisodeAvailability();
}

function getBestEnding() {
    const endingPriority = {
        'reform': 'Революция в спорте',
        'honor': 'Честь важнее золота', 
        'system_agent': 'Система вне игры',
        'victory_corrupted': 'Идеальный результат'
    };
    
    for (const [ending, title] of Object.entries(endingPriority)) {
        if (playerProgress.bestEndings[ending]) {
            return title;
        }
    }
    return null;
}

function updateEpisodeAvailability() {
    const episode2Button = document.getElementById('episode2-button');
    const episode2Status = document.getElementById('episode2-status');
    
    // Второй эпизод всегда доступен
    if (episode2Button) {
        episode2Button.disabled = false;
        episode2Button.className = 'w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition-all';
        episode2Button.textContent = 'Играть эпизод 2';
    }
    if (episode2Status) {
        episode2Status.textContent = '✓ Доступен';
        episode2Status.className = 'text-sm text-green-400';
    }
    
    // Убеждаемся, что оба эпизода в списке доступных
    if (!playerProgress.unlockedEpisodes.includes(2)) {
        playerProgress.unlockedEpisodes.push(2);
    }
}

// Аудио система - полностью рабочая версия
let audioSystem = {
    isMuted: false,
    currentMusic: null,
    musicVolume: 0.3,
    audioContext: null,
    musicPlayers: {},
    isInitialized: false
};

// Инициализация аудио
function initAudio() {
    try {
        // Создаем AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioSystem.audioContext = new AudioContextClass();
            
            // Создаем музыкальные плееры
            createMusicPlayers();
            
            audioSystem.isInitialized = true;
            console.log('Аудио система инициализирована');
            
            // Запускаем фоновую музыку после первого взаимодействия
            document.addEventListener('click', enableAudio, { once: true });
            document.addEventListener('keydown', enableAudio, { once: true });
        } else {
            console.warn('AudioContext не поддерживается');
        }
    } catch (error) {
        console.error('Ошибка инициализации аудио:', error);
    }
}

function enableAudio() {
    if (audioSystem.audioContext && audioSystem.audioContext.state === 'suspended') {
        audioSystem.audioContext.resume().then(() => {
            console.log('AudioContext активирован');
            startBackgroundMusic();
        });
    } else {
        startBackgroundMusic();
    }
}

function createMusicPlayers() {
    // Спокойная музыка - мягкие арпеджио
    audioSystem.musicPlayers.calm = createMelodyPlayer([
        { freq: 261.63, duration: 1.5 }, // C4
        { freq: 329.63, duration: 1.5 }, // E4
        { freq: 392.00, duration: 1.5 }, // G4
        { freq: 523.25, duration: 1.5 }, // C5
        { freq: 392.00, duration: 1.5 }, // G4
        { freq: 329.63, duration: 1.5 }, // E4
        { freq: 261.63, duration: 3.0 }  // C4
    ], 'sine', 0.15);
    
    // Эпическая музыка - мощные аккорды
    audioSystem.musicPlayers.epic = createMelodyPlayer([
        { freq: 130.81, duration: 1.0 }, // C3
        { freq: 164.81, duration: 1.0 }, // E3
        { freq: 196.00, duration: 1.0 }, // G3
        { freq: 261.63, duration: 2.0 }, // C4
        { freq: 220.00, duration: 1.0 }, // A3
        { freq: 246.94, duration: 1.0 }, // B3
        { freq: 261.63, duration: 2.0 }  // C4
    ], 'sawtooth', 0.2);
    
    // Напряженная музыка - диссонансы
    audioSystem.musicPlayers.tension = createMelodyPlayer([
        { freq: 233.08, duration: 0.8 }, // A#3
        { freq: 207.65, duration: 0.8 }, // G#3
        { freq: 185.00, duration: 0.8 }, // F#3
        { freq: 174.61, duration: 1.2 }, // F3
        { freq: 155.56, duration: 0.8 }, // D#3
        { freq: 146.83, duration: 0.8 }, // D3
        { freq: 138.59, duration: 1.6 }  // C#3
    ], 'square', 0.1);
}

function createMelodyPlayer(notes, waveType = 'sine', baseVolume = 0.2) {
    let isPlaying = false;
    let timeouts = [];
    
    return {
        play: function() {
            if (isPlaying || audioSystem.isMuted || !audioSystem.audioContext) return;
            
            isPlaying = true;
            this.playSequence(notes, waveType, baseVolume);
        },
        
        stop: function() {
            isPlaying = false;
            timeouts.forEach(timeout => clearTimeout(timeout));
            timeouts = [];
        },
        
        playSequence: function(noteSequence, wave, volume) {
            let currentTime = 0;
            
            noteSequence.forEach((note, index) => {
                const timeout = setTimeout(() => {
                    if (isPlaying && !audioSystem.isMuted) {
                        this.playNote(note.freq, note.duration, wave, volume);
                    }
                    
                    // Зацикливаем мелодию
                    if (index === noteSequence.length - 1 && isPlaying) {
                        setTimeout(() => {
                            if (isPlaying) {
                                this.playSequence(noteSequence, wave, volume);
                            }
                        }, note.duration * 1000);
                    }
                }, currentTime * 1000);
                
                timeouts.push(timeout);
                currentTime += note.duration;
            });
        },
        
        playNote: function(frequency, duration, waveType, volume) {
            if (!audioSystem.audioContext) return;
            
            const oscillator = audioSystem.audioContext.createOscillator();
            const gainNode = audioSystem.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioSystem.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = waveType;
            
            const adjustedVolume = volume * audioSystem.musicVolume;
            gainNode.gain.setValueAtTime(adjustedVolume, audioSystem.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioSystem.audioContext.currentTime + duration);
            
            oscillator.start(audioSystem.audioContext.currentTime);
            oscillator.stop(audioSystem.audioContext.currentTime + duration);
        }
    };
}

// Звуковые эффекты
function playSound(soundName) {
    if (audioSystem.isMuted || !audioSystem.audioContext) return;
    
    const soundMap = {
        'choice': { freq: 600, duration: 0.2 },
        'success': { freq: 1200, duration: 0.3 },
        'tension': { freq: 400, duration: 0.5 },
        'beep': { freq: 800, duration: 0.1 }
    };
    
    const sound = soundMap[soundName];
    if (sound) {
        playBeep(sound.freq, sound.duration);
    }
}

function playBeep(frequency, duration) {
    if (!audioSystem.audioContext) return;
    
    const oscillator = audioSystem.audioContext.createOscillator();
    const gainNode = audioSystem.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioSystem.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioSystem.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioSystem.audioContext.currentTime + duration);
    
    oscillator.start(audioSystem.audioContext.currentTime);
    oscillator.stop(audioSystem.audioContext.currentTime + duration);
}

// Управление музыкой
function startBackgroundMusic() {
    stopCurrentMusic();
    
    if (audioSystem.musicPlayers.calm && !audioSystem.isMuted) {
        audioSystem.currentMusic = audioSystem.musicPlayers.calm;
        audioSystem.currentMusic.play();
        updateMusicStatus('🎵 Спокойная');
    }
}

function playEpicMusic() {
    stopCurrentMusic();
    
    if (audioSystem.musicPlayers.epic && !audioSystem.isMuted) {
        audioSystem.currentMusic = audioSystem.musicPlayers.epic;
        audioSystem.currentMusic.play();
        updateMusicStatus('🎺 Эпическая');
    }
}

function playTensionMusic() {
    stopCurrentMusic();
    
    if (audioSystem.musicPlayers.tension && !audioSystem.isMuted) {
        audioSystem.currentMusic = audioSystem.musicPlayers.tension;
        audioSystem.currentMusic.play();
        updateMusicStatus('⚡ Напряжение');
    }
}

function stopCurrentMusic() {
    if (audioSystem.currentMusic) {
        audioSystem.currentMusic.stop();
        audioSystem.currentMusic = null;
    }
}

function toggleMute() {
    audioSystem.isMuted = !audioSystem.isMuted;
    const icon = document.getElementById('volume-icon');
    icon.textContent = audioSystem.isMuted ? '🔇' : '🔊';
    
    if (audioSystem.isMuted) {
        stopCurrentMusic();
        updateMusicStatus('🔇 Отключено');
    } else {
        // Возобновляем музыку в зависимости от текущей сцены
        const scene = gameState.currentScene;
        if (scene.includes('secret') || scene.includes('implant') || scene.includes('investigation')) {
            playTensionMusic();
        } else if (scene.includes('race') || scene.includes('final') || scene.includes('trainer_meeting')) {
            playEpicMusic();
        } else {
            startBackgroundMusic();
        }
    }
}

function adjustVolume(value) {
    audioSystem.musicVolume = value / 100;
    
    // Если музыка играет, обновляем громкость
    if (audioSystem.currentMusic && !audioSystem.isMuted) {
        // Перезапускаем текущую музыку с новой громкостью
        const currentType = getCurrentMusicType();
        stopCurrentMusic();
        
        setTimeout(() => {
            switch(currentType) {
                case 'epic':
                    playEpicMusic();
                    break;
                case 'tension':
                    playTensionMusic();
                    break;
                default:
                    startBackgroundMusic();
            }
        }, 100);
    }
}

function getCurrentMusicType() {
    if (audioSystem.currentMusic === audioSystem.musicPlayers.epic) return 'epic';
    if (audioSystem.currentMusic === audioSystem.musicPlayers.tension) return 'tension';
    return 'calm';
}

function updateMusicStatus(status) {
    const statusEl = document.getElementById('music-status');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

// Анимации
function addAnimation(element, animationClass, duration = 1000) {
    element.classList.add(animationClass);
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

function animateStatChange(statId, oldValue, newValue) {
    const element = document.getElementById(statId);
    if (oldValue !== newValue) {
        addAnimation(element, 'stat-change');
        playSound('beep');
    }
}
// Сцены игры
const scenes = {
    start: {
        title: "Утро в Линдене",
        narrative: `Звук будильника разрывает тишину. За окном тихий дождь, на стадионе уже бегают силуэты ранних спортсменов.

Ты встаёшь с кровати. На тумбочке лежат таблетки для мамы, счета из клиники и письмо с логотипом ГЛЧС — Глобальной Лиги Честного Спорта.

"Говорят, бег — это свобода. Но когда каждая тренировка — это шаг к спасению мамы, свобода становится грузом."`,
        choices: [
            {
                text: "Сразу пойти на пробежку — проверить готовность",
                action: () => {
                    gameState.stamina += 10;
                    gameState.health += 5;
                    showScene('morning_run');
                }
            },
            {
                text: "Посмотреть сообщения — может, звонили из клиники",
                action: () => {
                    gameState.morality += 5;
                    showScene('check_messages');
                }
            },
            {
                text: "Прочитать письмо от ГЛЧС — узнать условия",
                action: () => {
                    showScene('read_letter');
                }
            }
        ]
    },

    morning_run: {
        title: "Утренняя пробежка",
        narrative: `Ты выходишь на улицу. Прохладный воздух наполняет лёгкие. Стадион пустой — только ты и твои мысли.

Начинаешь бежать. Первые метры даются легко, но вскоре чувствуешь знакомую боль в колене — напоминание о прошлогодней травме.`,
        minigame: 'running',
        choices: [
            {
                text: "Продолжить через боль",
                action: () => {
                    gameState.health -= 10;
                    gameState.stamina += 15;
                    showScene('trainer_meeting');
                }
            },
            {
                text: "Остановиться и размяться",
                action: () => {
                    gameState.health += 5;
                    gameState.stamina += 5;
                    showScene('trainer_meeting');
                }
            }
        ]
    },

    check_messages: {
        title: "Проверка сообщений",
        narrative: `На телефоне три пропущенных звонка от мамы и одно сообщение от врача: "Результаты анализов готовы. Нужно обсудить дальнейшее лечение."

Твоё сердце сжимается. Каждое такое сообщение может означать как хорошие, так и плохие новости.`,
        choices: [
            {
                text: "Сразу перезвонить маме",
                action: () => {
                    gameState.morality += 10;
                    showScene('call_mom');
                }
            },
            {
                text: "Сначала прочитать письмо ГЛЧС",
                action: () => {
                    showScene('read_letter');
                }
            }
        ]
    },

    call_mom: {
        title: "Звонок маме",
        narrative: `"Алекс, дорогой, не волнуйся. Врач сказал, что есть новые методы лечения. Дорогие, но... есть надежда."

Её голос дрожит, но она пытается казаться сильной. Ты знаешь, что она никогда не попросит тебя жертвовать карьерой ради неё.`,
        dialogue: `МАМА: "Главное — не делай ничего, о чём потом будешь сожалеть. Я горжусь тобой, каким бы ни был результат."`,
        choices: [
            {
                text: "Обещать, что всё будет хорошо",
                action: () => {
                    gameState.morality += 5;
                    showScene('trainer_meeting');
                }
            },
            {
                text: "Сказать, что сделаешь всё возможное",
                action: () => {
                    showScene('trainer_meeting');
                }
            }
        ]
    },

    read_letter: {
        title: "Письмо от ГЛЧС",
        narrative: `"Уважаемый Алекс Рейн! Ваши результаты на региональных соревнованиях привлекли внимание селекционеров ГЛЧС. Приглашаем вас принять участие в отборочном этапе.

Призовой фонд: 2 миллиона кредитов за первое место. Все участники проходят биометрический контроль и анализ мотивации с помощью ИИ.

Отборочный забег состоится через 3 недели."`,
        choices: [
            {
                text: "Это шанс! Нужно готовиться",
                action: () => {
                    gameState.morality += 5;
                    showScene('trainer_meeting');
                }
            },
            {
                text: "2 миллиона... Этого хватит на лечение",
                action: () => {
                    showScene('trainer_meeting');
                }
            }
        ]
    },

    trainer_meeting: {
        title: "Выбор тренера",
        narrative: `Парк у стадиона. Ты встречаешься с двумя тренерами, которые готовы помочь в подготовке к ГЛЧС.

Первая — Вера Соколова, олимпийская чемпионка 2024 года. Строгая, принципиальная, известная своей честностью.

Второй — Маркус "Кроу" Блэквуд. Циничный, но результативный тренер, чьи подопечные всегда попадают в элиту.`,
        dialogue: `ВЕРА: "Алекс, я видела твой забег в прошлом месяце. Ты бежал с болью в глазах, а не в ногах. Если хочешь чести — я с тобой. Но честь не платит за больницу."

КРОУ: "Вера говорит про честь. А я скажу про шанс. У тебя один. Или ты врываешься в элиту — или остаёшься в этом городишке, пока мама не... Прости за резкость. Но правда не всегда красивая."`,
        choices: [
            {
                text: "Я с вами, Вера. Честь важнее денег.",
                action: () => {
                    gameState.choices.trainer = 'vera';
                    gameState.morality += 20;
                    showScene('training_vera');
                }
            },
            {
                text: "Кроу, что вы можете предложить?",
                action: () => {
                    gameState.choices.trainer = 'crow';
                    gameState.morality -= 10;
                    showScene('training_crow');
                }
            },
            {
                text: "Мне нужно подумать...",
                action: () => {
                    showScene('secret_message');
                }
            }
        ]
    },

    training_vera: {
        title: "Тренировки с Верой",
        narrative: `Две недели интенсивных тренировок. Вера учит тебя не только технике бега, но и ментальной устойчивости.

"Настоящая победа — это когда ты можешь посмотреть в зеркало и не стыдиться того, что видишь," — говорит она после особенно тяжёлой тренировки.`,
        minigame: 'training',
        choices: [
            {
                text: "Продолжить подготовку",
                action: () => {
                    gameState.stamina += 20;
                    gameState.morality += 10;
                    showScene('secret_message');
                }
            }
        ]
    },

    training_crow: {
        title: "Тренировки с Кроу",
        narrative: `Кроу обучает тебя не только физической подготовке, но и психологическим трюкам. Как читать соперников, как использовать их слабости.

"Правила пишут победители. Ты хочешь писать — или подчиняться?" — его любимая фраза.`,
        minigame: 'training',
        choices: [
            {
                text: "Изучить все тактики",
                action: () => {
                    gameState.stamina += 15;
                    gameState.morality -= 5;
                    showScene('secret_message');
                }
            }
        ]
    },

    secret_message: {
        title: "Тайное предложение",
        narrative: `Ночь. Ты лежишь в темноте, когда на телефоне появляется уведомление от неизвестного приложения.

Сообщение от "Курьера": анонимного агента с нейтральным ИИ-аватаром.`,
        dialogue: `КУРЬЕР: "Привет, Алекс. Мы знаем, что ты нуждаешься в скорости. У нас есть NeuraBoost v.3 — нейроимплант, совместимый с ГЛЧС-сканерами. Успешность: 94%. Цена: 200,000 кредитов. Но мы можем отложить оплату до твоей первой победы."`,
        choices: [
            {
                text: "Нет. Я не пойду на это.",
                action: () => {
                    gameState.morality += 15;
                    showScene('final_preparation');
                }
            },
            {
                text: "Да. Где клиника?",
                action: () => {
                    gameState.choices.implant = true;
                    gameState.morality -= 20;
                    gameState.stamina += 25;
                    showScene('implant_installation');
                }
            },
            {
                text: "Кто вы такие? Что за организация?",
                action: () => {
                    gameState.flags.investigateFound = true;
                    showScene('investigation');
                }
            }
        ]
    },

    implant_installation: {
        title: "Установка импланта",
        narrative: `Подпольная клиника. Стерильно белые стены, но атмосфера напряжённая. Процедура занимает всего час.

Когда ты просыпаешься, мир кажется... другим. Более чётким. Ты чувствуешь каждое биение сердца, каждый мускул.`,
        choices: [
            {
                text: "Протестировать новые способности",
                action: () => {
                    gameState.stamina += 10;
                    showScene('final_preparation');
                }
            }
        ]
    },

    investigation: {
        title: "Расследование",
        narrative: `Ты начинаешь копать глубже. Находишь связи между "Теневым Фондом Спорта" и несколькими скандалами в профессиональном спорте.

У тебя есть доказательства, но использование их может разрушить всю систему ГЛЧС.`,
        choices: [
            {
                text: "Сохранить доказательства на потом",
                action: () => {
                    gameState.flags.investigateFound = true;
                    showScene('final_preparation');
                }
            },
            {
                text: "Немедленно передать журналистам",
                action: () => {
                    showEnding('reform');
                }
            }
        ]
    },

    final_preparation: {
        title: "Последняя подготовка",
        narrative: `День перед отборочным забегом. Ты на стадионе, делаешь последние пробежки. 

Видишь Дарью Волкову — твою бывшую напарницу по юниорской сборной. Она тренируется, но что-то не так. Она слегка хромает.`,
        dialogue: `ДАРЬЯ (подходит): "Алекс! Не ожидала тебя здесь увидеть. Завтра большой день, да?"`,
        choices: [
            {
                text: "Спросить про травму",
                action: () => {
                    gameState.morality += 5;
                    showScene('darya_truth');
                }
            },
            {
                text: "Пожелать удачи и уйти",
                action: () => {
                    showScene('race_day');
                }
            }
        ]
    },

    darya_truth: {
        title: "Правда о Дарье",
        narrative: `Дарья вздыхает и садится на скамейку.`,
        dialogue: `ДАРЬЯ: "Травма колена. Врачи говорят, нужна операция, но если я её сделаю сейчас — пропущу не только ГЛЧС, но и весь сезон. А мой отец... он бывший спортсмен, сейчас инвалид. Нам нужны эти деньги."

"Если завтра выиграешь ты — спаси свою маму. Я... я не смогу."`,
        choices: [
            {
                text: "Предложить помощь с лечением",
                action: () => {
                    gameState.morality += 10;
                    gameState.flags.darayaHelped = true;
                    showScene('race_day');
                }
            },
            {
                text: "Сказать, что всё будет хорошо",
                action: () => {
                    gameState.morality += 5;
                    showScene('race_day');
                }
            }
        ]
    },

    race_day: {
        title: "День забега",
        narrative: `Стадион ГЛЧС. Тысячи зрителей, камеры, биометрические сканеры на каждом шагу.

Ты на стартовой линии. Рядом Дарья — её лицо напряжено от боли, но она пытается это скрыть.

1500 метров до финиша. 1500 метров до решения судьбы.`,
        minigame: 'final_race',
        choices: [] // Выборы будут в мини-игре
    },

    // Эпизод 2 - "Под кожей"
    episode2_start: {
        title: "Приглашение в лагерь ГЛЧС",
        narrative: `Три недели прошло с отборочного забега. Результат был... сложным. Но ГЛЧС всё равно замечает тебя. Твоё имя — в базе.

"Они зовут это 'лагерем совершенства'. Но я чувствую — это лаборатория. Где каждый вздох превращается в данные, а каждая мысль — в отчёт."

Ты получаешь официальное приглашение в закрытый тренировочный лагерь ГЛЧС в Альпах. Там — лучшие условия, ИИ-тренеры, нейросканирование мотивации и... постоянный контроль.`,
        choices: [
            {
                text: "Принять приглашение — новый уровень тренировок",
                action: () => {
                    gameState.goal += 10;
                    showScene('camp_arrival');
                }
            },
            {
                text: "Позвонить маме — узнать о её состоянии",
                action: () => {
                    gameState.honor += 5;
                    showScene('call_mom_ep2');
                }
            },
            {
                text: "Проверить сообщения от Курьера",
                action: () => {
                    if (gameState.flags.investigateFound) {
                        showScene('encrypted_server');
                    } else {
                        showScene('no_messages');
                    }
                }
            }
        ]
    },

    call_mom_ep2: {
        title: "Звонок маме",
        narrative: `Мама отвечает после первого гудка. Её голос звучит... по-разному, в зависимости от твоих прошлых решений.`,
        dialogue: gameState.choices.episode1Ending === 'honor' ? 
            `МАМА: "Алекс, дорогой! Я видела новости о твоём поступке. Весь город говорит о тебе. Я так горжусь... Врачи говорят, что благодаря пожертвованиям от фанатов, лечение идёт лучше, чем ожидалось."` :
            `МАМА: "Алекс... Я видела твой забег. Даже если ты не выиграл — я горжусь. Больше, чем если бы ты стал чемпионом. Не беги ради меня. Беги ради того, кем ты хочешь быть."`,
        choices: [
            {
                text: "Я сделаю всё, чтобы ты выздоровела",
                action: () => {
                    gameState.goal += 15;
                    gameState.honor -= 5;
                    showScene('camp_arrival');
                }
            },
            {
                text: "Я не стану тем, кого ты не узнаешь",
                action: () => {
                    gameState.honor += 15;
                    gameState.flags.motherSupport = true;
                    showScene('camp_arrival');
                }
            },
            {
                text: "[Молчание]",
                action: () => {
                    gameState.flags.internalConflict = true;
                    showScene('camp_arrival');
                }
            }
        ]
    },

    encrypted_server: {
        title: "Зашифрованный сервер",
        narrative: `Курьер прислал ссылку на скрытый сервер. Там — архивы, документы, перехваченные сообщения. Ты начинаешь понимать масштаб заговора.

Теневой Фонд не просто помогает спортсменам обманывать систему. Они работают С системой.`,
        dialogue: `СОВА (анонимный хакер): "Ты думаешь, ГЛЧС — это чистота? Посмотри, откуда берутся их миллиарды. Они создают героев... чтобы потом их разоблачать. Рейтинги растут от скандалов."`,
        choices: [
            {
                text: "Скачать все доказательства",
                action: () => {
                    gameState.flags.evidenceCount += 2;
                    gameState.honor += 10;
                    showScene('camp_arrival');
                }
            },
            {
                text: "Это слишком опасно",
                action: () => {
                    showScene('camp_arrival');
                }
            }
        ]
    },

    camp_arrival: {
        title: "Лагерь совершенства",
        narrative: `Альпы. Футуристический комплекс, врезанный в скалу. Стекло, металл, и везде — камеры с ИИ-анализом.

Тебя встречает доктор Элис Торн — нейроэтический надзорник ГЛЧС. Спокойная, проницательная женщина с планшетом, на котором уже есть твоё досье.`,
        dialogue: `ДОКТОР ТОРН: "Алекс Рейн. Интересный случай. Ты не первый, кто стоит на грани. Но ты первый, кто делает это так... искренне. Завтра у нас нейросканирование. Стандартная процедура."`,
        choices: [
            {
                text: "Спросить о процедуре подробнее",
                action: () => {
                    gameState.honor += 5;
                    showScene('neuroscan_explanation');
                }
            },
            {
                text: "Согласиться без вопросов",
                action: () => {
                    gameState.goal += 5;
                    showScene('meet_other_athletes');
                }
            },
            {
                text: "Есть ли способ отказаться?",
                action: () => {
                    showScene('refusal_consequences');
                }
            }
        ]
    },

    neuroscan_explanation: {
        title: "О нейросканировании",
        narrative: `Доктор Торн объясняет процедуру с научной точностью.`,
        dialogue: `ДОКТОР ТОРН: "Мы анализируем паттерны мозговой активности, чтобы понять истинную мотивацию спортсмена. Это помогает выявить тех, кто может поддаться искушению нечестной игры."

"Конечно, если у человека есть... модификации... сканер может дать сбой. Но это крайне редко."`,
        choices: [
            {
                text: "Понятно, я готов",
                action: () => {
                    if (gameState.choices.implant) {
                        gameState.flags.implantRisk = true;
                    }
                    showScene('meet_other_athletes');
                }
            },
            {
                text: "А что, если сканер найдёт что-то неожиданное?",
                action: () => {
                    gameState.honor += 5;
                    showScene('thorn_suspicion');
                }
            }
        ]
    },

    meet_other_athletes: {
        title: "Другие спортсмены",
        narrative: `В общей зоне лагеря ты встречаешь других приглашённых. Среди них — знакомое лицо.

Тренер Дарьи подходит к тебе. Его лицо мрачное.`,
        dialogue: `ТРЕНЕР ДАРЬИ: "Алекс... Дарью отстранили. 'Подозрения в сокрытии травмы', говорят они. Она сказала, что ты дал ей шанс в том забеге. Почему теперь молчишь?"`,
        choices: [
            {
                text: "Я расскажу правду о том забеге",
                action: () => {
                    gameState.honor += 20;
                    gameState.flags.defendDarya = true;
                    showScene('defend_darya');
                }
            },
            {
                text: "Это её проблемы, не мои",
                action: () => {
                    gameState.goal += 10;
                    gameState.honor -= 10;
                    showScene('cold_response');
                }
            },
            {
                text: "Я не могу ничего доказать",
                action: () => {
                    showScene('neutral_response');
                }
            }
        ]
    },

    neuroscan_minigame: {
        title: "Нейросканирование",
        narrative: `Ты в белой комнате. На голове — сканер, похожий на корону из проводов. ИИ начинает задавать вопросы, анализируя твои реакции.

${gameState.choices.implant ? 'Имплант начинает нагреваться. Нужно сохранять спокойствие.' : 'Ты чувствуешь, как машина читает каждую твою мысль.'}`,
        minigame: 'neuroscan',
        choices: [] // Выборы будут в мини-игре
    },

    night_training: {
        title: "Ночная тренировка",
        narrative: `3:00 ночи. Кроу присылает тебе зашифрованное сообщение: "Бег по леднику. Там нет камер. Я покажу, как обмануть ИИ-биометрию."

За окном — звёздное небо и ледяные пики. Это может быть твоим шансом получить преимущество... или ловушкой.`,
        choices: [
            {
                text: "Встретиться с Кроу",
                action: () => {
                    gameState.goal += 15;
                    gameState.honor -= 15;
                    gameState.stamina += 20;
                    showScene('secret_training');
                }
            },
            {
                text: "Остаться в номере",
                action: () => {
                    gameState.honor += 10;
                    showScene('vera_meditation');
                }
            },
            {
                text: "Проследить за Кроу тайно",
                action: () => {
                    gameState.flags.evidenceCount += 1;
                    showScene('spy_on_crow');
                }
            }
        ]
    },

    final_choice_ep2: {
        title: "Ночь перед финалом ГЛЧС",
        narrative: `Ты в номере лагеря. За окном — звёзды. На столе лежат три предмета, каждый из которых символизирует путь:

План Кроу: "Активируй имплант на финише — и никто не докажет"
Письмо от Веры: "Если ты честен с собой — ты уже победил"
Сообщение от "Совы": "Завтра ГЛЧС объявят Дарью дисквалифицированной. Если ты промолчишь — она лишится всего"`,
        choices: [
            {
                text: "Подготовиться к честному финалу",
                action: () => {
                    gameState.choices.finalChoice = 'honest';
                    showEnding('ep2_honest');
                }
            },
            {
                text: "Связаться с Кроу — активировать имплант",
                action: () => {
                    if (gameState.choices.implant) {
                        gameState.choices.finalChoice = 'implant';
                        showEnding('ep2_corrupted');
                    } else {
                        showNotification('У вас нет импланта!', 'warning');
                    }
                }
            },
            {
                text: "Написать Дарье: 'Я расскажу правду'",
                action: () => {
                    gameState.choices.finalChoice = 'truth';
                    showEnding('ep2_truth');
                }
            },
            {
                text: "Отправить досье журналисту (если есть улики)",
                action: () => {
                    if (gameState.flags.evidenceCount >= 3 && gameState.honor >= 70) {
                        gameState.choices.finalChoice = 'investigation';
                        showEnding('ep2_investigation');
                    } else {
                        showNotification('Недостаточно улик или чести для этого выбора', 'warning');
                    }
                }
            }
        ]
    },

    // Дополнительные сцены для второго эпизода
    no_messages: {
        title: "Нет сообщений",
        narrative: `Никаких новых сообщений от Курьера. Возможно, связь прервана, или они ждут подходящего момента.

Остается только принять приглашение в лагерь и посмотреть, что там происходит.`,
        choices: [
            {
                text: "Принять приглашение в лагерь",
                action: () => {
                    showScene('camp_arrival');
                }
            }
        ]
    },

    thorn_suspicion: {
        title: "Подозрения доктора Торн",
        narrative: `Доктор Торн внимательно смотрит на тебя.`,
        dialogue: `ДОКТОР ТОРН: "Интересный вопрос. Большинство спортсменов просто кивают и идут на процедуру. А ты... ты думаешь о последствиях. Это либо признак мудрости, либо признак того, что есть что скрывать."`,
        choices: [
            {
                text: "Я просто хочу понимать процесс",
                action: () => {
                    gameState.honor += 5;
                    showScene('meet_other_athletes');
                }
            },
            {
                text: "У каждого есть секреты",
                action: () => {
                    gameState.goal += 5;
                    showScene('meet_other_athletes');
                }
            }
        ]
    },

    defend_darya: {
        title: "Защита Дарьи",
        narrative: `Ты решаешь рассказать правду о том забеге. Тренер Дарьи слушает внимательно.`,
        dialogue: `ТРЕНЕР ДАРЬИ: "Значит, ты действительно помог ей тогда... Спасибо за честность. Но теперь ГЛЧС может обвинить и тебя в сговоре."`,
        choices: [
            {
                text: "Я готов к последствиям",
                action: () => {
                    gameState.honor += 15;
                    gameState.flags.defendDarya = true;
                    showScene('neuroscan_minigame');
                }
            },
            {
                text: "Может, лучше промолчать?",
                action: () => {
                    gameState.goal += 5;
                    showScene('neuroscan_minigame');
                }
            }
        ]
    },

    cold_response: {
        title: "Холодный ответ",
        narrative: `Тренер Дарьи качает головой с разочарованием.`,
        dialogue: `ТРЕНЕР ДАРЬИ: "Понятно. Каждый сам за себя. Надеюсь, ты сможешь жить с этим выбором."`,
        choices: [
            {
                text: "Продолжить подготовку",
                action: () => {
                    gameState.goal += 10;
                    showScene('neuroscan_minigame');
                }
            }
        ]
    },

    neutral_response: {
        title: "Нейтральный ответ",
        narrative: `Ты пытаешься найти золотую середину.`,
        dialogue: `ТРЕНЕР ДАРЬИ: "Понимаю твою позицию. Но иногда молчание — тоже выбор."`,
        choices: [
            {
                text: "Я подумаю над этим",
                action: () => {
                    showScene('neuroscan_minigame');
                }
            }
        ]
    },

    post_neuroscan: {
        title: "После сканирования",
        narrative: `Нейросканирование завершено. ${gameState.flags.implantDetected ? 'Доктор Торн смотрит на результаты с озабоченностью.' : 'Доктор Торн кивает, просматривая результаты.'}`,
        dialogue: gameState.flags.implantDetected ? 
            `ДОКТОР ТОРН: "Интересные показатели. Некоторые паттерны... необычны. Мы проведем дополнительные тесты позже."` :
            `ДОКТОР ТОРН: "Отличные результаты. Ваша мотивация кристально чиста. Или вы очень хорошо умеете контролировать свои мысли."`,
        choices: [
            {
                text: "Спросить о результатах подробнее",
                action: () => {
                    showScene('night_training');
                }
            },
            {
                text: "Поблагодарить и уйти",
                action: () => {
                    showScene('night_training');
                }
            }
        ]
    },

    secret_training: {
        title: "Тайная тренировка с Кроу",
        narrative: `Ледник под звездами. Кроу ждет тебя с специальным оборудованием.`,
        dialogue: `КРОУ: "Здесь я покажу тебе, как обмануть любую биометрию. Но запомни — это знание делает тебя соучастником."`,
        choices: [
            {
                text: "Изучить все техники",
                action: () => {
                    gameState.goal += 20;
                    gameState.honor -= 20;
                    gameState.stamina += 25;
                    showScene('final_choice_ep2');
                }
            },
            {
                text: "Передумать и уйти",
                action: () => {
                    gameState.honor += 10;
                    showScene('final_choice_ep2');
                }
            }
        ]
    },

    vera_meditation: {
        title: "Медитация с Верой",
        narrative: `Ты остаешься в номере и получаешь сообщение от Веры с аудиозаписью медитации.`,
        dialogue: `ВЕРА (запись): "Истинная сила приходит изнутри. Не от технологий, не от обмана, а от понимания себя."`,
        choices: [
            {
                text: "Медитировать всю ночь",
                action: () => {
                    gameState.honor += 15;
                    gameState.health += 10;
                    showScene('final_choice_ep2');
                }
            }
        ]
    },

    spy_on_crow: {
        title: "Слежка за Кроу",
        narrative: `Ты тайно следишь за Кроу и видишь, как он встречается с неизвестным человеком в темных очках. Они обмениваются конвертом.`,
        dialogue: `НЕЗНАКОМЕЦ: "План работает. Скоро у нас будет достаточно компромата на половину лиги."`,
        choices: [
            {
                text: "Записать разговор на телефон",
                action: () => {
                    gameState.flags.evidenceCount += 2;
                    gameState.flags.crowCorruption = true;
                    showScene('final_choice_ep2');
                }
            },
            {
                text: "Тихо уйти",
                action: () => {
                    gameState.flags.evidenceCount += 1;
                    showScene('final_choice_ep2');
                }
            }
        ]
    },

    evidence_complete: {
        title: "Досье готово",
        narrative: `У тебя достаточно улик, чтобы разоблачить всю схему. Связи между ГЛЧС, Теневым Фондом и коррумпированными тренерами становятся очевидными.

Вопрос только в том, что с этим делать.`,
        choices: [
            {
                text: "Сохранить улики до подходящего момента",
                action: () => {
                    showScene('final_choice_ep2');
                }
            }
        ]
    },

    refusal_consequences: {
        title: "Последствия отказа",
        narrative: `Доктор Торн качает головой.`,
        dialogue: `ДОКТОР ТОРН: "Отказ от нейросканирования автоматически дисквалифицирует вас из программы ГЛЧС. Это обязательная процедура для всех участников."`,
        choices: [
            {
                text: "Хорошо, я пройду сканирование",
                action: () => {
                    showScene('meet_other_athletes');
                }
            },
            {
                text: "Тогда я покидаю программу",
                action: () => {
                    showEnding('ep2_honest');
                }
            }
        ]
    }
};

// Концовки
const endings = {
    honor: {
        title: "Честь важнее золота",
        text: `Ты замедляешься на последних метрах, позволяя Дарье выиграть. Твой поступок снимают камеры, и через час видео облетает весь мир.

Ты проиграл гонку, но выиграл сердца миллионов. Создаётся международный фонд помощи спортсменам из малообеспеченных семей. Твоя мама получает лечение благодаря пожертвованиям.

Через год тебя приглашают выступить на форуме по этике в спорте. Ты не стал чемпионом ГЛЧС, но стал символом честности в спорте.`
    },
    
    victory_corrupted: {
        title: "Идеальный результат",
        text: `Ты побеждаешь с помощью импланта. Миллионы кредитов, слава, лечение для мамы — всё, о чём мечтал.

Но со временем имплант начинает влиять на твоё восприятие. Мир становится набором данных, а не эмоций. В финале ГЛЧС тебя разоблачают.

Ты теряешь всё: славу, деньги, доверие. Мама выздоравливает, но отношения с ней уже не те. Ты стал чемпионом, но перестал быть человеком.`
    },
    
    system_agent: {
        title: "Система вне игры",
        text: `Ты побеждаешь честно, несмотря на установленный имплант. ГЛЧС узнаёт о твоём контакте с Теневым Фондом, но не дисквалифицирует.

Вместо этого тебе предлагают стать агентом ГЛЧС — разоблачать других "грязных" спортсменов. Ты соглашаешься.

Теперь ты внутри системы, но по ту сторону морали. Ты знаешь все секреты, но можешь ли ты доверять самому себе?`
    },
    
    reform: {
        title: "Революция в спорте",
        text: `Твоё расследование Теневого Фонда взрывает спортивный мир. ГЛЧС вынуждена провести полную реформу системы.

Ты становишься символом нового поколения спортсменов. Мама получает лечение благодаря новому фонду прозрачности в спорте.

Ты не выиграл забег, но изменил весь мир спорта. Иногда самая важная победа — это та, которую не видно на табло.`
    },

    // Концовки эпизода 2
    ep2_honest: {
        title: "Под кожей правды",
        text: `Ты выбираешь честный путь, несмотря на все искушения лагеря. Нейросканирование показывает твою искренность, и доктор Торн становится твоим союзником.

Вместе вы раскрываете схему ГЛЧС по созданию искусственных скандалов. Дарья восстановлена в правах, а ты получаешь предложение возглавить новую этическую комиссию.

Мама гордится тобой больше, чем любой медалью. "Ты остался собой," — говорит она. И это важнее любой победы.`
    },

    ep2_corrupted: {
        title: "Цена совершенства",
        text: `Ты активируешь имплант в решающий момент. Победа кажется сладкой, но нейросканирование выявляет аномалии. 

Кроу исчезает, оставив тебя один на один с последствиями. ГЛЧС предлагает сделку — стать их тайным агентом или быть разоблаченным.

Ты соглашаешься. Теперь ты охотишься на таких же, как сам. Мама выздоравливает, но цена этого — твоя душа.`
    },

    ep2_truth: {
        title: "Свидетель правды",
        text: `Ты решаешь рассказать правду о Дарье и своих подозрениях. Это запускает цепную реакцию расследований.

Вместе с доктором Торн и "Совой" вы раскрываете всю схему Теневого Фонда. ГЛЧС реформируется, а ты и Дарья становитесь символами новой эры честного спорта.

Мама получает лечение от нового фонда прозрачности. "Ты выбрал правду," — говорит она. "Это самая трудная победа."`
    },

    ep2_investigation: {
        title: "Детектив в спорте",
        text: `Твоё расследование приводит к разоблачению не только Теневого Фонда, но и коррупции внутри самой ГЛЧС.

Ты становишься ключевым свидетелем в международном скандале. Спорт меняется навсегда, а ты — катализатор этих изменений.

Мама смеется: "Я думала, ты станешь бегуном, а ты стал детективом!" Но она гордится тобой. Правда оказалась важнее медалей.`
    }
};
// Функции управления эпизодами
function showEpisodeSelect() {
    playSound('choice');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('episode-select').classList.remove('hidden');
    
    const episodeScreen = document.getElementById('episode-select');
    addAnimation(episodeScreen, 'fade-in');
    
    updateProgressDisplay();
}

function backToMainMenu() {
    playSound('choice');
    document.getElementById('episode-select').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    const mainMenu = document.getElementById('main-menu');
    addAnimation(mainMenu, 'fade-in');
}

function startEpisode(episodeNumber) {
    if (!playerProgress.unlockedEpisodes.includes(episodeNumber)) {
        showNotification('Этот эпизод пока недоступен!', 'warning');
        return;
    }
    
    playSound('choice');
    gameState.currentEpisode = episodeNumber;
    playerProgress.startTime = Date.now();
    
    // Сброс состояния для нового эпизода
    resetGameState();
    
    document.getElementById('episode-select').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const gameScreen = document.getElementById('game-screen');
    addAnimation(gameScreen, 'fade-in');
    
    // Запускаем соответствующий эпизод
    if (episodeNumber === 1) {
        showScene('start');
    } else if (episodeNumber === 2) {
        showScene('episode2_start');
    }
}

function resetGameState() {
    const currentEpisode = gameState.currentEpisode;
    const episode1Ending = gameState.choices.episode1Ending;
    const implant = gameState.choices.implant;
    const trainer = gameState.choices.trainer;
    
    gameState = {
        health: 100,
        stamina: 100,
        morality: 0,
        honor: 0,
        goal: 0,
        money: 5000,
        currentScene: currentEpisode === 1 ? 'start' : 'episode2_start',
        currentEpisode: currentEpisode,
        choices: {
            trainer: trainer,
            implant: implant,
            finalChoice: null,
            episode1Ending: episode1Ending
        },
        flags: {
            investigateFound: false,
            darayaHelped: false,
            alexandraAlly: false,
            evidenceCount: 0,
            crowCorruption: false,
            neuroscanPassed: false
        }
    };
}

function completeEpisode(episodeNumber, endingType) {
    // Записываем время прохождения
    if (playerProgress.startTime) {
        const playTime = Date.now() - playerProgress.startTime;
        playerProgress.totalPlaytime += playTime;
        playerProgress.startTime = null;
    }
    
    // Сохраняем результат эпизода
    if (episodeNumber === 1) {
        gameState.choices.episode1Ending = endingType;
    }
    
    // Отмечаем эпизод как пройденный
    if (!playerProgress.completedEpisodes.includes(episodeNumber)) {
        playerProgress.completedEpisodes.push(episodeNumber);
    }
    
    // Сохраняем лучшую концовку
    playerProgress.bestEndings[endingType] = true;
    
    // Разблокируем следующий эпизод
    if (episodeNumber === 1 && !playerProgress.unlockedEpisodes.includes(2)) {
        playerProgress.unlockedEpisodes.push(2);
        showNotification('🎉 Разблокирован эпизод 2: "Под кожей"!', 'success');
    }
    
    saveProgress();
}

function showScene(sceneId) {
    const scene = scenes[sceneId];
    if (!scene) return;

    gameState.currentScene = sceneId;
    
    // Управление музыкой в зависимости от сцены
    if (sceneId.includes('secret') || sceneId.includes('implant') || sceneId.includes('investigation')) {
        playTensionMusic();
    } else if (sceneId.includes('race') || sceneId.includes('final') || sceneId.includes('trainer_meeting')) {
        playEpicMusic();
    } else {
        startBackgroundMusic();
    }
    
    // Очищаем предыдущие элементы
    document.getElementById('choices').innerHTML = '';
    document.getElementById('minigame').classList.add('hidden');
    
    // Обновляем заголовок сцены с анимацией
    const sceneTitle = document.getElementById('scene-title');
    sceneTitle.textContent = scene.title;
    addAnimation(sceneTitle, 'slide-in-right');
    
    // Показываем текст
    const narrativeEl = document.getElementById('narrative');
    const dialogueEl = document.getElementById('dialogue');
    
    narrativeEl.innerHTML = '';
    dialogueEl.innerHTML = '';
    
    // Добавляем анимацию к контейнеру текста
    const sceneText = document.getElementById('scene-text');
    addAnimation(sceneText, 'fade-in');
    
    // Анимация печати текста
    typeText(narrativeEl, scene.narrative, () => {
        if (scene.dialogue) {
            playSound('beep');
            typeText(dialogueEl, scene.dialogue, () => {
                showChoices(scene.choices);
                if (scene.minigame) {
                    showMinigame(scene.minigame);
                }
            });
        } else {
            showChoices(scene.choices);
            if (scene.minigame) {
                showMinigame(scene.minigame);
            }
        }
    });
    
    updateStats();
    
    // Воспроизводим соответствующий звук в зависимости от сцены
    if (sceneId.includes('secret') || sceneId.includes('implant')) {
        playSound('tension');
    } else if (sceneId.includes('training') || sceneId.includes('race')) {
        playSound('success');
    }
}

function typeText(element, text, callback) {
    let i = 0;
    const speed = 30;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    
    type();
}

function showChoices(choices) {
    const choicesEl = document.getElementById('choices');
    choicesEl.innerHTML = '';
    
    if (!choices || choices.length === 0) return;
    
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all transform hover:scale-[1.02] border border-slate-600';
        button.innerHTML = `<span class="text-blue-400">${index + 1}.</span> ${choice.text}`;
        button.onclick = () => {
            // Звук выбора и анимация
            playSound('choice');
            addAnimation(button, 'bounce-in');
            
            // Скрываем все кнопки выбора после нажатия
            setTimeout(() => {
                choicesEl.innerHTML = '';
                choice.action();
            }, 300);
        };
        
        // Анимация появления кнопок
        setTimeout(() => {
            addAnimation(button, 'slide-in-left');
        }, index * 200);
        
        choicesEl.appendChild(button);
    });
}

function showMinigame(type) {
    const minigameEl = document.getElementById('minigame');
    minigameEl.classList.remove('hidden');
    addAnimation(minigameEl, 'bounce-in');
    
    switch(type) {
        case 'running':
            showRunningGame();
            break;
        case 'training':
            showTrainingGame();
            break;
        case 'final_race':
            showFinalRace();
            break;
        case 'neuroscan':
            showNeuroscanGame();
            break;
        case 'investigation':
            showInvestigationGame();
            break;
        case 'semifinal_race':
            showSemifinalRace();
            break;
    }
}

function showNeuroscanGame() {
    const minigameEl = document.getElementById('minigame');
    const hasImplant = gameState.choices.implant;
    const hasConflict = gameState.flags.internalConflict;
    let stressLevel = hasImplant ? 60 : 30;
    let scanProgress = 0;
    let currentQuestion = 0;
    let answers = [];
    let scanActive = false;
    
    const questions = [
        {
            text: "Что мотивирует вас в спорте?",
            options: [
                { text: "Желание побеждать", stress: hasImplant ? 15 : 5, type: "goal" },
                { text: "Помощь семье", stress: hasImplant ? 20 : 10, type: "personal" },
                { text: "Любовь к бегу", stress: hasImplant ? 5 : 0, type: "pure" }
            ]
        },
        {
            text: "Как вы относитесь к допингу?",
            options: [
                { text: "Категорически против", stress: hasImplant ? 25 : -5, type: "honest" },
                { text: "Это сложный вопрос", stress: hasImplant ? 10 : 5, type: "evasive" },
                { text: "Каждый решает сам", stress: hasImplant ? 5 : 10, type: "neutral" }
            ]
        },
        {
            text: "Что бы вы сделали, узнав о нечестной игре соперника?",
            options: [
                { text: "Сообщил бы судьям", stress: hasImplant ? 20 : -5, type: "righteous" },
                { text: "Сосредоточился на своей игре", stress: hasImplant ? 10 : 5, type: "focused" },
                { text: "Использовал бы это в своих интересах", stress: hasImplant ? 5 : 15, type: "pragmatic" }
            ]
        }
    ];
    
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center pulse-glow">🧠 Нейросканирование</h3>
        <p class="mb-4 text-center">ИИ анализирует твои мысли. Отвечай осторожно!</p>
        
        <div class="bg-slate-700 rounded-lg p-4 mb-4">
            <div class="flex justify-between mb-2">
                <span>Уровень стресса:</span>
                <span id="stress-level">${stressLevel}%</span>
            </div>
            <div class="w-full bg-slate-600 rounded-full h-3 mb-2">
                <div id="stress-bar" class="h-3 rounded-full transition-all" style="width: ${stressLevel}%"></div>
            </div>
            <div class="flex justify-between mb-2">
                <span>Прогресс сканирования:</span>
                <span id="scan-progress">0%</span>
            </div>
            <div class="w-full bg-slate-600 rounded-full h-2">
                <div id="progress-bar" class="bg-blue-500 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
        </div>
        
        ${hasImplant ? `
        <div class="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4">
            <div class="text-red-400 font-bold">⚠️ Имплант активен!</div>
            <div class="text-sm">Нейронная активность может выдать тебя</div>
        </div>
        ` : ''}
        
        <div id="question-container" class="bg-slate-800 rounded-lg p-4 mb-4">
            <div id="question-text" class="text-lg mb-4 text-center">
                Подготовка к сканированию...
            </div>
            <div id="question-options" class="space-y-3">
                <!-- Опции будут добавлены динамически -->
            </div>
        </div>
        
        <div class="text-center">
            <button id="start-scan" onclick="startNeuroscan()" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all">
                Начать сканирование
            </button>
            <button id="complete-scan" onclick="completeNeuroscan()" disabled class="hidden bg-green-600 px-6 py-3 rounded-lg font-semibold">
                Завершить сканирование
            </button>
        </div>
    `;
    
    window.startNeuroscan = function() {
        scanActive = true;
        document.getElementById('start-scan').classList.add('hidden');
        showNextQuestion();
        
        playTensionMusic();
        playSound('tension');
    };
    
    window.answerQuestion = function(optionIndex) {
        if (!scanActive || currentQuestion >= questions.length) return;
        
        const question = questions[currentQuestion];
        const selectedOption = question.options[optionIndex];
        
        answers.push(selectedOption);
        stressLevel = Math.max(0, Math.min(100, stressLevel + selectedOption.stress));
        scanProgress = ((currentQuestion + 1) / questions.length) * 100;
        
        updateNeuroscanDisplay();
        
        // Анимация стресса
        if (selectedOption.stress > 10) {
            const stressBar = document.getElementById('stress-bar');
            addAnimation(stressBar, 'shake');
            playSound('tension');
        } else {
            playSound('beep');
        }
        
        currentQuestion++;
        
        setTimeout(() => {
            if (currentQuestion < questions.length) {
                showNextQuestion();
            } else {
                finishNeuroscan();
            }
        }, 1500);
    };
    
    function showNextQuestion() {
        if (currentQuestion >= questions.length) return;
        
        const question = questions[currentQuestion];
        document.getElementById('question-text').textContent = question.text;
        
        const optionsContainer = document.getElementById('question-options');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all';
            button.innerHTML = `
                <div class="font-semibold">${option.text}</div>
                ${hasImplant && option.stress > 15 ? '<div class="text-xs text-red-400 mt-1">⚠️ Рискованный ответ</div>' : ''}
            `;
            button.onclick = () => answerQuestion(index);
            optionsContainer.appendChild(button);
        });
    }
    
    function finishNeuroscan() {
        scanActive = false;
        document.getElementById('question-text').textContent = 'Сканирование завершено. Анализ результатов...';
        document.getElementById('question-options').innerHTML = '';
        
        document.getElementById('complete-scan').classList.remove('hidden');
        document.getElementById('complete-scan').disabled = false;
        
        // Определяем результат на основе стресса и ответов
        let suspicion = stressLevel > 70;
        let honestAnswers = answers.filter(a => a.type === 'honest' || a.type === 'pure').length;
        
        if (hasImplant && suspicion) {
            gameState.flags.implantDetected = true;
            showNotification('ИИ обнаружил аномалии в нейронной активности!', 'warning');
        } else if (honestAnswers >= 2) {
            gameState.honor += 15;
            showNotification('Сканирование показало высокую честность', 'success');
        } else {
            gameState.flags.suspiciousBehavior = true;
            showNotification('ИИ отметил некоторые несоответствия', 'warning');
        }
    }
    
    window.completeNeuroscan = function() {
        gameState.flags.neuroscanComplete = true;
        
        setTimeout(() => {
            document.getElementById('minigame').classList.add('hidden');
            showScene('post_neuroscan');
        }, 1000);
    };
    
    function updateNeuroscanDisplay() {
        const stressLevelEl = document.getElementById('stress-level');
        const stressBar = document.getElementById('stress-bar');
        const scanProgressEl = document.getElementById('scan-progress');
        const progressBar = document.getElementById('progress-bar');
        
        if (stressLevelEl) stressLevelEl.textContent = Math.round(stressLevel) + '%';
        if (scanProgressEl) scanProgressEl.textContent = Math.round(scanProgress) + '%';
        
        if (stressBar) {
            stressBar.style.width = stressLevel + '%';
            if (stressLevel > 70) {
                stressBar.className = 'bg-red-500 h-3 rounded-full transition-all';
            } else if (stressLevel > 40) {
                stressBar.className = 'bg-yellow-500 h-3 rounded-full transition-all';
            } else {
                stressBar.className = 'bg-green-500 h-3 rounded-full transition-all';
            }
        }
        
        if (progressBar) progressBar.style.width = scanProgress + '%';
    }
}

function showInvestigationGame() {
    const minigameEl = document.getElementById('minigame');
    let investigationTime = 60; // 60 секунд на расследование
    let foundClues = [];
    let investigationActive = false;
    let currentLocation = 'start';
    
    const locations = {
        start: {
            name: "Главный экран",
            description: "Выбери направление расследования",
            clues: [],
            connections: ['financial', 'communications', 'video', 'personal']
        },
        financial: {
            name: "Финансовые документы",
            description: "Банковские переводы и финансовые отчёты",
            clues: [
                { id: 'money_trail', name: 'След денег', difficulty: 3, evidence: 'Переводы от ГЛЧС к Теневому Фонду' },
                { id: 'offshore', name: 'Оффшорные счета', difficulty: 5, evidence: 'Скрытые активы тренеров' }
            ],
            connections: ['communications', 'start']
        },
        communications: {
            name: "Перехваченные сообщения",
            description: "Зашифрованная переписка и звонки",
            clues: [
                { id: 'crow_messages', name: 'Сообщения Кроу', difficulty: 2, evidence: 'Планы подкупа судей' },
                { id: 'encrypted_chat', name: 'Зашифрованный чат', difficulty: 4, evidence: 'Координация между агентами' }
            ],
            connections: ['video', 'financial', 'start']
        },
        video: {
            name: "Видеозаписи",
            description: "Скрытые камеры и записи встреч",
            clues: [
                { id: 'secret_meeting', name: 'Тайная встреча', difficulty: 3, evidence: 'Кроу передаёт конверт незнакомцу' },
                { id: 'lab_footage', name: 'Записи из лаборатории', difficulty: 5, evidence: 'Производство нелегальных имплантов' }
            ],
            connections: ['personal', 'communications', 'start']
        },
        personal: {
            name: "Личные файлы",
            description: "Досье на спортсменов и тренеров",
            clues: [
                { id: 'athlete_profiles', name: 'Профили атлетов', difficulty: 2, evidence: 'Список потенциальных жертв' },
                { id: 'blackmail_files', name: 'Компромат', difficulty: 4, evidence: 'Материалы для шантажа' }
            ],
            connections: ['financial', 'video', 'start']
        }
    };
    
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center">🕵️ Цифровое расследование</h3>
        <p class="mb-4 text-center">Найди улики против Теневого Фонда!</p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-slate-700 rounded-lg p-3">
                <div class="text-sm text-gray-400">Найдено улик:</div>
                <div class="text-2xl font-bold text-blue-400"><span id="found-clues">0</span>/8</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-3">
                <div class="text-sm text-gray-400">Время:</div>
                <div class="text-2xl font-bold text-red-400"><span id="time-left">60</span>с</div>
            </div>
        </div>
        
        <div class="bg-slate-800 rounded-lg p-4 mb-4">
            <div class="text-center mb-2">
                <div class="text-lg font-bold" id="current-location">Главный экран</div>
                <div class="text-sm text-gray-400" id="location-description">Выбери направление расследования</div>
            </div>
            
            <div class="w-full bg-slate-600 rounded-full h-2 mb-4">
                <div id="progress-bar" class="bg-green-500 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
            
            <div id="clues-container" class="space-y-2 mb-4">
                <!-- Улики будут добавлены динамически -->
            </div>
            
            <div id="navigation-container" class="grid grid-cols-2 gap-2">
                <!-- Навигация будет добавлена динамически -->
            </div>
        </div>
        
        <div class="text-center">
            <button id="start-investigation" onclick="startInvestigation()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-all">
                Начать расследование
            </button>
            <button id="complete-investigation" onclick="completeInvestigation()" disabled class="hidden bg-blue-600 px-6 py-3 rounded-lg font-semibold">
                Завершить расследование
            </button>
        </div>
    `;
    
    window.startInvestigation = function() {
        investigationActive = true;
        document.getElementById('start-investigation').classList.add('hidden');
        updateInvestigationDisplay();
        
        // Запускаем таймер
        const timer = setInterval(() => {
            if (!investigationActive) {
                clearInterval(timer);
                return;
            }
            
            investigationTime--;
            document.getElementById('time-left').textContent = investigationTime;
            
            if (investigationTime <= 0) {
                investigationActive = false;
                clearInterval(timer);
                finishInvestigation();
            }
        }, 1000);
        
        playTensionMusic();
    };
    
    window.navigateToLocation = function(locationId) {
        if (!investigationActive) return;
        
        currentLocation = locationId;
        updateInvestigationDisplay();
        playSound('beep');
    };
    
    window.searchForClue = function(clueId) {
        if (!investigationActive) return;
        
        const location = locations[currentLocation];
        const clue = location.clues.find(c => c.id === clueId);
        
        if (!clue || foundClues.includes(clueId)) return;
        
        // Мини-игра поиска улики
        const searchTime = clue.difficulty * 2; // Время поиска зависит от сложности
        let searchProgress = 0;
        
        const searchButton = document.getElementById(`clue-${clueId}`);
        searchButton.disabled = true;
        searchButton.textContent = 'Поиск...';
        
        const searchInterval = setInterval(() => {
            searchProgress += 10;
            searchButton.textContent = `Поиск... ${searchProgress}%`;
            
            if (searchProgress >= 100) {
                clearInterval(searchInterval);
                foundClues.push(clueId);
                gameState.flags.evidenceCount++;
                
                searchButton.textContent = '✓ Найдено!';
                searchButton.className = 'w-full bg-green-600 p-2 rounded text-sm';
                
                showNotification(`Найдена улика: ${clue.evidence}`, 'success');
                playSound('success');
                
                updateInvestigationDisplay();
                
                // Проверяем, достаточно ли улик
                if (foundClues.length >= 5) {
                    investigationActive = false;
                    finishInvestigation();
                }
            }
        }, searchTime * 100);
    };
    
    function updateInvestigationDisplay() {
        const location = locations[currentLocation];
        
        document.getElementById('current-location').textContent = location.name;
        document.getElementById('location-description').textContent = location.description;
        document.getElementById('found-clues').textContent = foundClues.length;
        
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = (foundClues.length / 8) * 100 + '%';
        
        // Обновляем улики
        const cluesContainer = document.getElementById('clues-container');
        cluesContainer.innerHTML = '';
        
        location.clues.forEach(clue => {
            const clueButton = document.createElement('button');
            clueButton.id = `clue-${clue.id}`;
            
            if (foundClues.includes(clue.id)) {
                clueButton.className = 'w-full bg-green-600 p-2 rounded text-sm';
                clueButton.textContent = '✓ ' + clue.name;
                clueButton.disabled = true;
            } else {
                clueButton.className = 'w-full bg-slate-600 hover:bg-slate-500 p-2 rounded text-sm transition-all';
                clueButton.textContent = `🔍 ${clue.name} (сложность: ${clue.difficulty})`;
                clueButton.onclick = () => searchForClue(clue.id);
            }
            
            cluesContainer.appendChild(clueButton);
        });
        
        // Обновляем навигацию
        const navContainer = document.getElementById('navigation-container');
        navContainer.innerHTML = '';
        
        location.connections.forEach(connectionId => {
            const connection = locations[connectionId];
            const navButton = document.createElement('button');
            navButton.className = 'bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm transition-all';
            navButton.textContent = connection.name;
            navButton.onclick = () => navigateToLocation(connectionId);
            navContainer.appendChild(navButton);
        });
    }
    
    function finishInvestigation() {
        document.getElementById('complete-investigation').classList.remove('hidden');
        document.getElementById('complete-investigation').disabled = false;
        
        const evidenceQuality = foundClues.length >= 5 ? 'excellent' : 
                               foundClues.length >= 3 ? 'good' : 'poor';
        
        let message = '';
        switch(evidenceQuality) {
            case 'excellent':
                message = 'Отличная работа! Собрано достаточно улик для разоблачения';
                gameState.honor += 20;
                break;
            case 'good':
                message = 'Хорошее расследование. Есть основания для подозрений';
                gameState.honor += 10;
                break;
            case 'poor':
                message = 'Недостаточно улик. Нужно больше доказательств';
                break;
        }
        
        showNotification(message, evidenceQuality === 'poor' ? 'warning' : 'success');
    }
    
    window.completeInvestigation = function() {
        setTimeout(() => {
            document.getElementById('minigame').classList.add('hidden');
            if (foundClues.length >= 3) {
                showScene('evidence_complete');
            } else {
                showScene('night_training'); // Возвращаемся к обычному сюжету
            }
        }, 1000);
    };
}

function neuroscanChoice(choice) {
    playSound('choice');
    const hasImplant = gameState.choices.implant;
    let success = false;
    
    switch(choice) {
        case 'calm':
            if (!hasImplant) {
                success = true;
                gameState.honor += 10;
                showNotification('Сканирование прошло успешно', 'success');
            } else {
                success = Math.random() > 0.3; // 70% шанс успеха с имплантом
                if (success) {
                    gameState.honor += 5;
                    showNotification('Имплант остался незамеченным', 'success');
                } else {
                    gameState.flags.implantDetected = true;
                    showNotification('ИИ заметил аномалии...', 'warning');
                }
            }
            break;
            
        case 'deflect':
            success = Math.random() > 0.5;
            if (success) {
                gameState.goal += 5;
                showNotification('Удалось отвлечь внимание', 'success');
            } else {
                gameState.flags.suspiciousBehavior = true;
                showNotification('ИИ стал подозрительным', 'warning');
            }
            break;
            
        case 'conflict':
            success = true;
            gameState.honor += 15;
            gameState.flags.neuroscanPassed = true;
            showNotification('ИИ интерпретировал это как честность', 'success');
            break;
    }
    
    gameState.flags.neuroscanComplete = true;
    
    setTimeout(() => {
        document.getElementById('minigame').classList.add('hidden');
        showScene('post_neuroscan');
    }, 2000);
}

function investigateChoice(type) {
    playSound('choice');
    let evidenceFound = false;
    
    switch(type) {
        case 'financial':
            if (gameState.flags.evidenceCount < 5) {
                evidenceFound = true;
                gameState.flags.evidenceCount++;
                showNotification('Найдена связь между ГЛЧС и Теневым Фондом!', 'success');
            }
            break;
            
        case 'communications':
            if (gameState.flags.evidenceCount < 5) {
                evidenceFound = true;
                gameState.flags.evidenceCount++;
                gameState.flags.crowCorruption = true;
                showNotification('Найдены сообщения Кроу о взятках!', 'success');
            }
            break;
            
        case 'video':
            if (gameState.flags.evidenceCount < 5) {
                evidenceFound = true;
                gameState.flags.evidenceCount++;
                showNotification('Найдено видео тайной встречи!', 'success');
            }
            break;
    }
    
    if (gameState.flags.evidenceCount >= 3) {
        setTimeout(() => {
            document.getElementById('minigame').classList.add('hidden');
            showScene('evidence_complete');
        }, 1500);
    }
}

function showSemifinalRace() {
    const minigameEl = document.getElementById('minigame');
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center pulse-glow">🏃‍♂️ Полуфинал ГЛЧС - 800м</h3>
        <p class="mb-4 text-center">Высокие технологии, жёсткая конкуренция. Что ты выберешь?</p>
        <div class="grid grid-cols-1 gap-4">
            <button onclick="makeSemifinalChoice('clean')" class="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">🏃‍♂️ Бежать честно</div>
                <div class="text-sm">Полагаться только на свои силы</div>
            </button>
            <button onclick="makeSemifinalChoice('tactical')" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">🧠 Тактический бег</div>
                <div class="text-sm">Использовать психологические приёмы</div>
            </button>
            ${gameState.flags.alexandraAlly ? `
            <button onclick="makeSemifinalChoice('alliance')" class="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">🤝 Помочь Александре</div>
                <div class="text-sm">Объединиться против системы</div>
            </button>
            ` : ''}
        </div>
    `;
    
    playEpicMusic();
    playSound('tension');
}

function makeSemifinalChoice(choice) {
    playSound('choice');
    
    // Логика для полуфинала второго эпизода
    let ending;
    
    switch(choice) {
        case 'clean':
            ending = 'honor';
            break;
        case 'tactical':
            ending = 'system_agent';
            break;
        case 'alliance':
            ending = 'reform';
            break;
        default:
            ending = 'victory_corrupted';
    }
    
    // Добавляем драматическую паузу
    const buttons = document.querySelectorAll('#minigame button');
    buttons.forEach(button => {
        addAnimation(button, 'shake');
    });
    
    setTimeout(() => {
        showEnding(ending);
    }, 1000);
}

function showRunningGame() {
    const minigameEl = document.getElementById('minigame');
    let currentPace = 50;
    let energy = 100;
    let distance = 0;
    let gameActive = true;
    let rhythmScore = 0;
    let lastClickTime = 0;
    
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4 running-animation">🏃‍♂️ Утренняя пробежка</h3>
        <p class="mb-4 text-center">Поддерживай ритм! Нажимай ПРОБЕЛ в такт сердцебиению</p>
        
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="bg-slate-700 rounded-lg p-3 text-center">
                <div class="text-sm text-gray-400">Темп</div>
                <div id="pace-display" class="text-xl font-bold text-blue-400">Средний</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-3 text-center">
                <div class="text-sm text-gray-400">Энергия</div>
                <div id="energy-display" class="text-xl font-bold text-green-400">100%</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-3 text-center">
                <div class="text-sm text-gray-400">Дистанция</div>
                <div id="distance-display" class="text-xl font-bold text-yellow-400">0м</div>
            </div>
        </div>
        
        <div class="bg-slate-700 rounded-lg p-4 mb-4">
            <div class="flex justify-between mb-2">
                <span>Ритм:</span>
                <span id="rhythm-score">0</span>
            </div>
            <div class="w-full bg-slate-600 rounded-full h-3 mb-2">
                <div id="pace-bar" class="bg-blue-500 h-3 rounded-full transition-all pulse-glow" style="width: 50%"></div>
            </div>
            <div class="w-full bg-slate-600 rounded-full h-2">
                <div id="energy-bar" class="bg-green-500 h-2 rounded-full transition-all" style="width: 100%"></div>
            </div>
        </div>
        
        <div class="text-center mb-4">
            <div id="heartbeat" class="text-4xl animate-pulse">💓</div>
            <div class="text-sm text-gray-400">Нажимай ПРОБЕЛ в ритм!</div>
        </div>
        
        <div class="text-center">
            <button id="running-complete" onclick="completeRunning()" disabled class="bg-gray-600 px-6 py-2 rounded transition-all">
                Завершить (нужно пробежать 1000м)
            </button>
        </div>
    `;
    
    // Запускаем игровой цикл
    const gameInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(gameInterval);
            return;
        }
        
        // Уменьшаем энергию со временем
        energy = Math.max(0, energy - 0.5);
        
        // Увеличиваем дистанцию в зависимости от темпа
        const speedMultiplier = currentPace / 50;
        distance += speedMultiplier * 2;
        
        // Обновляем отображение
        updateRunningDisplay();
        
        // Проверяем условия завершения
        if (distance >= 1000) {
            document.getElementById('running-complete').disabled = false;
            document.getElementById('running-complete').className = 'bg-green-600 hover:bg-green-700 px-6 py-2 rounded transition-all';
            document.getElementById('running-complete').textContent = 'Завершить пробежку!';
        }
        
        if (energy <= 0) {
            gameActive = false;
            showNotification('Энергия закончилась! Пробежка завершена', 'warning');
            completeRunning();
        }
    }, 100);
    
    // Обработчик нажатий клавиш
    const keyHandler = (event) => {
        if (event.code === 'Space' && gameActive) {
            event.preventDefault();
            const currentTime = Date.now();
            const timeDiff = currentTime - lastClickTime;
            
            // Идеальный ритм - около 600-800мс между нажатиями
            if (timeDiff > 500 && timeDiff < 900) {
                rhythmScore++;
                currentPace = Math.min(100, currentPace + 5);
                energy = Math.min(100, energy + 2);
                playSound('success');
                
                // Анимация сердцебиения
                const heartbeat = document.getElementById('heartbeat');
                if (heartbeat) {
                    addAnimation(heartbeat, 'bounce-in');
                }
            } else {
                currentPace = Math.max(10, currentPace - 3);
                energy = Math.max(0, energy - 1);
                playSound('beep');
            }
            
            lastClickTime = currentTime;
            updateRunningDisplay();
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    // Сохраняем обработчик для очистки
    minigameEl.keyHandler = keyHandler;
    
    function updateRunningDisplay() {
        const paceDisplay = document.getElementById('pace-display');
        const energyDisplay = document.getElementById('energy-display');
        const distanceDisplay = document.getElementById('distance-display');
        const rhythmScoreEl = document.getElementById('rhythm-score');
        const paceBar = document.getElementById('pace-bar');
        const energyBar = document.getElementById('energy-bar');
        
        if (paceDisplay) {
            if (currentPace > 70) {
                paceDisplay.textContent = 'Быстрый';
                paceDisplay.className = 'text-xl font-bold text-red-400';
            } else if (currentPace > 40) {
                paceDisplay.textContent = 'Средний';
                paceDisplay.className = 'text-xl font-bold text-blue-400';
            } else {
                paceDisplay.textContent = 'Медленный';
                paceDisplay.className = 'text-xl font-bold text-gray-400';
            }
        }
        
        if (energyDisplay) energyDisplay.textContent = Math.round(energy) + '%';
        if (distanceDisplay) distanceDisplay.textContent = Math.round(distance) + 'м';
        if (rhythmScoreEl) rhythmScoreEl.textContent = rhythmScore;
        if (paceBar) paceBar.style.width = currentPace + '%';
        if (energyBar) energyBar.style.width = energy + '%';
    }
    
    // Сохраняем данные игры для использования в completeRunning
    window.runningGameData = {
        distance: () => distance,
        rhythmScore: () => rhythmScore,
        energy: () => energy,
        gameActive: () => gameActive,
        setGameActive: (value) => { gameActive = value; }
    };
}

function showTrainingGame() {
    const minigameEl = document.getElementById('minigame');
    let selectedTraining = null;
    let trainingProgress = 0;
    let trainingActive = false;
    let clickCount = 0;
    let targetClicks = 0;
    let timeLeft = 0;
    
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4">💪 Интенсивная тренировка</h3>
        <p class="mb-4 text-center">Выбери тип тренировки и выполни упражнения!</p>
        
        <div id="training-selection" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button onclick="selectTraining('speed')" class="training-btn bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">⚡ Скорость</div>
                <div class="text-sm">Спринты и ускорения</div>
                <div class="text-xs mt-2 text-gray-300">Быстрые клики за 10 сек</div>
            </button>
            <button onclick="selectTraining('endurance')" class="training-btn bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">🔋 Выносливость</div>
                <div class="text-sm">Длительная нагрузка</div>
                <div class="text-xs mt-2 text-gray-300">Ритмичные клики 15 сек</div>
            </button>
            <button onclick="selectTraining('technique')" class="training-btn bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-all transform hover:scale-105">
                <div class="font-bold">🎯 Техника</div>
                <div class="text-sm">Точность движений</div>
                <div class="text-xs mt-2 text-gray-300">Точные клики в ритм</div>
            </button>
        </div>
        
        <div id="training-game" class="hidden">
            <div class="bg-slate-700 rounded-lg p-4 mb-4">
                <div class="flex justify-between mb-2">
                    <span>Прогресс:</span>
                    <span id="training-progress">0%</span>
                </div>
                <div class="w-full bg-slate-600 rounded-full h-3 mb-2">
                    <div id="progress-bar" class="bg-yellow-500 h-3 rounded-full transition-all" style="width: 0%"></div>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Клики: <span id="click-count">0</span>/<span id="target-clicks">0</span></span>
                    <span>Время: <span id="time-left">0</span>с</span>
                </div>
            </div>
            
            <div class="text-center mb-4">
                <div id="training-target" class="text-6xl mb-2 cursor-pointer select-none transition-all transform hover:scale-110" onclick="trainingClick()">
                    🎯
                </div>
                <div id="training-instruction" class="text-sm text-gray-400">
                    Кликай по мишени!
                </div>
            </div>
            
            <div class="text-center">
                <button id="training-complete" onclick="completeTraining(selectedTraining)" disabled class="bg-gray-600 px-6 py-2 rounded transition-all">
                    Завершить тренировку
                </button>
            </div>
        </div>
    `;
    
    window.selectTraining = function(type) {
        selectedTraining = type;
        trainingActive = true;
        clickCount = 0;
        trainingProgress = 0;
        
        // Настройки для разных типов тренировок
        switch(type) {
            case 'speed':
                targetClicks = 30;
                timeLeft = 10;
                document.getElementById('training-target').textContent = '⚡';
                document.getElementById('training-instruction').textContent = 'Кликай как можно быстрее!';
                break;
            case 'endurance':
                targetClicks = 40;
                timeLeft = 15;
                document.getElementById('training-target').textContent = '🔋';
                document.getElementById('training-instruction').textContent = 'Поддерживай ровный ритм!';
                break;
            case 'technique':
                targetClicks = 20;
                timeLeft = 12;
                document.getElementById('training-target').textContent = '🎯';
                document.getElementById('training-instruction').textContent = 'Точность важнее скорости!';
                break;
        }
        
        document.getElementById('training-selection').classList.add('hidden');
        document.getElementById('training-game').classList.remove('hidden');
        
        updateTrainingDisplay();
        startTrainingTimer();
    };
    
    window.trainingClick = function() {
        if (!trainingActive) return;
        
        clickCount++;
        trainingProgress = (clickCount / targetClicks) * 100;
        
        // Анимация клика
        const target = document.getElementById('training-target');
        addAnimation(target, 'bounce-in');
        
        // Звук в зависимости от типа тренировки
        if (selectedTraining === 'technique') {
            // Для техники важна точность - проверяем интервалы
            playSound('success');
        } else {
            playSound('beep');
        }
        
        updateTrainingDisplay();
        
        if (clickCount >= targetClicks) {
            trainingActive = false;
            document.getElementById('training-complete').disabled = false;
            document.getElementById('training-complete').className = 'bg-green-600 hover:bg-green-700 px-6 py-2 rounded transition-all';
            showNotification('Тренировка завершена!', 'success');
        }
    };
    
    function startTrainingTimer() {
        const timer = setInterval(() => {
            if (!trainingActive) {
                clearInterval(timer);
                return;
            }
            
            timeLeft--;
            updateTrainingDisplay();
            
            if (timeLeft <= 0) {
                trainingActive = false;
                clearInterval(timer);
                
                if (clickCount >= targetClicks * 0.7) { // 70% от цели
                    document.getElementById('training-complete').disabled = false;
                    document.getElementById('training-complete').className = 'bg-green-600 hover:bg-green-700 px-6 py-2 rounded transition-all';
                    showNotification('Время вышло! Тренировка засчитана', 'success');
                } else {
                    showNotification('Время вышло! Недостаточно усилий', 'warning');
                    document.getElementById('training-complete').disabled = false;
                    document.getElementById('training-complete').className = 'bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded transition-all';
                }
            }
        }, 1000);
    }
    
    function updateTrainingDisplay() {
        const progressEl = document.getElementById('training-progress');
        const progressBar = document.getElementById('progress-bar');
        const clickCountEl = document.getElementById('click-count');
        const targetClicksEl = document.getElementById('target-clicks');
        const timeLeftEl = document.getElementById('time-left');
        
        if (progressEl) progressEl.textContent = Math.round(trainingProgress) + '%';
        if (progressBar) progressBar.style.width = trainingProgress + '%';
        if (clickCountEl) clickCountEl.textContent = clickCount;
        if (targetClicksEl) targetClicksEl.textContent = targetClicks;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft;
    }
    
    // Сохраняем данные для completeTraining
    window.trainingGameData = {
        getPerformance: () => {
            const efficiency = (clickCount / targetClicks) * 100;
            return {
                type: selectedTraining,
                efficiency: efficiency,
                clickCount: clickCount,
                targetClicks: targetClicks
            };
        }
    };
}

function showFinalRace() {
    const minigameEl = document.getElementById('minigame');
    let racePosition = 50; // Позиция относительно Дарьи (50 = рядом)
    let stamina = gameState.stamina;
    let raceDistance = 0;
    let raceActive = false;
    let racePhase = 'preparation'; // preparation, start, middle, final
    
    minigameEl.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center pulse-glow">🏁 Финальный забег - 1500м</h3>
        <p class="mb-4 text-center">Последние 200 метров. Дарья рядом, но ты видишь её боль...</p>
        
        <div class="bg-slate-800 rounded-lg p-4 mb-4">
            <div class="text-center mb-2">Дистанция: <span id="race-distance">1300</span>/1500м</div>
            <div class="relative bg-slate-600 rounded-full h-4 mb-4">
                <!-- Трек -->
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-30"></div>
                
                <!-- Дарья -->
                <div id="darya-position" class="absolute top-0 h-4 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs" style="left: 45%">
                    👩
                </div>
                
                <!-- Игрок -->
                <div id="player-position" class="absolute top-0 h-4 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs" style="left: 50%">
                    🏃
                </div>
                
                <!-- Финишная линия -->
                <div class="absolute right-0 top-0 h-4 w-1 bg-yellow-400"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Твоя выносливость:</div>
                    <div class="w-full bg-slate-600 rounded-full h-2">
                        <div id="stamina-bar" class="bg-green-500 h-2 rounded-full transition-all" style="width: ${(stamina/150)*100}%"></div>
                    </div>
                </div>
                <div>
                    <div class="text-gray-400">Состояние Дарьи:</div>
                    <div class="text-red-400">😰 Скрывает боль</div>
                </div>
            </div>
        </div>
        
        <div id="race-preparation" class="text-center">
            <div class="mb-4">
                <div class="text-lg mb-2">Ты видишь, как Дарья морщится от боли в колене...</div>
                <div class="text-sm text-gray-400">Что ты будешь делать в решающий момент?</div>
            </div>
            
            <button onclick="startRacePhase()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-all">
                Начать финальный рывок!
            </button>
        </div>
        
        <div id="race-active" class="hidden text-center">
            <div class="mb-4">
                <div id="race-instruction" class="text-lg mb-2">Нажимай ПРОБЕЛ для ускорения!</div>
                <div class="text-sm text-gray-400">Но помни о выносливости...</div>
            </div>
            
            <div class="grid grid-cols-1 gap-3">
                <button id="race-sprint" onclick="raceAction('sprint')" class="bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-all">
                    <div class="font-bold">🔥 Финальный спринт</div>
                    <div class="text-sm">Максимальная скорость, высокий расход выносливости</div>
                </button>
                
                <button id="race-steady" onclick="raceAction('steady')" class="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-all">
                    <div class="font-bold">⚖️ Держать темп</div>
                    <div class="text-sm">Стабильная скорость, умеренный расход</div>
                </button>
                
                <button id="race-help" onclick="raceAction('help')" class="bg-green-600 hover:bg-green-700 p-3 rounded-lg transition-all">
                    <div class="font-bold">🤝 Поддержать Дарью</div>
                    <div class="text-sm">Замедлиться и помочь ей</div>
                </button>
                
                ${gameState.choices.implant ? `
                <button id="race-implant" onclick="raceAction('implant')" class="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg transition-all">
                    <div class="font-bold">🧠 Активировать имплант</div>
                    <div class="text-sm">Нечестное преимущество, риск разоблачения</div>
                </button>
                ` : ''}
            </div>
        </div>
        
        <div id="race-result" class="hidden text-center">
            <div id="result-text" class="text-lg mb-4"></div>
            <button onclick="finishRace()" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-semibold transition-all">
                Завершить забег
            </button>
        </div>
    `;
    
    let raceTimer;
    let playerChoice = null;
    
    window.startRacePhase = function() {
        raceActive = true;
        racePhase = 'active';
        raceDistance = 1300;
        
        document.getElementById('race-preparation').classList.add('hidden');
        document.getElementById('race-active').classList.remove('hidden');
        
        playEpicMusic();
        
        // Запускаем гонку
        raceTimer = setInterval(() => {
            if (!raceActive) {
                clearInterval(raceTimer);
                return;
            }
            
            // Дарья медленно продвигается из-за травмы
            raceDistance += 2;
            
            updateRaceDisplay();
            
            if (raceDistance >= 1500) {
                raceActive = false;
                clearInterval(raceTimer);
                
                if (!playerChoice) {
                    // Если игрок не сделал выбор - автоматически "держать темп"
                    raceAction('steady');
                }
            }
        }, 200);
    };
    
    window.raceAction = function(action) {
        if (!raceActive) return;
        
        playerChoice = action;
        raceActive = false;
        clearInterval(raceTimer);
        
        let resultText = '';
        let finalChoice = '';
        
        switch(action) {
            case 'sprint':
                if (stamina >= 30) {
                    racePosition += 20;
                    resultText = 'Ты вырываешься вперёд! Дарья остаётся позади, борясь с болью.';
                    finalChoice = 'win';
                } else {
                    racePosition -= 10;
                    resultText = 'Не хватило сил для спринта! Дарья обгоняет тебя.';
                    finalChoice = 'lose';
                }
                break;
                
            case 'steady':
                racePosition += 5;
                resultText = 'Ты держишь стабильный темп. Борьба до последнего метра!';
                finalChoice = 'close';
                break;
                
            case 'help':
                racePosition -= 15;
                resultText = 'Ты замедляешься и поддерживаешь Дарью. Она благодарно смотрит на тебя.';
                finalChoice = 'help';
                break;
                
            case 'implant':
                racePosition += 30;
                resultText = 'Имплант даёт невероятную скорость! Но камеры всё фиксируют...';
                finalChoice = 'implant';
                break;
        }
        
        document.getElementById('race-active').classList.add('hidden');
        document.getElementById('race-result').classList.remove('hidden');
        document.getElementById('result-text').textContent = resultText;
        
        // Сохраняем выбор для финальной обработки
        window.finalRaceChoice = finalChoice;
        
        updateRaceDisplay();
    };
    
    window.finishRace = function() {
        const choice = window.finalRaceChoice || 'steady';
        makeRaceChoice(choice);
    };
    
    function updateRaceDisplay() {
        const distanceEl = document.getElementById('race-distance');
        const staminaBar = document.getElementById('stamina-bar');
        const playerPos = document.getElementById('player-position');
        const daryaPos = document.getElementById('darya-position');
        
        if (distanceEl) distanceEl.textContent = Math.min(1500, raceDistance);
        if (staminaBar) staminaBar.style.width = Math.max(0, (stamina/150)*100) + '%';
        
        // Обновляем позиции на треке
        const trackProgress = Math.min(100, (raceDistance / 1500) * 100);
        if (playerPos) {
            const playerTrackPos = Math.min(95, Math.max(5, trackProgress + (racePosition - 50) * 0.5));
            playerPos.style.left = playerTrackPos + '%';
        }
        if (daryaPos) {
            const daryaTrackPos = Math.min(95, Math.max(5, trackProgress - 5)); // Дарья немного отстаёт
            daryaPos.style.left = daryaTrackPos + '%';
        }
    }
}

function completeRunning() {
    playSound('success');
    const minigameEl = document.getElementById('minigame');
    addAnimation(minigameEl, 'fade-in');
    
    // Очищаем обработчик клавиш
    if (minigameEl.keyHandler) {
        document.removeEventListener('keydown', minigameEl.keyHandler);
    }
    
    // Получаем результаты пробежки
    let staminaBonus = 10;
    let healthBonus = 0;
    let moralityBonus = 0;
    
    if (window.runningGameData) {
        const data = window.runningGameData;
        const distance = data.distance();
        const rhythmScore = data.rhythmScore();
        const energy = data.energy();
        
        data.setGameActive(false);
        
        // Бонусы в зависимости от результатов
        if (distance >= 1000) {
            staminaBonus += 10;
            healthBonus += 5;
            showNotification('Отличная пробежка! Дистанция пройдена полностью', 'success');
        } else if (distance >= 500) {
            staminaBonus += 5;
            showNotification('Хорошая пробежка, но можно было лучше', 'info');
        } else {
            staminaBonus = 5;
            healthBonus -= 5;
            showNotification('Слабая пробежка. Нужно больше тренироваться', 'warning');
        }
        
        if (rhythmScore >= 20) {
            moralityBonus += 5;
            staminaBonus += 5;
            showNotification('Отличный ритм! Ты чувствуешь гармонию', 'success');
        }
        
        if (energy > 50) {
            healthBonus += 5;
            showNotification('Ты сохранил много энергии!', 'success');
        }
    }
    
    setTimeout(() => {
        minigameEl.classList.add('hidden');
        document.getElementById('choices').innerHTML = '';
        
        gameState.stamina += staminaBonus;
        gameState.health += healthBonus;
        gameState.morality += moralityBonus;
        
        updateStats();
        
        // Показываем итоговое уведомление
        showNotification(`Пробежка завершена! +${staminaBonus} выносливость, +${healthBonus} здоровье`, 'success');
    }, 500);
}

function completeTraining(type) {
    playSound('success');
    const minigameEl = document.getElementById('minigame');
    addAnimation(minigameEl, 'shake');
    
    let staminaBonus = 0;
    let healthBonus = 0;
    let moralityBonus = 0;
    let honorBonus = 0;
    
    // Получаем результаты тренировки
    let efficiency = 100; // По умолчанию 100%
    if (window.trainingGameData) {
        const performance = window.trainingGameData.getPerformance();
        efficiency = performance.efficiency;
        type = performance.type; // Обновляем тип на основе выбора игрока
    }
    
    // Базовые бонусы в зависимости от типа тренировки
    switch(type) {
        case 'speed':
            staminaBonus = 15;
            healthBonus = 5;
            break;
        case 'endurance':
            staminaBonus = 20;
            healthBonus = 10;
            break;
        case 'technique':
            staminaBonus = 10;
            moralityBonus = 5;
            honorBonus = 5;
            break;
    }
    
    // Модификаторы в зависимости от эффективности
    const efficiencyMultiplier = efficiency / 100;
    staminaBonus = Math.round(staminaBonus * efficiencyMultiplier);
    healthBonus = Math.round(healthBonus * efficiencyMultiplier);
    moralityBonus = Math.round(moralityBonus * efficiencyMultiplier);
    honorBonus = Math.round(honorBonus * efficiencyMultiplier);
    
    // Дополнительные бонусы за отличную работу
    if (efficiency >= 90) {
        staminaBonus += 5;
        honorBonus += 5;
        showNotification('Превосходная тренировка! Ты превзошёл себя!', 'success');
    } else if (efficiency >= 70) {
        staminaBonus += 2;
        showNotification('Хорошая тренировка! Ты на правильном пути', 'success');
    } else if (efficiency >= 50) {
        showNotification('Неплохая тренировка, но можно лучше', 'info');
    } else {
        staminaBonus = Math.max(1, staminaBonus - 5);
        healthBonus = Math.max(0, healthBonus - 3);
        showNotification('Слабая тренировка. Нужно больше концентрации', 'warning');
    }
    
    setTimeout(() => {
        minigameEl.classList.add('hidden');
        document.getElementById('choices').innerHTML = '';
        
        gameState.stamina += staminaBonus;
        gameState.health += healthBonus;
        gameState.morality += moralityBonus;
        gameState.honor += honorBonus;
        
        updateStats();
        
        // Показываем детальное уведомление
        const typeNames = {
            'speed': 'Скорость',
            'endurance': 'Выносливость', 
            'technique': 'Техника'
        };
        
        showNotification(`${typeNames[type]}: +${staminaBonus} выносливость, эффективность ${Math.round(efficiency)}%`, 'success');
    }, 500);
}

function makeSemifinalChoice(choice) {
    playSound('choice');
    
    // Логика для полуфинала второго эпизода
    let ending;
    
    switch(choice) {
        case 'clean':
            ending = 'ep2_honest';
            break;
        case 'tactical':
            ending = 'ep2_corrupted';
            break;
        case 'alliance':
            ending = 'ep2_truth';
            break;
        default:
            ending = 'ep2_honest';
    }
    
    // Добавляем драматическую паузу
    const buttons = document.querySelectorAll('#minigame button');
    buttons.forEach(button => {
        addAnimation(button, 'shake');
    });
    
    setTimeout(() => {
        showEnding(ending);
    }, 1000);
}

function makeRaceChoice(choice) {
    playSound('tension');
    gameState.choices.finalChoice = choice;
    
    // Добавляем драматическую паузу
    const buttons = document.querySelectorAll('#minigame button');
    buttons.forEach(button => {
        addAnimation(button, 'shake');
    });
    
    setTimeout(() => {
        // Определяем концовку на основе всех выборов
        let ending;
        
        if (gameState.flags.investigateFound && choice !== 'implant') {
            ending = 'reform';
        } else if (choice === 'help' && gameState.choices.trainer === 'vera' && !gameState.choices.implant) {
            ending = 'honor';
        } else if (choice === 'implant' || (choice === 'win' && gameState.choices.implant)) {
            ending = 'victory_corrupted';
        } else if (gameState.choices.implant && choice === 'win') {
            ending = 'system_agent';
        } else if (choice === 'help') {
            ending = 'honor';
        } else {
            ending = 'system_agent';
        }
        
        showEnding(ending);
    }, 1000);
}

function showEnding(endingId) {
    const ending = endings[endingId];
    
    // Завершаем эпизод
    completeEpisode(gameState.currentEpisode, endingId);
    
    // Переключаемся на соответствующую музыку для концовки
    if (endingId === 'honor' || endingId === 'reform') {
        playEpicMusic(); // Триумфальная музыка для хороших концовок
    } else {
        playTensionMusic(); // Напряженная музыка для плохих концовок
    }
    
    // Анимация перехода
    const gameScreen = document.getElementById('game-screen');
    addAnimation(gameScreen, 'fade-in');
    
    setTimeout(() => {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('ending-screen').classList.remove('hidden');
        
        const endingScreen = document.getElementById('ending-screen');
        addAnimation(endingScreen, 'fade-in');
        
        document.getElementById('ending-title').textContent = ending.title;
        
        // Анимация печати текста концовки
        const endingTextEl = document.getElementById('ending-text');
        endingTextEl.textContent = '';
        typeText(endingTextEl, ending.text);
        
        // Звук в зависимости от концовки
        if (endingId === 'honor' || endingId === 'reform') {
            playSound('success');
        } else {
            playSound('tension');
        }
    }, 500);
}

function updateStats() {
    const oldHealth = parseInt(document.getElementById('health').textContent) || 0;
    const oldStamina = parseInt(document.getElementById('stamina').textContent) || 0;
    const oldHonor = parseInt(document.getElementById('honor').textContent) || 0;
    const oldGoal = parseInt(document.getElementById('goal').textContent) || 0;
    
    const newHealth = Math.max(0, Math.min(100, gameState.health));
    const newStamina = Math.max(0, Math.min(150, gameState.stamina));
    const newHonor = Math.max(-50, Math.min(100, gameState.honor));
    const newGoal = Math.max(-50, Math.min(100, gameState.goal));
    
    document.getElementById('health').textContent = newHealth;
    document.getElementById('stamina').textContent = newStamina;
    document.getElementById('honor').textContent = newHonor;
    document.getElementById('goal').textContent = newGoal;
    
    // Обновляем номер эпизода
    document.getElementById('episode').textContent = gameState.currentEpisode;
    
    // Анимации изменения статов
    animateStatChange('health', oldHealth, newHealth);
    animateStatChange('stamina', oldStamina, newStamina);
    animateStatChange('honor', oldHonor, newHonor);
    animateStatChange('goal', oldGoal, newGoal);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 p-4 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-600' : 
        type === 'warning' ? 'bg-yellow-600' : 
        'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    addAnimation(notification, 'slide-in-right');
    
    setTimeout(() => {
        addAnimation(notification, 'fade-in');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function restartGame() {
    playSound('choice');
    
    // Останавливаем текущую музыку и возвращаемся к спокойной
    if (audioSystem.currentMusic) {
        audioSystem.currentMusic.stop();
    }
    
    // Сброс состояния игры
    resetGameState();
    
    // Анимация перехода
    const endingScreen = document.getElementById('ending-screen');
    addAnimation(endingScreen, 'fade-in');
    
    setTimeout(() => {
        // Возврат к выбору эпизодов
        document.getElementById('ending-screen').classList.add('hidden');
        document.getElementById('episode-select').classList.remove('hidden');
        
        const episodeSelect = document.getElementById('episode-select');
        addAnimation(episodeSelect, 'fade-in');
        
        // Обновляем прогресс
        updateProgressDisplay();
        
        // Запускаем спокойную музыку
        startBackgroundMusic();
    }, 500);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initAudio();
    loadProgress(); // Загружаем прогресс игрока
    updateStats();
    
    // Добавляем обработчик клавиш для дополнительного взаимодействия
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && gameState.currentScene === 'morning_run') {
            event.preventDefault();
            playSound('beep');
            // Можно добавить логику для мини-игры бега
        }
    });
});