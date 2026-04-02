-- Update recognition questions with the new emotional images
-- R1 - Alegría/Joy (woman laughing)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R1-Kes3NRmoAQOJj2yFq3pMT6NPYkot0c.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 1;

-- R2 - Enfado/Anger (man with fist on chin, angry)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R2-AixLrttm7iaHBQRSBL1dLp6iZUFVtH.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 2;

-- R3 - Sorpresa/Surprise (woman with hand over mouth, surprised)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R3-bqYg3M31NwNMr5lLoNQV26sBVSEbN7.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 3;

-- R4 - Tristeza/Sadness (older man with hands clasped, sad)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R4-y3Bdf6gqtOWgNGoWB2GDCKjrY7P5Ny.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 4;

-- R5 - Duda/Skepticism (woman looking doubtful)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R5-USS4HJv7r0n80eIiM6Z5LpTkD1md9m.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 5;

-- R6 - Miedo/Fear (older man with hand on throat, fearful)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R6-rHHdOSJSJtd9tWoBczaBkZBSXZDfcQ.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 6;

-- R7 - Satisfacción/Contentment (man with slight smirk)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R7-FtsJCBBTtBwk3W6SRzUDIhldkNA6sq.png',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 7;

-- R8 - Calma/Calm (woman with hand on cheek, pensive)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R8.png-L8Ji5hnPGawjYlkzhOZjU1ZujnEILl.jpeg',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 8;

-- R9 - Preocupación/Worry (man with hand on head, stressed)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R9.png-m5IuwT3qCdvZW2dwAKIeI4yxXctZ84.jpeg',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 9;

-- R10 - Melancolía/Melancholy (blonde woman looking sad)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R10.png-8UaQnfMIGXFdt64Rtk0t2GJZ4NxfDy.jpeg',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 10;

-- R11 - Felicidad/Happiness (man smiling happily)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R11.png-dlt9gLU2tlFjfp1Lq40wWx0km0awIk.jpeg',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 11;

-- R12 - Frustración/Frustration (woman with hand on temple)
UPDATE assessment_questions 
SET media_url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R12.png-QKuShcUqr5eIKyqj8vBFF0w7IgpIfM.jpeg',
    media_type = 'image'
WHERE domain = 'recognition' AND question_order = 12;
