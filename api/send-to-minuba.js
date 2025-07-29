// Denne funktion håndterer indgående anmodninger
export default async function handler(request, response) {
  // ===================================================================
  // START PÅ CORS-LØSNING (DEN OPDATEREDE DEL)
  // ===================================================================
  // Vi fortæller serveren, at kun din specifikke hjemmeside må tale med den.
  response.setHeader('Access-Control-Allow-Origin', 'https://www.stuboggren.dk');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Credentials', true);

  // Når browseren sender sin "spørge-anmodning" (OPTIONS), svarer vi "OK, det er i orden".
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  // ===================================================================
  // SLUT PÅ CORS-LØSNING
  // ===================================================================


  // Sørg for at afvise alt andet end POST-requests for en sikkerheds skyld
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Kun POST-requests er tilladt' });
  }

  try {
    // Hent den hemmelige API-nøgle sikkert fra serverens miljøvariabler
    const minubaToken = process.env.MINUBA_API_TOKEN;
    if (!minubaToken) {
      throw new Error("Minuba API token er ikke konfigureret på serveren.");
    }
    
    // Hent data fra Squarespace-formularen
    const formData = request.body;

    // Forbered data, der skal sendes til Minuba
    const dataToPost = {
      clientName: formData.navn,
      Email: formData.email,
      Phone: formData.telefon,
      Address: formData.adresse,
      Postcode: formData.postnummer,
      City: formData.by,
      Description: formData.besked,
      orderName: "Ny forespørgsel fra hjemmesiden",
      orderCategory: "3521D4C5-403B-40FC-9D25-95BDBB646469",
      token: minubaToken
    };

    // Send data til Minuba's API
    const minubaResponse = await fetch("https://app.minuba.dk/?op=api.create.ProposalDraft", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(dataToPost)
    });

    // Håndter svar fra Minuba
    if (!minubaResponse.ok) {
      const errorData = await minubaResponse.text();
      console.error("Fejl fra Minuba:", errorData);
      throw new Error(`Minuba API returnerede en fejl: ${minubaResponse.statusText}`);
    }

    // Send et succes-svar tilbage til Squarespace-formularen
    return response.status(200).json({ message: 'Forespørgsel sendt succesfuldt!' });

  } catch (error) {
    console.error("Intern fejl i funktionen:", error);
    return response.status(500).json({ message: 'Der opstod en fejl på serveren.' });
  }
}