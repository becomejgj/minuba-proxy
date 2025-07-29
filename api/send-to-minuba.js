// Denne funktion håndterer indgående anmodninger
export default async function handler(request, response) {
  // 1. Vi tillader kun POST-anmodninger. Afvis alt andet.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Kun POST-requests er tilladt' });
  }

  // 2. Vi håndterer CORS-headers, så Squarespace må "tale" med vores funktion
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*'); // For produktion, skift '*' ud med din Squarespace URL, f.eks. https://www.stuboggren.dk
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Hvis det er en preflight-request (OPTIONS), sender vi bare OK tilbage
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 3. Hent den hemmelige API-nøgle sikkert fra serverens miljøvariabler
    const minubaToken = process.env.MINUBA_API_TOKEN;
    if (!minubaToken) {
      throw new Error("Minuba API token er ikke konfigureret på serveren.");
    }
    
    // 4. Hent data fra Squarespace-formularen
    const formData = request.body;

    // 5. Forbered data, der skal sendes til Minuba
    const dataToPost = {
      clientName: formData.navn,
      Email: formData.email,
      Phone: formData.telefon,
      Address: formData.adresse,
      Postcode: formData.postnummer,
      City: formData.by,
      Description: formData.besked,
      orderName: "Ny forespørgsel fra hjemmesiden",
      orderCategory: "3521D4C5-403B-40FC-9D25-95BDBB646469", // Denne kode er fra din PHP-fil
      token: minubaToken
    };

    // 6. Send data til Minuba's API
    const minubaResponse = await fetch("https://app.minuba.dk/?op=api.create.ProposalDraft", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(dataToPost)
    });

    // 7. Håndter svar fra Minuba
    if (!minubaResponse.ok) {
      // Hvis Minuba svarer med en fejl, send fejlen videre
      const errorData = await minubaResponse.text();
      console.error("Fejl fra Minuba:", errorData);
      throw new Error(`Minuba API returnerede en fejl: ${minubaResponse.statusText}`);
    }

    // 8. Send et succes-svar tilbage til Squarespace-formularen
    return response.status(200).json({ message: 'Forespørgsel sendt succesfuldt!' });

  } catch (error) {
    // 9. Hvis noget går galt, send en generel fejlmeddelelse
    console.error("Intern fejl i funktionen:", error);
    return response.status(500).json({ message: 'Der opstod en fejl på serveren.' });
  }
}