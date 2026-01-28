export async function onRequestGet(context) {
  // Logic to fetch track metadata or a signed URL
  const trackId = new URL(context.request.url).searchParams.get("id");
  
  // If your audio files are hosted on your Binary Lane VPS
  const audioUrl = `https://mail.grounded-intimacy.com/audio/${trackId}.mp3`;

  return new Response(JSON.stringify({
    title: "Session Track 01",
    url: audioUrl,
    artist: "Skye"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}