import OpenAI from "openai";

const openai = new OpenAI();

const reduceString = (input: string) => {

}

async function getMovieImage(getPrompt: string) {
    
    const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: `Generate a movie poster based off this prompt for potential viewers to look at if it was at a movie theater, Plot: A movie about ${getPrompt}`,
        n: 1,
        size: "512x512",
      });

      console.log("IMAGE FROM DALL-E: ", response)
      const imageUrl = response.data[0].url;
      console.log("IMAGE URL: ", imageUrl)
      return imageUrl
   
}

export const GET = async (req: any, res: any) => { 
    try{
        const type = req.nextUrl.searchParams.get("type")
        const prompt = req.nextUrl.searchParams.get("prompt");
        let bodyContents = null;
      switch (type){
        case "movie":
           bodyContents = await getMovieImage(prompt)
           break;
        default:
           bodyContents = null
           break;
      }

      if(bodyContents)
      {
      return new Response(JSON.stringify(bodyContents), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      }else{
        return new Response(`No Type Found For Get Request, Type: ${type}, Is Not Valid`, { status: 500 })
      }
    }catch(error)
    {   
        console.log(`An Error Occured Generating The Image: ${error}`)
        return new Response(`Error Occured Generating Image: ${error}`, { status: 500})
    }
}