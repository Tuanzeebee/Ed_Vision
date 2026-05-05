import asyncio
import edge_tts
import os
import asyncpg
from dotenv import load_dotenv

# Load DATABASE_URL từ .env
load_dotenv('ed_vision_backend/.env')
DB_URL = os.getenv('DATABASE_URL')
UPLOAD_DIR = 'ed_vision_backend/uploads/audio/passages'

# Cấu hình giọng đọc theo accent
VOICES = {
    'uk': 'en-GB-SoniaNeural',
    'us': 'en-US-GuyNeural',
    'au': 'en-AU-NatashaNeural'
}

async def generate_audio():
    if not DB_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    # asyncpg doesn't like ?schema=public in some cases
    clean_url = DB_URL.split('?')[0]
    conn = await asyncpg.connect(clean_url)
    
    # Ensure we use public schema
    await conn.execute("SET search_path TO public")
    rows = await conn.fetch("""
        SELECT id, content, accent_type 
        FROM ielts_passages 
        WHERE (audio_url IS NULL OR tts_generated = false)
        AND content IS NOT NULL
    """)

    if not rows:
        print("No passages need TTS.")
        await conn.close()
        return

    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    for row in rows:
        passage_id = row['id']
        content = row['content']
        accent = row['accent_type'] or 'us'
        voice = VOICES.get(accent, VOICES['us'])
        
        file_name = f"{passage_id}.mp3"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        audio_url = f"/audio/passages/{file_name}"

        print(f"Generating audio for {passage_id} (Voice: {voice})...")
        
        try:
            communicate = edge_tts.Communicate(content, voice)
            await communicate.save(file_path)

            # Update DB
            await conn.execute("""
                UPDATE ielts_passages 
                SET audio_url = $1, tts_generated = true 
                WHERE id = $2
            """, audio_url, passage_id)
            
            print(f"Success: {file_name}")
        except Exception as e:
            print(f"Failed {passage_id}: {e}")

    await conn.close()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(generate_audio())
