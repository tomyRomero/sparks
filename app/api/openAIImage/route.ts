import OpenAI from "openai";

const openai = new OpenAI();

async function getMovieImage(getPrompt: string) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: `Generate a movie poster based off this prompt for potential viewers to look at if it was at a movie theater, Plot: A movie about ${getPrompt}`,
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
    const type = req.nextUrl.searchParams.get("type");
    const prompt = req.nextUrl.searchParams.get("prompt");
    let bodyContents = null;
    let imageTypee = "image/jpeg"; // Default image type

    switch (type) {
      case "movie":
        const { blob, imageType} :any = await getMovieImage(prompt);
        bodyContents = blob;
        imageTypee = imageType
        break;
      default:
        bodyContents = null;
        break;
    }

    if (bodyContents) {
      return new Response(bodyContents, {
        status: 200,
        headers: {
          'Content-Type': imageTypee,
        },
      });
    } else {
      return new Response(
        `No Type Found For Get Request, Type: ${type}, Is Not Valid`,
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
