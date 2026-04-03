import { GoogleGenAI } from "@google/genai"

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

export async function POST(req: Request) {
  try {
    const { emotion, quadrant, company, bodySignals, timeReference, contextText } = await req.json()

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
    const sceneElements: string[] = []
    
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

    const prompt = `Artistic minimalist illustration representing the emotion "${emotion}". 
Style: Modern, clean line art with ${colorPalette}. 
Atmosphere: ${timeOfDay}.
Scene elements: ${sceneElements.length > 0 ? sceneElements.join(", ") : "abstract emotional representation"}.
Calming, introspective, wellness app style.
No text. Simple, elegant composition with white space.`

    // Use Imagen 3 for image generation
    const response = await genAI.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
      },
    })

    // Extract image from response
    const image = response.generatedImages?.[0]
    
    if (image?.image?.imageBytes) {
      return Response.json({ 
        success: true,
        imageUrl: `data:image/png;base64,${image.image.imageBytes}`,
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
