const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropzone');
const randomWebsiteButton = document.getElementById('randomWebsiteButton');
const lastModifiedTextElement = document.getElementById('lastModifiedText');
const lastModifiedTimeElement = document.getElementById('lastModifiedTime');
const websitesFoundTextElement = document.getElementById('websitesFoundText');
const websitesFoundNumberElement = document.getElementById(
    'websitesFoundNumber'
);
const searchBarWrapper = document.getElementById('searchBarWrapper');
const searchBarInput = document.getElementById('searchBarInput');
const searchResultElement = document.getElementById('searchResult');

const topResultAmnt = 5;
let forbiddenWords = ['nsfw', 'porn', 'hentai'];

let websites = new Array();
let nameOcr = new Object();

function getFileContents(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.readAsText(file);
    });
}

function removeDoubleSpaces(string) {
    string = string.replaceAll('  ', ' ');
    if (string.includes('  ')) return removeDoubleSpaces(string);
    return string;
}

function getIndicesOf(str, searchStr, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0,
        index,
        indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function openInNewTab(url) {
    window.open(url, '_blank').focus();
}

fileInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    console.log(files[0]);
    analyzeFile(files[0]);
});

async function analyzeFile(file) {
    let htmlStr = await getFileContents(file);

    htmlStr = htmlStr.replaceAll('\n', ' ');
    htmlStr = await removeDoubleSpaces(htmlStr);

    console.log(await getIndicesOf(htmlStr, '<DT> <H3'));

    let bdDom = htmlStr
        .split('<DT> <H3')
        .map((e) => '<H3' + e.replaceAll('<p>', ''));
    bdDom.shift();

    console.log(bdDom);

    websites = new Array();

    bdDom.forEach((bd_CB_html_str) => {
        let parser = new DOMParser();

        let bd_CB_DOM = parser.parseFromString(
            `<body>${bd_CB_html_str}</body>`,
            'text/html'
        );

        let bd_CB_type =
            bd_CB_DOM.body.children[0].getAttribute('ADD_DATE') != 0;

        console.log(
            `${bd_CB_type ? 'b' : 'c'}: ${
                bd_CB_DOM.body.children[0].innerHTML
            }`,
            bd_CB_DOM
        );

        if (bd_CB_type && bd_CB_DOM.body.children[1].children.length > 0) {
            Array.from(bd_CB_DOM.body.children[1].children).forEach((c) => {
                if (c.children[0]) {
                    websites.push({
                        orgName: bd_CB_DOM.body.children[0].innerHTML,
                        name: c.children[0].innerHTML,
                        url: c.children[0].href,
                    });
                }
            });
        }
    });

    console.log(websites);

    randomWebsiteButton.classList.remove('hidden');

    websites.forEach((website) => {
        website.name.split(' ').forEach((word) => {
            if (word.length < 4) return;
            if (nameOcr[word]) {
                return (nameOcr[word] = nameOcr[word] + 1);
            }
            return (nameOcr[word] = 1);
        });
    });

    let nameOcrArray = Object.keys(nameOcr)
        .map((w) => {
            return {
                w: w,
                c: nameOcr[w],
            };
        })
        .sort((a, b) => b.c - a.c);

    console.log(nameOcrArray);

    lastModifiedTextElement.classList.remove('hidden');

    websitesFoundTextElement.classList.remove('hidden');

    websitesFoundNumberElement.textContent = websites.length;

    lastModifiedTimeElement.textContent =
        file.lastModifiedDate.toLocaleString();

    searchBarWrapper.classList.remove('hidden');
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
});

dropZone.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const files = event.dataTransfer.files;
    console.log(files[0]);
    analyzeFile(files[0]);
});

function getRandomWebsiteUrl() {
    let randomWebsite = websites[Math.floor(Math.random() * websites.length)];
    for (w in forbiddenWords) {
        if (randomWebsite.name.includes(w)) return getRandomWebsite();
    }
    return randomWebsite.url;
}

randomWebsiteButton.addEventListener('click', () => {
    openInNewTab(getRandomWebsiteUrl());
});

searchBarInput.addEventListener('input', (e) => {
    if (searchBarInput.value.length > 0)
        searchResultElement.classList.remove('hidden');
    else searchResultElement.classList.add('hidden');
    const results = fuzzysort.go(searchBarInput.value, websites, {
        keys: ['name', 'url'],
    });
    console.log(results);
    searchResult.innerHTML = '';
    let resultAmnt =
        topResultAmnt < results.length ? topResultAmnt : results.length;
    outer: for (let i = 0; i < resultAmnt; i++) {
        liText = results[i].obj.name
            .replaceAll(/[\\?&]([^&=]+)=([^&=]+)/gi, '')
            .replaceAll('.html', '');
        for (const w of forbiddenWords) {
            if (liText.includes(w)) {
                resultAmnt++;
                continue outer;
            }
        }
        let li = document.createElement('li');
        let a = document.createElement('a');
        a.textContent = `${searchResultElement.children.length + 1}. ${liText}`;
        a.href = results[i].obj.url;
        a.classList.add('hover:text-stone-400');
        li.appendChild(a);
        searchResultElement.appendChild(li);
    }
});

// a key map of allowed keys
let allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    66: 'b',
};

// the 'official' Konami Code sequence
var konamiCode = [
    'up',
    'up',
    'down',
    'down',
    'left',
    'right',
    'left',
    'right',
    'b',
    'a',
];

// a variable to remember the 'position' the user has reached so far.
var konamiCodePosition = 0;

// add keydown event listener
document.addEventListener('keydown', function (e) {
    // get the value of the key code from the key map
    var key = allowedKeys[e.keyCode];
    // get the value of the required key from the konami code
    var requiredKey = konamiCode[konamiCodePosition];

    // compare the key with the required key
    if (key == requiredKey) {
        // move to the next key in the konami code sequence
        konamiCodePosition++;

        // if the last key is reached, activate cheats
        if (konamiCodePosition == konamiCode.length) {
            activateCheats();
            konamiCodePosition = 0;
        }
    } else {
        konamiCodePosition = 0;
    }
});

function activateCheats() {
    forbiddenWords = [];
    console.log('Allowing all words');
}
