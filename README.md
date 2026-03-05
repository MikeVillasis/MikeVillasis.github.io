<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Miguel Villasis Miranda - UE DEV</title>
    <style>
        :root {
            --bg-color: #050a0e;
            --panel-bg: rgba(10, 20, 30, 0.9);
            --border-color: #00ffcc; 
            --text-main: #e0f8f5;
            --text-muted: #5b8c85;
            --highlight: #68b5bf; 
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                linear-gradient(rgba(0, 255, 204, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 204, 0.05) 1px, transparent 1px);
            background-size: 30px 30px; 
            color: var(--text-main);
            font-family: 'Courier New', monospace;
            font-size: 1.3rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            /* Allow scrolling on smaller screens */
            overflow-y: auto; 
            padding: 20px;
        }

        /* The Main Game Screen Container */
        #game-screen {
            width: 100%;
            max-width: 1400px;
            /* Removed fixed 85vh height to allow dynamic sizing */
            min-height: 85vh; 
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 30px;
        }

        /* Top Section: Character Stats & Dynamic Panels */
        #display-area {
            display: flex;
            gap: 10px;
            flex-grow: 1;
        }

        /* Character/Player Banner */
        .player-stats {
            background: var(--panel-bg);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            padding: 20px;
            width: 360px;
            /* box-shadow: 0 0 10px rgba(0, 255, 204, 0.2); */
            display: flex;
            flex-direction: column;
            max-height: 600px;
            /* Prevents the stat box from shrinking */
            flex-shrink: 0; 
        }

        /* Profile Picture Container */
        .profile-pic-container {
            width: 100%;
            aspect-ratio: 1 / 2;
            border: 2px solid var(--text-muted);
            margin-bottom: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
            color: var(--text-muted);
            overflow: hidden;
        }

        .profile-pic-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: grayscale(10%) contrast(120%);
        }

        .player-stats h1 {
            font-size: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
            border-bottom: 2px solid var(--text-muted);
            padding-bottom: 5px;
            color: var(--border-color);
            /* text-shadow: 0 0 5px var(--border-color); */
            text-align: center;
        }

        .stat-line {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 1.1rem;
        }

        .exp-bar-container {
            width: 100%;
            height: 15px;
            background: #111;
            border: 1px solid var(--text-muted);
            margin-top: 5px;
            margin-bottom: 15px;
        }

        .exp-bar-fill {
            height: 100%;
            width: 80%; 
            background: var(--border-color);
            box-shadow: 0 0 8px var(--border-color);
        }

        /* Persistent Contact Info inside Stats */
        .persistent-contact {
            margin-top: auto; /* Pushes to the bottom of the flex container */
            border-top: 1px dashed var(--text-muted);
            padding-top: 15px;
            font-size: 1.1rem;
            color: var(--text-main);
        }

        .persistent-contact p {
            margin-bottom: 5px;
            font-size: 1.1rem;
            display: flex;
            justify-content: space-between;
        }

        .contact-label {
            color: var(--text-muted);
        }

        /* Dynamic Content Panels */
        .content-window {
            background: var(--panel-bg);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            padding: 30px;
            flex-grow: 1;
            /* box-shadow: 0 0 15px rgba(0, 255, 204, 0.1); */
            position: relative;
            overflow-y: auto;
            max-height: 600px;
            display: none;
        }

        .content-window.active {
            display: block;
            animation: scanline 0.2s ease-out forwards;
        }

        @keyframes scanline {
            0% { transform: scaleY(0.1); opacity: 0; }
            100% { transform: scaleY(1); opacity: 1; }
        }

        .content-window h2 {
            color: var(--highlight);
            margin-bottom: 15px;
            font-size: 2.5rem;
            /* text-shadow: 0 0 5px var(--highlight); */
        }

        p, li {
            font-size: 1.4rem;
            line-height: 1.4;
            margin-bottom: 10px;
        }

        ul { margin-left: 20px; }

        /* Inner Tabs Navigation */
        .sub-nav {
            display: flex;
            flex-wrap: wrap; /* Allows tabs to wrap on small screens */
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--text-muted);
            padding-bottom: 10px;
        }

        .sub-btn {
            background: transparent;
            border: 1px solid var(--text-muted);
            color: var(--text-muted);
            font-family: 'Courier New', monospace;
            font-size: 1.3rem;
            padding: 5px 15px;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.1s;
        }

        .sub-btn:hover {
            border-color: var(--border-color);
            color: var(--border-color);
        }

        .sub-btn.active {
            background: var(--border-color);
            color: var(--bg-color);
            border-color: var(--border-color);
            font-weight: bold;
        }

        .sub-content { display: none; }
        .sub-content.active { display: block; }

        /* Bottom Section: Combat Menu */
        #command-menu-container {
            align-self: flex-end;
            width: 100%;
        }

        .menu-title {
            text-transform: uppercase;
            color: var(--border-color);
            margin-bottom: 10px;
            font-size: 1.5rem;
        }

        .combat-menu {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .menu-btn {
            background: #0a141e;
            border: 2px solid var(--text-muted);
            padding: 20px;
            color: var(--text-main);
            font-family: 'Courier New', monospace;
            font-size: 1.3rem;
            text-transform: uppercase;
            cursor: pointer;
            text-align: left;
            position: relative;
            transition: all 0.1s ease;
        }

        .menu-btn:hover {
            border-color: var(--border-color);
            color: var(--border-color);
        }

        .menu-btn.active {
            background: var(--highlight);
            color: white;
            border-color: white;
            box-shadow: 0 0 5px var(--highlight);
        }

        .menu-btn::before {
            content: '>';
            position: absolute;
            left: -20px;
            color: var(--border-color);
            opacity: 0;
        }

        .menu-btn:hover::before { opacity: 1; left: 10px; }
        .menu-btn:hover { padding-left: 30px; }
        .menu-btn.active { padding-left: 30px; }
        .menu-btn.active::before { opacity: 1; left: 10px; color: white; }

        /* --- MOBILE RESPONSIVENESS --- */
        @media (max-width: 900px) {
            body {
                align-items: flex-start; /* Prevent top cutoff when scrolling */
            }

            #display-area {
                flex-direction: column; /* Stack the player stats and content window */
            }

            .player-stats {
                width: 100%; /* Take up full width on mobile */
                flex-direction: row; /* Shift layout to horizontal for mobile efficiency */
                flex-wrap: wrap;
                gap: 20px;
            }

            .profile-pic-container {
                width: 120px; /* Make it smaller on mobile */
                margin-bottom: 0;
            }

            .stat-container-mobile {
                flex-grow: 1;
                min-width: 200px;
            }

            .persistent-contact {
                width: 100%;
                margin-top: 0;
            }

            .content-window {
                min-height: 400px; /* Ensure reading space on mobile */
            }

            #command-menu-container {
                align-self: center; /* Center the menu on mobile */
            }
        }

        @media (max-width: 500px) {
            .combat-menu {
                grid-template-columns: 1fr; /* 1 column grid for very small screens */
            }
            .player-stats h1 { text-align: left; }
        }

    </style>
