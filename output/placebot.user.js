// ==UserScript==
// @name         r/placeBR Zinnsoldat
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Einer von uns!
// @author       placeDE Devs
// @match        https://*.reddit.com/r/place/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @updateURL    https://github.com/PlaceDE-Official/zinnsoldat/raw/main/output/placebot.user.js
// @downloadURL  https://github.com/PlaceDE-Official/zinnsoldat/raw/main/output/placebot.user.js
// ==/UserScript==
(async () => {
    // Constantes para usar por aí
    const botVersion = "0.1";
    const botName = "14-Bis";
    const urlTemplateJson = "https://raw.githubusercontent.com/PakuPacu/json-r-place-brazil/main/brasil.json";
    const urlBotInfo = "https://raw.githubusercontent.com/gastk/placeBR-14bis/main/output/jsons/botInfo.json";


    // Check for correct page
    if (!window.location.href.startsWith('https://www.reddit.com/r/place/') && !window.location.href.startsWith('https://new.reddit.com/r/place/'))
        return;

    // Check for marker; only load the script once!
    if (document.head.querySelector('meta[name="zinnsoldat"]')) {
        console.warn('Script already loaded!');
        return;
    }
    const marker = document.createElement('meta');
    marker.setAttribute('name', 'zinnsoldat');
    document.head.appendChild(marker);

    const zs_style = document.createElement('style');
    zs_style.innerHTML = `
        .zs-hidden {
            display: none;
        }
        .zs-pixeled {
            border: 3px solid #000000;
            box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.75);
            font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol',sans-serif;
            font-weight: 600;
        }
        .zs-button {
            position: fixed;
            width: 142px;
            height: 46px;
            bottom: 15px;
            left: 15px;
            z-index: 100;
            color: #fff;
        }
        .zs-startbutton {
            background: linear-gradient(-90deg, #C03400 var(--zs_timeout), #FF4500 var(--zs_timeout));
        }
        .zs-startbutton:hover {
            background: linear-gradient(-90deg, #802300 var(--zs_timeout), #E03D00 var(--zs_timeout));
        }
        .zs-stopbutton {
            background: linear-gradient(-90deg, #007B4E var(--zs_timeout), #00A368 var(--zs_timeout));
        }
        .zs-stopbutton:hover {
            background: linear-gradient(-90deg, #005234 var(--zs_timeout), #008F5B var(--zs_timeout));
        }
    `;
    document.head.appendChild(zs_style);

    let bis_running = false;
    let placeTimeout;
    let canvasFound = false;

    const zs_version = "0.4";
    const zs_startButton = document.createElement('button');
    zs_startButton.innerText = `${botName} v${zs_version}`;
    zs_startButton.classList.add('zs-pixeled', 'zs-button', 'zs-stopbutton');
    zs_startButton.style.setProperty('--zs_timeout', '100%');
    document.body.appendChild(zs_startButton);

    // Load Toastify
    await new Promise((resolve, reject) => {
        var toastifyStyle = document.createElement('link');
        toastifyStyle.type = "text/css";
        toastifyStyle.rel = "stylesheet";
        toastifyStyle.media = "screen";
        toastifyStyle.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
        document.head.appendChild(toastifyStyle);
        var toastifyScript = document.createElement('script');
        toastifyScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/toastify-js');
        toastifyScript.setAttribute('async', false);
        document.body.appendChild(toastifyScript);
        toastifyScript.addEventListener('load', (ev) => {
            resolve({ status: true });
        });
        toastifyScript.addEventListener('error', (ev) => {
            reject({ status: false, message: `Failed to load the toastify` });
        });
    });
    const zs_info = (msg) => {
        Toastify({
            text: msg,
            duration: 5000,
            gravity: 'bottom',
            position: 'right',
            stopOnFocus: true,
            className: 'zs-pixeled',
            style: {
                background: '#383838',
                color: '#fff',
                'box-shadow': '8px 8px 0px rgba(0, 0, 0, 0.75)',
            },
        }).showToast();
    }
    const zs_warn = (msg) => {
        Toastify({
            text: msg,
            duration: 5000,
            gravity: 'bottom',
            position: 'right',
            stopOnFocus: true,
            className: 'zs-pixeled',
            style: {
                background: '#FFA800',
                color: '#000',
                'box-shadow': '8px 8px 0px rgba(0, 0, 0, 0.75)',
            },
        }).showToast();
    }
    const zs_error = (msg) => {
        Toastify({
            text: msg,
            duration: 5000,
            gravity: 'bottom',
            position: 'right',
            stopOnFocus: true,
            className: 'zs-pixeled',
            style: {
                background: '#d93a00',
                color: '#fff',
                'box-shadow': '8px 8px 0px rgba(0, 0, 0, 0.75)',
            },
        }).showToast();
    }
    const zs_success = (msg) => {
        Toastify({
            text: msg,
            duration: 5000,
            gravity: 'bottom',
            position: 'right',
            stopOnFocus: true,
            className: 'zs-pixeled',
            style: {
                background: '#00A368',
                color: '#fff',
                'box-shadow': '8px 8px 0px rgba(0, 0, 0, 0.75)',
            },
        }).showToast();
    }
    const zs_updateNotification = () => {
        Toastify({
            text: `Nova versão do ${botName} disponível em: https://place.army/`,
            destination: 'https://place.army/',
            duration: -1,
            gravity: 'bottom',
            position: 'right',
            stopOnFocus: true,
            className: 'zs-pixeled',
            style: {
                background: '#3690EA',
                color: '#fff',
                'box-shadow': '8px 8px 0px rgba(0, 0, 0, 0.75)',
            },
        }).showToast();
    }

    zs_info('Bora voar!');

    // Override setTimeout to allow getting the time left
    const _setTimeout = setTimeout; 
    const _clearTimeout = clearTimeout; 
    const zs_allTimeouts = {};
    
    setTimeout = (callback, delay) => {
        let id = _setTimeout(callback, delay);
        zs_allTimeouts[id] = Date.now() + delay;
        return id;
    };

    clearTimeout = (id) => {
        _clearTimeout(id);
        zs_allTimeouts[id] = undefined;
    }
    
    const getTimeout = (id) => {
        if (zs_allTimeouts[id]) {
            return Math.max(
                zs_allTimeouts[id] - Date.now(),
                0 // Make sure we get no negative values for timeouts that are already done
            )
        }

        return NaN;
    }

    setInterval(() => {
        let theTimeout = getTimeout(placeTimeout)
        if (Number.isNaN(theTimeout)) {
            theTimeout = 0;
        }

        // Update the percentage
        const maxTimeout = 300000; // 5min
        const percentage = 100 - Math.min(Math.max(Math.round((theTimeout/maxTimeout) * 100), 0), 100)
        zs_startButton.style.setProperty("--zs_timeout", `${percentage}%`)
    }, 1)

    // Retrieve access token
    const zs_getAccessToken = async () => {
        const usingOldReddit = window.location.href.includes('new.reddit.com');
        const url = usingOldReddit ? 'https://new.reddit.com/r/place/' : 'https://www.reddit.com/r/place/';
        const response = await fetch(url);
        const responseText = await response.text();
    
        return responseText.match(/"accessToken":"(\\"|[^"]*)"/)[1];
    }
    zs_info('Solicitando autorização do Reddit...');
    let zs_accessToken = await zs_getAccessToken();
    zs_success('Acesso autorizado!');

    const zs_getCanvasId = (x, y) => {
        if (y < 0 && x < -500) {
            return 0
        } else if (y < 0 && x < 500 && x >= -500) {
            return 1;
        } else if (y < 0 && x >= 500) {
            return 2;
        } else if (y >= 0 && x < -500) {
            return 3;
        } else if (y >= 0 && x < 500 && x >= -500) {
            return 4;
        } else if (y >= 0 && x >= 500) {
            return 5;
        }
        console.error('Unknown canvas!');
        return 0;
    }

    const zs_getCanvasX = (x, y) => {
        return Math.abs((x + 500) % 1000);
    }

    const zs_getCanvasY = (x, y) => {
        return zs_getCanvasId(x, y) < 3 ? y + 1000 : y;
    }

    async function zs_placePixel(x, y, color) {
        console.log('Tentando adicionar um pixel: %s, %s in %s', x, y, color);
        const response = await fetch('https://gql-realtime-2.reddit.com/query', {
            method: 'POST',
            body: JSON.stringify({
                'operationName': 'setPixel',
                'variables': {
                    'input': {
                        'actionName': 'r/replace:set_pixel',
                        'PixelMessageData': {
                            'coordinate': {
                                'x': zs_getCanvasX(x, y),
                                'y': zs_getCanvasY(x, y)
                            },
                            'colorIndex': color,
                            'canvasIndex': zs_getCanvasId(x, y)
                        }
                    }
                },
                'query': `mutation setPixel($input: ActInput!) {
                    act(input: $input) {
                        data {
                            ... on BasicMessage {
                                id
                                data {
                                    ... on GetUserCooldownResponseMessageData {
                                        nextAvailablePixelTimestamp
                                        __typename
                                    }
                                    ... on SetPixelResponseMessageData {
                                        timestamp
                                        __typename
                                    }
                                    __typename
                                }
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                }
                `
            }),
            headers: {
                'origin': 'https://garlic-bread.reddit.com',
                'referer': 'https://garlic-bread.reddit.com/',
                'apollographql-client-name': 'garlic-bread',
                'Authorization': `Bearer ${zs_accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json()
        if (data.errors !== undefined) {
            if (data.errors[0].message === 'Ratelimited') {
                console.log('Could not place pixel at %s, %s in %s - Ratelimit', x, y, color);
                zs_warn('O tempo de espera ainda não acabou!');
                return data.errors[0].extensions?.nextAvailablePixelTs;
            }
            console.log('Could not place pixel at %s, %s in %s - Response error', x, y, color);
            console.error(data.errors);
            zs_error('Erro ao adicionar um pixel');
            return null;
        }
        console.log('Did place pixel at %s, %s in %s', x, y, color);
        zs_success(`Pixel (${x}, ${y}) adicionado!`);
        return data?.data?.act?.data?.[0]?.data?.nextAvailablePixelTimestamp;
    }

    // const zs_initCarpetbomberConnection = () => {
    //     c2 = new WebSocket("wss://carpetbomber.place.army");

    //     c2.onopen = () => {
    //         zs_initialized = true;
    //         zs_info(`Conectando-se a "${serverName.toLowerCase()}"...`);
    //         c2.send(JSON.stringify({ type: "Handshake", version: zs_version }));
    //         zs_requestJob();
    //         setInterval(() => c2.send(JSON.stringify({ type: "Wakeup"})), 40*1000);
    //     }
        
    //     c2.onerror = (error) => {
    //         zs_error(`A conexão com a ${serverName.toLowerCase()} falhou! Tentando novamente em 5s`);
    //         console.error(error);
    //         setTimeout(zs_initCarpetbomberConnection, 5000);
    //     }

    //     c2.onmessage = (event) => {
    //         data = JSON.parse(event.data)
    //         // console.log('received: %s', JSON.stringify(data));

    //         if (data.type === 'UpdateVersion') {
    //             zs_success('Atualizado com sucesso');
    //             if (data.version > zs_version) {
    //                 zs_updateNotification();
    //             }
    //         } else if (data.type == "Jobs") {
    //             zs_processJobResponse(data.jobs);
    //         }
    //     }
    // }
    
    // zs_initCarpetbomberConnection();

    zs_startButton.onclick = async () => {
        if (bis_running) {
            bis_PararBot();
        } else {
            await bis_IniciarBot();
        }
    }








    //------- Códigos novos

    // Variáveis:
    let objJsonTemplates; // Json com os templates
    let canvaContext;

    const _listaCores = [
        { cor: undefined, id: 1 },  // dark red
        { cor: "FF4500", id: 2 },  // red
        { cor: "FFA800", id: 3 },  // orange
        { cor: "FFD635", id: 4 },  // yellow
        { cor: undefined, id: 5 },  // pale yellow
        { cor: "00A368", id: 6 },  // dark green
        { cor: undefined, id: 7 },  // green
        { cor: "7EED56", id: 8 },  // light green
        { cor: undefined, id: 9 },  // dark teal
        { cor: undefined, id: 10 }, // teal
        { cor: undefined, id: 11 }, // light teal
        { cor: "2450A4", id: 12 }, // dark blue
        { cor: "3690EA", id: 13 }, // blue
        { cor: "51E9F4", id: 14 }, // light blue
        { cor: undefined, id: 15 }, // indigo
        { cor: undefined, id: 16 }, // periwinkle
        { cor: undefined, id: 17 }, // lavender
        { cor: "811E9F", id: 18 }, // dark purple
        { cor: "B44AC0", id: 19 }, // purple
        { cor: undefined, id: 20 }, // pale purple
        { cor: undefined, id: 21 }, // magenta
        { cor: undefined, id: 22 }, // pink
        { cor: "FF99AA", id: 23 }, // light pink
        { cor: undefined, id: 24 }, // dark brown
        { cor: "9C6926", id: 25 }, // brown
        { cor: undefined, id: 26 }, // beige
        { cor: "000000", id: 27 }, // black
        { cor: undefined, id: 28 }, // dark gray
        { cor: "898D90", id: 29 }, // gray
        { cor: "D4D7D9", id: 30 }, // light gray
        { cor: "E9EBED", id: 31 }, // white
    ];      
      
    const sleep = ms => new Promise(res => setTimeout(res, ms));

    async function GetJson(url) {
        try
        {
            const response = await fetch(url);
            if (!response?.ok) 
                throw new Error("Falha ao obter o JSON");
            else
                return response.json();
        }
        catch
        {
            // Se der erro não faz nada porque to com preguiça. Nem sei se isso funciona KKKKK
            throw new Error("Falha ao obter o JSON");
        }
    }

    async function CarregarAsCoisasBasicas() {
        try
        {
            const objBotInfo = await GetJson(urlBotInfo);
            if (objBotInfo.versaoHabilitada != botVersion)
                throw new Error("Versão incompatível. Atualize a versão do bot!");
    
            objJsonTemplates = await GetJson(urlTemplateJson);
            ChecaSeObjetoValido(objJsonTemplates);
    
            const encontrado = objJsonTemplates.templates[0];
            encontrado.imagemBitmap = await ObterImagemBitmapUrl(encontrado.sources[0]);
    
            return;
        }
        catch (error)
        {
            zs_error("Erro:", error)
        }
    }

    function ChecaSeObjetoValido(obj) {
        if (!obj?.templates)
            throw new Error("Falha ao carregar o template");
        else if (!Array.isArray(obj.templates) || obj.templates.length == 0 || obj.templates.length > 1)
            throw new Error("Falha ao carregar o template: Nenhum template ou muitas templates (ainda não suportados)");
        else if (!Array.isArray(obj.templates[0].sources) || obj.templates[0].sources.length == 0 || obj.templates[0].sources.length > 1)
            throw new Error("Falha ao carregar o template: Nenhuma fonte ou muitas fontes (ainda não suportados)");
        else if (!obj.templates[0]?.x)
            throw new Error("Falha ao carregar o template");
        else if (!obj.templates[0]?.y)
            throw new Error("Falha ao carregar o template");
    }

    async function ObterImagemBitmapUrl(url) {
        try {
            return await BaixarImagemUrl(url);
        } catch (error) {
            throw new Error('Erro:', error);
        }
    }

    //#region Funções da imagem do template

    async function BaixarImagemUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok)
                return null;
        
            // Converte a resposta para um blob e, em seguida, cria um ImageBitmap
            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);
        
            return imageBitmap;
        } catch (error) {
            throw new Error('Erro ao carregar a imagem:', error);
        }
    }

    function ObterPixelAleatorioImagem(imageBitmap) {
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0);
      
        // Gerar coordenadas X e Y aleatórias dentro dos limites da imagem
        const randomX = Math.floor(Math.random() * imageBitmap.width);
        const randomY = Math.floor(Math.random() * imageBitmap.height);
      
        // Obter o objeto de dados da imagem e, em seguida, a cor do pixel nas coordenadas aleatórias
        const pixelData = ctx.getImageData(randomX, randomY, 1, 1).data;
        const [r, g, b, a] = pixelData;
        const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
      
        return {
          x: randomX,
          y: randomY,
          color: hex,
        };
    }

    async function PegarPixelParaPintar(objTemplate) {
        try
        {
            let pixel = undefined;
            let tentativas = 0;
            while (pixel === undefined) {
                if (tentativas > 50) {
                    pixel = null;
                }
                else
                {
                    tentativas++;
                    const objPixel = ObterPixelAleatorioImagem(objTemplate.imagemBitmap);
                    objPixel.x += objTemplate.x;
                    objPixel.y += objTemplate.y;

                    const podePintar = await ChecaSePodePintarCanvas(objPixel);
                    if (podePintar) {
                        const corReddit = ConverteCorParaReddit(objPixel.cor);
                        objPixel.cor = corReddit;

                        pixel = objPixel;
                    }
                }
            }

            return pixel;
        }
        catch (error)
        {
            return { "x": null, "y": null, "cor": null};
        }
    }

    async function ChecaSePodePintarCanvas(objPixel) {
        while (document.readyState !== 'complete') {
            console.log("Template manager sleeping for 1 second because document isn't ready yet.");
            await sleep(1000);
        }

        let tentativas = 0;
        let tentativasMaximas = 50;
        while (canvaContext == undefined) {
            await sleep(1000);
            tentativas++;
            if (tentativas > tentativasMaximas) {
                canvaContext = null;
                return;
            }
            
            findElementOfType(document.documentElement, HTMLCanvasElement);
        }
        const pixelCanvaData = canvaContext.getImageData(objPixel.x, objPixel.y, 1, 1).data;
        const [r, g, b, a] = pixelCanvaData;
        const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');

        return objPixel.cor.toUpperCase() == hex.toUpperCase();
    }

    function ConverteCorParaReddit(cor) {
        const corReddit = _listaCores.find(e => e.cor == cor);

        if (corReddit)
            return corReddit.id;
        else
            throw new Error("Cor não identificada");
    }

    //#endregion Funções da imagem do template

    function findElementOfType(element, type) {
        let rv = [];
        if (element instanceof type || (element?.innerHtml && element.innerHTML.includes('</canvas>'))) {
            console.log('found canvas', element, window.location.href);
            rv.push(element);
            canvaContext = element.getContext('2d');
        }
        // find in Shadow DOM elements
        if (element instanceof HTMLElement && element.shadowRoot) {
            rv.push(...findElementOfType(element.shadowRoot, type));
        }
        // find in children
        for (let c = 0; c < element.children.length; c++) {
            rv.push(...findElementOfType(element.children[c], type));
        }
        return rv;
    }

    async function ExecutarBot(objTemplate) {
        if (!objTemplate || objTemplate === {}) {
            zs_warn('Nenhum template disponível. Tente novamente em 60s');
            clearTimeout(placeTimeout);
            placeTimeout = setTimeout(async () => {
                await bis_IniciarBot();
            }, 60000);
            return;
        }

        const pixel = await PegarPixelParaPintar(objTemplate.templates[0]); // Retorna {x, y, cor}

        if (!pixel?.cor) {
            zs_error('Falha ao pegar a cor do pixel');
            clearTimeout(placeTimeout);
            placeTimeout = setTimeout(async () => {
                await bis_IniciarBot();
            }, 20000);
            return;
        }

        // Execute job
        const ret = await zs_placePixel(pixel.x, pixel.y, pixel.cor - 1)

        clearTimeout(placeTimeout);
        placeTimeout = setTimeout(async () => {
            await bis_IniciarBot();
        }, Math.max(20000, (ret || 5*60*1000) + 2000 - Date.now()));
    }

    async function bis_IniciarBot() {
        debugger;

        try
        {
            if (bis_running)
                return false;

            bis_running = true;
            zs_startButton.classList.remove('zs-startbutton');
            zs_startButton.classList.add('zs-stopbutton');
            await sleep(5000);

            await CarregarAsCoisasBasicas();
            await ExecutarBot(objJsonTemplates);
            bis_running = false;
        }
        catch (error)
        {
            bis_running = false;
            console.error(`${botName} bot error:`, error);
            zs_error("Erro desconhecido na execução do bot. Tentando novamente em 20 segundos.")
            clearTimeout(placeTimeout);
            placeTimeout = setTimeout(async () => {
                await bis_IniciarBot();
            }, 20000);
        }
    }

    const bis_PararBot = () => {
        bis_running = false;
        clearTimeout(placeTimeout);
        zs_startButton.classList.remove('zs-stopbutton');
        zs_startButton.classList.add('zs-startbutton');
    }


    // Execuções:
    zs_info("Iniciando bot...");
    await bis_IniciarBot();

})();
