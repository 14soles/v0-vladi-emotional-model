import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { emotion, quadrant, company, bodySignals, timeReference, contextText, photoUrl } = await req.json()

    // Build a descriptive prompt for image generation
    const timeOfDay = timeReference?.toLowerCase().includes("mañana") 
      ? "morning light" 
      : timeReference?.toLowerCase().includes("tarde") 
        ? "afternoon golden hour" 
        : timeReference?.toLowerCase().includes("noche") 
          ? "evening/night atmosphere" 
          : "soft natural light"

    const emotionColors: Record<string, string> = {
      green: "calm greens and soft blues",
      yellow: "warm yellows and oranges",
      red: "intense reds and warm tones",
      blue: "cool blues and muted tones",
    }

    const colorPalette = emotionColors[quadrant] || "soft pastel colors"

    // Create a scene description based on context
    let sceneElements: string[] = []
    
    if (company) {
      if (company.toLowerCase().includes("solo") || company.toLowerCase().includes("nadie")) {
        sceneElements.push("a single figure in a peaceful solitary moment")
      } else if (company.toLowerCase().includes("familia")) {
        sceneElements.push("warm family gathering silhouettes")
      } else if (company.toLowerCase().includes("amigos")) {
        sceneElements.push("friendly group of people together")
      } else if (company.toLowerCase().includes("pareja")) {
        sceneElements.push("two people in an intimate moment")
      } else {
        sceneElements.push(`people representing ${company}`)
      }
    }

    if (bodySignals && bodySignals.length > 0) {
      const bodyParts = bodySignals.join(", ")
      sceneElements.push(`subtle visual elements suggesting physical sensation in ${bodyParts}`)
    }

    if (contextText) {
      sceneElements.push(`scene reflecting: ${contextText.substring(0, 100)}`)
    }

    const prompt = `Create a minimalist, artistic illustration representing the emotion "${emotion}". 
Style: Modern, clean line art with ${colorPalette}. 
Atmosphere: ${timeOfDay}.
Scene elements: ${sceneElements.length > 0 ? sceneElements.join(", ") : "abstract emotional representation"}.
The image should be calming, introspective, and suitable for a wellness/emotional tracking app.
No text in the image. Simple, elegant composition with plenty of white space.
${photoUrl ? "Reference mood/style from uploaded photo." : ""}
Square format, centered composition.`

    // Use Gemini's image generation model via AI Gateway
    const result = await generateText({
      model: "google/gemini-2.0-flash-exp-image-generation",
      providerOptions: {
        google: {
          responseModalities: ["image", "text"],
        },
      },
      prompt,
    })

    // Extract image from response
    const imageFile = result.files?.[0]
    
    if (imageFile && imageFile.base64) {
      return Response.json({ 
        success: true,
        imageUrl: `data:${imageFile.mimeType};base64,${imageFile.base64}`,
      })
    }

    // Fallback: return null if no image generated
    return Response.json({ 
      success: false,
      error: "No image generated",
    })

  } catch (error) {
    console.error("Error generating emotion image:", error)
    return Response.json({ 
      success: false,
      error: "Failed to generate image",
    }, { status: 500 })
  }
}