</head>
<body>

    <div id="game-screen">
        
        <div id="display-area">
            
            <div class="player-stats">
                <div class="profile-pic-container">
                    <img src="Img/ProfileP.jpg" alt="Profile Picture">
                </div>
                
                <div class="stat-container-mobile">
                    <h1>Miguel Villasis Miranda</h1>
                    <div class="stat-line">
                        <span>Class</span>
                        <span>UE Developer</span>
                    </div>
                    <div class="stat-line">
                        <span>Level</span>
                        <span>Senior</span>
                    </div>
                    <div class="stat-line">
                        <span>EXP</span>
                        <span>6 (years of experience)</span>
                    </div>
                    <div class="exp-bar-container">
                        <div class="exp-bar-fill"></div>
                    </div>
                </div>

                <div class="persistent-contact">
                    <p><span class="contact-label">Phone:</span> +1 (604) 404-5106</p>
                    <p><span class="contact-label">Mail:</span> <a href="mailto:miguelvillasism@gmail.com" style="color: white;">miguelvillasism@gmail.com</a></p>
                    <p><span class="contact-label">LinkedIn:</span>
                        <a href="https://www.linkedin.com/in/miguel-villasismiranda/" target="_blank" style="color: white;">Miguel Villasis</a></p>
                    <p><span class="contact-label">IMDB</span>
                        <a href="https://www.imdb.com/name/nm13754785/" target="_blank" style="color: white;">IMDB Page</a></p>
                </div>
            </div>

            <div id="panel-idle" class="content-window active">
                <h2>Battle Start! Miguel Villasis Miranda</h2>    
                <p>I am a passionate <strong>Unreal Engine </strong>Developer with 6+ years of experience crafting complex UI tools, expanding 
                    engine capabilities, optimizing performance, and bridging the gap between art and code. 
                    I specialize in <strong>C++, Python and Blueprints </strong>, with a strong focus on creating dynamic,
                    data-driven systems that empower designers and artists.</p>
                <p>
                    <iframe width="500" height="315"
                    src="https://www.youtube.com/embed/SMF5u0gGnLE?autoplay=1&mute=1"
                    style="justify-content: center; display: block; margin: 0 auto;">
                    </iframe>
                </p>
            </div>

            <div id="panel-about" class="content-window">   
                <h2>Professional Experience</h2>
                <p><strong>Unreal Engine Developer - 6 Years of Experience</strong></p>
                <br>
                <ul>
                    <li>Currently employed at <strong> Mainframe Studios</strong> (2021-Present) as a <strong>Game Engine Pipeline Technical Developer on mutliple productions</strong></li>
                    <li>From modifying the source code, to creating beautiful custom UIs and tools for artists and designers, my responbilities are extensive</li>
                    <li>All tools, plugins and extensions have been developed in <strong>C++, Python, UMG, Slate and Blueprints</strong></li>
                    <li>My work varies from expanding the <strong>Movie Render Pipeline</strong>, to optimizing and enabling <strong>fbx, USD, and Gaffer imports</strong></li>
                    <li>Other technologies that I use include <strong>Perforce, Visual Studio, VSCode, Rez,</strong> etc. On both Linux and Windows I make sure the pipeline works! </li>
                </ul>
            </div>

            <div id="panel-credits" class="content-window">
                <h2>ANIMATION CREDITS</h2>
                <div class="sub-nav">
                    <button class="sub-btn active" data-parent="panel-credits" data-target="credit-1">Immortals</button>
                    <button class="sub-btn" data-parent="panel-credits" data-target="credit-2">Unicorn Academy</button>
                    <button class="sub-btn" data-parent="panel-credits" data-target="credit-3">Super Kitties S3</button>
                    <button class="sub-btn" data-parent="panel-credits" data-target="credit-4">Unnanounced Projects</button>
                </div>
                
                <div id="credit-1" class="sub-content active">
                    <p><strong>Role:</strong> Game Engine Pipeline Developer</p>
                    <p><strong>Engine:</strong> Unreal Engine 5</p>
                    <p>Currently under development</p>
                    <p>
                        <iframe width="500" height="315"
                        src="https://www.youtube.com/embed/eprcoVEos6E?autoplay=1&mute=1"
                        style="justify-content: center; display: block; margin: 0 auto;">
                        </iframe>
                    </p>
                </div>
                <div id="credit-2" class="sub-content">
                    <p><strong>Role:</strong> Game Engine Pipeline Developer</p>
                    <p><strong>Engine:</strong> Unreal Engine 5</p>
                    <p>
                        <iframe width="500" height="315"
                        src="https://www.youtube.com/embed/mkEA_y_cQD4?autoplay=1&mute=1"
                        style="justify-content: center; display: block; margin: 0 auto;">
                        </iframe>
                    </p>
                </div>
                <div id="credit-3" class="sub-content">
                    <p><strong>Role:</strong> Game Engine Pipeline Developer</p>
                    <p><strong>Engine:</strong> Unreal Engine 5</p>
                    <p>
                        <iframe width="500" height="315"
                        src="https://www.youtube.com/embed/wfpB6ba8oA4?autoplay=1&mute=1"
                        style="justify-content: center; display: block; margin: 0 auto;">
                        </iframe>
                    </p>
                </div>
                <div id="credit-4" class="sub-content">
                    <p><strong>Role:</strong> Game Engine Pipeline Developer</p>
                    <p><strong>Engine:</strong> Unreal Engine 5</p>
                    <p>
                        Currently working on multiple Unnanounced Projects, with lots of Unreal Tools and Unreal NDAs!
                    </p>
                </div>
            </div>

            <div id="panel-projects" class="content-window">
                <h2>PERSONAL/SCHOOL PROJECTS</h2>
                <div class="sub-nav">
                    <button class="sub-btn active" data-parent="panel-projects" data-target="proj-1">Unworthy Roses</button>
                    <button class="sub-btn" data-parent="panel-projects" data-target="proj-2">A Game of Dragon</button>
                    <button class="sub-btn" data-parent="panel-projects" data-target="proj-3">Turn-Based JRPG Portfolio</button>
                </div>

                <div id="proj-1" class="sub-content active">
                    <p><strong>Unworthy Roses</strong></p>
                    <p>A 3D, Top-Down Perspective Online Co-op Action-Adventure game where you play as two Demon Huntresses in their journey into the Underworld!</p>
                </div>
                <div id="proj-2" class="sub-content">
                    <p><strong>A Game of Dragon</strong></p>
                    <p>A Third-Person, Casual Adventure game where you play as Barnon, a baby dragon in search of his older brothers. Explore The Island, face platform sections and solve puzzles in a real-time chill game!</p>
                </div>
                <div id="proj-3" class="sub-content">
                    <p><strong>Turn-Based JRPG Portfolio</strong></p>
                    <p>A portfolio page based on the classic turn-based JRPGs of the 2000s menus. Do you like it? Thanks for checking it out!</p>
                </div>
            </div>

            <div id="panel-contact" class="content-window">
                <h2>Contact Me</h2>
                <p>Feel free to reach out to me through any of the contact methods listed on the left panel!</p>
                <p>My Resume as of March 2026:</p>
                <p style="align-content: flex-end; align-items: center; display: flex; justify-content: center;">
                    <iframe src="docs/testResume.pdf" width="700px" height="400px" style="border: none;">
                    <p>Your browser does not support PDFs. <a href="docs/testResume.pdf">Download the PDF</a>.</p>
                    </iframe>
                </p>
            </div>
        </div>

        <div id="command-menu-container">
            <div class="menu-title">SELECT COMMAND TO CONTINUE:</div>
            <div class="combat-menu">
                <button class="menu-btn" data-target="panel-about">1. PROFESSIONAL EXPERIENCE</button>
                <button class="menu-btn" data-target="panel-credits">2. CREDITS</button>
                <button class="menu-btn" data-target="panel-projects">3. PROJECTS</button>
                <button class="menu-btn" data-target="panel-contact">4. CONTACT</button>
            </div>
        </div>

    </div>

    <script>
        // --- AUDIO SYSTEM ---
        let audioCtx;
        
        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        document.body.addEventListener('click', initAudio, { once: true });
        document.body.addEventListener('mouseover', initAudio, { once: true });
        document.body.addEventListener('touchstart', initAudio, { once: true }); // Added for mobile tap

        function playSound(type) {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'square'; 
            
            if (type === 'hover') {
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); 
                gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); 
                oscillator.stop(audioCtx.currentTime + 0.05); 
            } else if (type === 'click') {
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime); 
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); 
                oscillator.stop(audioCtx.currentTime + 0.1); 
            }

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
        }

        // --- MAIN MENU LOGIC ---
        const mainButtons = document.querySelectorAll('.menu-btn');
        const mainPanels = document.querySelectorAll('.content-window');

        mainButtons.forEach(button => {
            button.addEventListener('mouseenter', () => playSound('hover'));
            
            button.addEventListener('click', () => {
                playSound('click');
                
                mainButtons.forEach(btn => btn.classList.remove('active'));
                mainPanels.forEach(panel => panel.classList.remove('active'));

                button.classList.add('active');
                const targetId = button.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // --- SUB MENU (TABS) LOGIC ---
        const subButtons = document.querySelectorAll('.sub-btn');

        subButtons.forEach(button => {
            button.addEventListener('mouseenter', () => playSound('hover'));

            button.addEventListener('click', () => {
                playSound('click');
                
                const parentId = button.getAttribute('data-parent');
                const targetId = button.getAttribute('data-target');
                const parentPanel = document.getElementById(parentId);
                
                const localButtons = parentPanel.querySelectorAll('.sub-btn');
                const localContent = parentPanel.querySelectorAll('.sub-content');
                
                localButtons.forEach(btn => btn.classList.remove('active'));
                localContent.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });
    </script>
</body>
</html>
