// Globale Variablen, damit wir wissen wo wir sind
let config = {}; 
let currentCountry = null;

// 1. Beim Start: Konfiguration laden und URL prüfen
window.onload = async function() {
    try {
        const response = await fetch('config.json');
        if(!response.ok) throw new Error("config.json nicht gefunden");
        config = await response.json();
        
        // URL Parameter auslesen (z.B. ?account=Flight2Beach_DE)
        const params = new URLSearchParams(window.location.search);
        const accountId = params.get('account');
        const countryCode = params.get('country');

        if (accountId) {
            loadAccount(accountId);
        } else if (countryCode) {
            loadCountryView(countryCode);
        } else {
            loadWorldView();
        }
    } catch (error) {
        document.getElementById('content-area').innerHTML = `<p style="color:red">Fehler: ${error.message}</p>`;
    }
};

// 2. Ansicht: Alle Länder (Welt-Ebene)
function loadWorldView() {
    updateUI("Wähle dein Land", null, false);
    
    const container = document.getElementById('content-area');
    container.innerHTML = "";

    // Gehe durch alle Länder in der config
    for (const [code, data] of Object.entries(config)) {
        const div = document.createElement('div');
        div.className = 'link-item account-card';
        div.innerHTML = `<h3>${data.flag} ${data.name}</h3>`;
        div.onclick = () => loadCountryView(code);
        container.appendChild(div);
    }
}

// 3. Ansicht: Ein Land (z.B. Deutschland Übersicht)
function loadCountryView(countryCode) {
    if (!config[countryCode]) return loadWorldView(); // Fallback falls Code falsch
    
    currentCountry = countryCode;
    const countryData = config[countryCode];
    
    updateUI(`${countryData.flag} Accounts in ${countryData.name}`, countryCode, false);

    const container = document.getElementById('content-area');
    container.innerHTML = "";

    // Liste alle Accounts dieses Landes auf
    countryData.accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'link-item account-card';
        div.innerHTML = `<h3>✈️ ${acc.name}</h3>`;
        // Beim Klick laden wir die spezifische JSON Datei
        div.onclick = () => loadAccount(acc.id); 
        container.appendChild(div);
    });
}

// 4. Ansicht: Die Flüge (Endstation)
async function loadAccount(accountId) {
    // Versuchen herauszufinden zu welchem Land der Account gehört (für den Zurück-Button)
    let foundCountry = null;
    let accountName = accountId;
    
    // Suche den Account in der Config
    for (const [code, data] of Object.entries(config)) {
        const match = data.accounts.find(a => a.id === accountId);
        if (match) {
            foundCountry = code;
            accountName = match.name;
            break;
        }
    }

    currentCountry = foundCountry;
    updateUI(accountName, currentCountry, true);

    const container = document.getElementById('content-area');
    container.innerHTML = "<p>Lade Flüge...</p>";

    try {
        // HIER WIRD DIE JSON DATEI GELADEN
        // WICHTIG: Die Datei muss in einem Ordner 'data' liegen und genau so heißen wie die ID
        const response = await fetch(`data/${accountId}.json`);
        
        if (!response.ok) throw new Error("Keine Flüge gefunden (Datei fehlt).");
        
        const flights = await response.json();
        
        container.innerHTML = ""; // Ladeanzeige löschen
        
        if(flights.length === 0) {
            container.innerHTML = "<p>Aktuell keine Flüge verfügbar.</p>";
            return;
        }

        flights.forEach(flight => {
            const div = document.createElement('div');
            div.className = 'link-item';
            div.innerHTML = `
                <a href="${flight.url}" target="_blank" class="flight-link">${flight.name}</a>
                <span class="date-badge">📅 ${flight.date || 'Bald'}</span>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        container.innerHTML = `<p>Ups! ${error.message}</p>`;
    }
}

// Hilfsfunktion: Setzt Titel und Buttons
function updateUI(title, countryCode, isAccountView) {
    document.getElementById('page-title').innerText = title;
    
    // Buttons steuern
    const btnWorld = document.getElementById('btn-world');
    const btnCountry = document.getElementById('btn-country');
    
    // ÄNDERUNG: Button nur anzeigen, wenn ein Land gewählt ist, aber KEINE Flugliste offen ist
    if (countryCode && !isAccountView) {
         btnWorld.style.display = 'inline-block';
    } else {
         btnWorld.style.display = 'none';
    }

    // Zurück zum Land Button nur wenn wir im Account sind UND ein Land kennen
    if (isAccountView && countryCode) {
        btnCountry.style.display = 'inline-block';
        btnCountry.innerText = `🔙 Alle Flüge aus Deutschland`;
    } else {
        btnCountry.style.display = 'none';
    }
}
