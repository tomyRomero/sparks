import OpenAI from "openai";

const openai = new OpenAI();

async function getImage(getPrompt: string) {
  try {
    console.log("Prompt in DALL-E API: ", getPrompt)
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: `${getPrompt}`,
      n: 1,
      size: "512x512",
    });

    console.log("Response FROM DALL-E: ", response);
    const imageUrl = response.data[0].url;
    console.log("IMAGE URL: ", imageUrl);

    // Fetch the image
    //@ts-ignore
    const imageResponse = await fetch(imageUrl);
    console.log("URL FETCH:", imageResponse);

    // Determine the image type from the fetch response
    const imageType = imageResponse.headers.get('Content-Type') || "image/jpeg";

    // Fetch Convert to Blob
    const blob = await imageResponse.blob();
    console.log("Blob:", blob);
    console.log("Blob size:", blob.size);
    console.log("Blob type:", blob.type);

    return { blob, imageType };
  } catch (error) {
    console.log(`Error Occurred in Image API: ${error}`);
    return null;
  }
}

export const GET = async (req: any, res: any) => {
  try {
    const prompt = req.nextUrl.searchParams.get("prompt");
    let bodyContents = null;
    let contentImageType = "image/jpeg"; // Default image type

    const { blob, imageType} :any = await getImage(prompt);
    bodyContents = blob;
    contentImageType = imageType
        
    
    if (bodyContents) {
      return new Response(bodyContents, {
        status: 200,
        headers: {
          'Content-Type': contentImageType,
        },
      });
    } else {
      return new Response(
        `body contents were found to be empty`,
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(`An Error Occurred Generating The Image: ${error}`);
    return new Response(`Error Occurred Generating Image: ${error}`, {
      status: 500,
    });
  }
};
